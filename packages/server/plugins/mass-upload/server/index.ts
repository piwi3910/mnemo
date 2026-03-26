import type { Request, Response } from "express";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import multer from "multer";

import type { PluginAPI } from "../../../src/plugins/types.js";
import { SessionStore } from "./sessionStore.js";
import { validateFile, flattenNotePaths } from "./validation.js";

// Track in-flight confirm promises for graceful shutdown
const inFlightConfirms = new Set<Promise<unknown>>();

let globalSessionStore: SessionStore | null = null;

export function createHandlers(api: PluginAPI, sessionStore: SessionStore) {
  const validate = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId: string | undefined = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const maxFileSize =
        ((await api.settings.get("maxFileSize")) as number) || 1048576;

      const upload = multer({
        storage: multer.memoryStorage(),
        limits: { files: 500, fileSize: maxFileSize },
      });

      try {
        await new Promise<void>((resolve, reject) => {
          upload.array("files", 500)(req as any, res as any, (err: any) =>
            err ? reject(err) : resolve()
          );
        });
      } catch (multerErr: any) {
        res.status(400).json({ error: multerErr.message || "Upload failed" });
        return;
      }

      const targetFolder =
        typeof req.query["targetFolder"] === "string"
          ? req.query["targetFolder"]
          : "";
      const preserveStructure = req.query["preserveStructure"] === "true";

      const session = await sessionStore.create(userId);
      session.targetFolder = targetFolder;
      session.preserveStructure = preserveStructure;

      // Fetch existing note paths for duplicate detection
      const noteTree = await api.notes.list(userId);
      const existingPaths = flattenNotePaths(noteTree);

      const uploadedFiles = (req as any).files as Express.Multer.File[];

      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const originalName = file.originalname;

        // Build resolved path
        let resolvedPath: string;
        if (preserveStructure && (file as any).fieldname === "files") {
          // Use the relative path from the file's webkitRelativePath-style name if provided
          // Otherwise fall back to originalname
          resolvedPath = path.posix.join(targetFolder, originalName);
        } else {
          resolvedPath = path.posix.join(
            targetFolder,
            path.basename(originalName)
          );
        }

        const content = file.buffer;
        const result = validateFile(
          originalName,
          resolvedPath,
          content,
          maxFileSize,
          existingPaths
        );

        // Write file content to session dir for later use in confirm
        const sessionFilePath = path.join(session.dir, String(i) + ".md");
        await fs.writeFile(sessionFilePath, content);

        session.files.push({
          index: i,
          originalName: result.originalName,
          resolvedPath: result.resolvedPath,
          size: result.size,
          status: result.status,
          errors: result.errors,
          existingNote: result.existingNote,
        });
      }

      res.json({
        sessionId: session.id,
        targetFolder: session.targetFolder,
        preserveStructure: session.preserveStructure,
        files: session.files,
      });
    } catch (err: any) {
      api.log.error("Mass Upload /validate error", err);
      res.status(500).json({ error: "Validation failed" });
    }
  };

  const confirm = async (req: Request, res: Response): Promise<void> => {
    const work = async () => {
      try {
        const userId: string | undefined = (req as any).user?.id;
        if (!userId) {
          res.status(401).json({ error: "Unauthorized" });
          return;
        }

        const { sessionId, actions } = req.body as {
          sessionId?: string;
          actions?: Array<{ index: number; action: "create" | "overwrite" | "skip" }>;
        };

        if (!sessionId) {
          res.status(400).json({ error: "sessionId is required" });
          return;
        }

        const session = sessionStore.get(sessionId, userId);
        if (!session) {
          res.status(410).json({ error: "Session not found or expired" });
          return;
        }

        const created: string[] = [];
        const overwritten: string[] = [];
        const errors: Array<{ index: number; error: string }> = [];

        const fileActions = actions ?? [];

        for (const action of fileActions) {
          const fileEntry = session.files[action.index];
          if (!fileEntry) {
            errors.push({ index: action.index, error: "File index out of range" });
            continue;
          }

          if (action.action === "skip") continue;

          const sessionFilePath = path.join(
            session.dir,
            String(action.index) + ".md"
          );

          let content: string;
          try {
            content = await fs.readFile(sessionFilePath, "utf-8");
          } catch {
            errors.push({ index: action.index, error: "Could not read session file" });
            continue;
          }

          try {
            if (action.action === "create") {
              await api.notes.create(userId, fileEntry.resolvedPath, content);
              created.push(fileEntry.resolvedPath);
            } else if (action.action === "overwrite") {
              await api.notes.update(userId, fileEntry.resolvedPath, content);
              overwritten.push(fileEntry.resolvedPath);
            }
          } catch (noteErr: any) {
            errors.push({
              index: action.index,
              error: noteErr?.message || "Failed to write note",
            });
          }
        }

        await sessionStore.delete(sessionId, userId);

        res.json({ created, overwritten, errors });
      } catch (err: any) {
        api.log.error("Mass Upload /confirm error", err);
        res.status(500).json({ error: "Confirm failed" });
      }
    };

    const p = work();
    inFlightConfirms.add(p);
    p.finally(() => inFlightConfirms.delete(p));
    await p;
  };

  const deleteSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId: string | undefined = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { sessionId } = req.params;
      const deleted = await sessionStore.delete(sessionId, userId);
      if (!deleted) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      res.json({ deleted: true });
    } catch (err: any) {
      api.log.error("Mass Upload DELETE /session error", err);
      res.status(500).json({ error: "Delete failed" });
    }
  };

  return { validate, confirm, deleteSession };
}

export function activate(api: PluginAPI): void {
  api.log.info("Mass Upload plugin activated");

  const baseDir = path.join(os.tmpdir(), "mnemo-mass-upload");
  const sessionStore = new SessionStore(baseDir, {
    maxPerUser: 5,
    expiryMs: 30 * 60 * 1000,
  });
  globalSessionStore = sessionStore;

  const handlers = createHandlers(api, sessionStore);

  api.routes.register("post", "/validate", handlers.validate as any);
  api.routes.register("post", "/confirm", handlers.confirm as any);
  api.routes.register(
    "delete",
    "/session/:sessionId",
    handlers.deleteSession as any
  );
}

export async function deactivate(): Promise<void> {
  // Await all in-flight confirm operations
  if (inFlightConfirms.size > 0) {
    await Promise.allSettled([...inFlightConfirms]);
  }

  if (globalSessionStore) {
    await globalSessionStore.cleanAll();
    globalSessionStore.dispose();
    globalSessionStore = null;
  }
}

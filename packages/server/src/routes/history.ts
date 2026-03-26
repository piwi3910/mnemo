import { Router, Request, Response, NextFunction } from "express";
import * as fs from "fs/promises";
import * as path from "path";
import { getUserNotesDir } from "../services/userNotesDir.js";
import { requireUser, requireScope } from "../middleware/auth.js";
import { decodePathParam } from "../lib/pathUtils.js";
import { ValidationError, NotFoundError } from "../lib/errors.js";
import { writeNote } from "../services/noteService.js";

export const HISTORY_DIR = ".history";
export const MAX_VERSIONS = 50;

/**
 * Return the history directory for a given note path within a user notes dir.
 * e.g. notesDir/.history/folder/note.md/
 */
export function getNoteHistoryDir(userNotesDir: string, notePath: string): string {
  return path.join(userNotesDir, HISTORY_DIR, notePath);
}

/**
 * Save the current content of a note as a versioned snapshot in .history/.
 * Called by writeNote before overwriting the file.
 * Prunes oldest versions when MAX_VERSIONS is exceeded.
 */
export async function saveHistorySnapshot(
  userNotesDir: string,
  notePath: string,
  currentContent: string
): Promise<void> {
  const historyDir = getNoteHistoryDir(userNotesDir, notePath);
  await fs.mkdir(historyDir, { recursive: true });

  const timestamp = Date.now();
  const versionFile = path.join(historyDir, `${timestamp}.md`);
  await fs.writeFile(versionFile, currentContent, "utf-8");

  // Prune oldest versions if we exceed MAX_VERSIONS
  await pruneHistory(historyDir);
}

/**
 * Delete the oldest version files, keeping at most MAX_VERSIONS.
 */
async function pruneHistory(historyDir: string): Promise<void> {
  let entries: import("fs").Dirent[];
  try {
    entries = await fs.readdir(historyDir, { withFileTypes: true });
  } catch {
    return;
  }

  const versionFiles = entries
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => e.name)
    .sort(); // lexicographic sort = chronological for timestamp filenames

  if (versionFiles.length > MAX_VERSIONS) {
    const toDelete = versionFiles.slice(0, versionFiles.length - MAX_VERSIONS);
    for (const filename of toDelete) {
      try {
        await fs.unlink(path.join(historyDir, filename));
      } catch {
        // Best-effort
      }
    }
  }
}

export function createHistoryRouter(notesDir: string): Router {
  const router = Router();

  // GET /api/history/:path(*) — List all versions of a note
  router.get("/{*notePath}", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = requireUser(req);
      const notePath = decodePathParam(req.params.notePath);
      if (!notePath) {
        throw new ValidationError("Path is required");
      }

      const userDir = await getUserNotesDir(notesDir, user.id);
      const historyDir = getNoteHistoryDir(userDir, notePath);

      let entries: import("fs").Dirent[];
      try {
        entries = await fs.readdir(historyDir, { withFileTypes: true });
      } catch {
        // No history yet
        res.json({ versions: [] });
        return;
      }

      const versions: { timestamp: number; date: string; size: number }[] = [];

      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
        const timestampStr = entry.name.slice(0, -3); // strip .md
        const timestamp = parseInt(timestampStr, 10);
        if (isNaN(timestamp)) continue;

        const fullPath = path.join(historyDir, entry.name);
        const stat = await fs.stat(fullPath);

        versions.push({
          timestamp,
          date: new Date(timestamp).toISOString(),
          size: stat.size,
        });
      }

      // Sort newest first
      versions.sort((a, b) => b.timestamp - a.timestamp);

      res.json({ versions });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

export function createHistoryTimestampRouter(notesDir: string): Router {
  const router = Router();

  // GET /api/history-version/:path(*)?ts=:timestamp — Read a specific version
  router.get("/{*notePath}", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = requireUser(req);
      const notePath = decodePathParam(req.params.notePath);
      const timestamp = parseInt(req.query.ts as string, 10);

      if (!notePath) {
        throw new ValidationError("Path is required");
      }
      if (isNaN(timestamp)) {
        throw new ValidationError("Timestamp query parameter (ts) is required");
      }

      const userDir = await getUserNotesDir(notesDir, user.id);
      const historyDir = getNoteHistoryDir(userDir, notePath);
      const versionFile = path.join(historyDir, `${timestamp}.md`);

      // Security: ensure within history dir
      const resolvedVersion = path.resolve(versionFile);
      const resolvedHistoryDir = path.resolve(historyDir);
      if (!resolvedVersion.startsWith(resolvedHistoryDir + path.sep)) {
        throw new ValidationError("Invalid path");
      }

      let content: string;
      try {
        content = await fs.readFile(versionFile, "utf-8");
      } catch {
        throw new NotFoundError("Version not found");
      }

      res.json({ content, timestamp, date: new Date(timestamp).toISOString() });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

export function createHistoryRestoreRouter(notesDir: string): Router {
  const router = Router();

  // POST /api/history-restore/:path(*)?ts=:timestamp — Restore a specific version
  router.post("/{*notePath}", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = requireUser(req);
      requireScope(req, "read-write");

      const notePath = decodePathParam(req.params.notePath);
      const timestamp = parseInt(req.query.ts as string, 10);

      if (!notePath) {
        throw new ValidationError("Path is required");
      }
      if (isNaN(timestamp)) {
        throw new ValidationError("Timestamp query parameter (ts) is required");
      }

      const userDir = await getUserNotesDir(notesDir, user.id);
      const historyDir = getNoteHistoryDir(userDir, notePath);
      const versionFile = path.join(historyDir, `${timestamp}.md`);

      // Security: ensure within history dir
      const resolvedVersion = path.resolve(versionFile);
      const resolvedHistoryDir = path.resolve(historyDir);
      if (!resolvedVersion.startsWith(resolvedHistoryDir + path.sep)) {
        throw new ValidationError("Invalid path");
      }

      let content: string;
      try {
        content = await fs.readFile(versionFile, "utf-8");
      } catch {
        throw new NotFoundError("Version not found");
      }

      // writeNote will save the current content as a new history snapshot first
      await writeNote(userDir, notePath, content, user.id);

      res.json({ restored: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

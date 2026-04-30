import { Router, Request, Response } from "express";
import multer from "multer";
import * as crypto from "crypto";
import * as fs from "fs/promises";
import * as path from "path";
import { requireUser } from "../middleware/auth.js";
import { prisma } from "../prisma.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

export function createAttachmentsRouter(storageRoot: string): Router {
  const router = Router();

  // multer error handler (e.g., LIMIT_FILE_SIZE -> 413)
  function multerErrorHandler(err: unknown, _req: Request, res: Response, next: (err?: unknown) => void): void {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(413).json({ error: "Attachment exceeds 50MB limit" });
        return;
      }
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }

  // POST /api/attachments — upload
  router.post(
    "/",
    (req, res, next) => {
      upload.single("file")(req, res, (err) => {
        if (err) return multerErrorHandler(err, req, res, next);
        next();
      });
    },
    async (req: Request, res: Response) => {
    try {
      const user = requireUser(req);
      if (!req.file) {
        res.status(400).json({ error: "file required" });
        return;
      }
      const notePath = String(req.body?.notePath ?? "");
      const hash = crypto.createHash("sha256").update(req.file.buffer).digest("hex");
      const userRoot = path.join(storageRoot, user.id);
      const targetPath = path.join(userRoot, "attachments", hash);
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, req.file.buffer);
      const att = await prisma.attachment.create({
        data: {
          userId: user.id,
          notePath,
          filename: req.file.originalname,
          contentHash: `sha256:${hash}`,
          sizeBytes: req.file.size,
          mimeType: req.file.mimetype,
          storagePath: targetPath,
        },
      });
      res.json(att);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Upload failed" });
    }
  });

  // GET /api/attachments/:id — download
  router.get("/:id", async (req: Request, res: Response) => {
    try {
      const user = requireUser(req);
      const att = await prisma.attachment.findUnique({ where: { id: req.params.id as string } });
      if (!att || att.userId !== user.id) {
        res.status(404).end();
        return;
      }
      res.setHeader("Content-Type", att.mimeType);
      res.setHeader("ETag", `"${att.contentHash}"`);
      res.setHeader("Cache-Control", "max-age=31536000, immutable");
      const data = await fs.readFile(att.storagePath);
      res.send(data);
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Download failed" });
    }
  });

  return router;
}

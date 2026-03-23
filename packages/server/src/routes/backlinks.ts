import { Router, Request, Response } from "express";
import { getBacklinks } from "../services/graphService";

export function createBacklinksRouter(): Router {
  const router = Router();

  // GET /api/backlinks/:path(*) — Get notes that link TO this note
  router.get("/:path(.*)", async (req: Request, res: Response) => {
    try {
      const notePath = decodeURIComponent(req.params.path as string);
      if (!notePath) {
        res.status(400).json({ error: "Path is required" });
        return;
      }

      const fullNotePath = notePath.endsWith(".md")
        ? notePath
        : `${notePath}.md`;

      const backlinks = await getBacklinks(fullNotePath);
      res.json(backlinks);
    } catch (err) {
      console.error("Error fetching backlinks:", err);
      res.status(500).json({ error: "Failed to fetch backlinks" });
    }
  });

  return router;
}

import { Router, Request, Response } from "express";
import * as path from "path";
import * as fs from "fs/promises";

export function createTemplatesRouter(notesDir: string): Router {
  const router = Router();

  const templatesDir = path.join(notesDir, "Templates");

  // GET /api/templates — List all templates
  router.get("/", async (_req: Request, res: Response) => {
    try {
      // Ensure templates directory exists
      await fs.mkdir(templatesDir, { recursive: true });

      const entries = await fs.readdir(templatesDir, { withFileTypes: true });
      const templates = entries
        .filter((e) => e.isFile() && e.name.endsWith(".md"))
        .map((e) => ({
          name: e.name.replace(/\.md$/, ""),
          path: `Templates/${e.name}`,
        }));

      res.json(templates);
    } catch (err) {
      console.error("Error listing templates:", err);
      res.status(500).json({ error: "Failed to list templates" });
    }
  });

  // GET /api/templates/:name — Get template content
  router.get("/:name", async (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      const filePath = path.join(templatesDir, `${name}.md`);

      // Security check
      const resolved = path.resolve(filePath);
      if (!resolved.startsWith(path.resolve(templatesDir))) {
        res.status(400).json({ error: "Invalid template name" });
        return;
      }

      const content = await fs.readFile(filePath, "utf-8");
      res.json({ name, content });
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message.includes("ENOENT") || err.message.includes("no such file"))
      ) {
        res.status(404).json({ error: "Template not found" });
        return;
      }
      console.error("Error reading template:", err);
      res.status(500).json({ error: "Failed to read template" });
    }
  });

  return router;
}

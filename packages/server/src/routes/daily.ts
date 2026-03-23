import { Router, Request, Response } from "express";
import * as path from "path";
import * as fs from "fs/promises";
import { readNote, writeNote } from "../services/noteService";
import { AppDataSource } from "../data-source";
import { Settings } from "../entities/Settings";

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function getDailyTemplate(): Promise<string> {
  try {
    const repo = AppDataSource.getRepository(Settings);
    const setting = await repo.findOneBy({ key: "dailyNoteTemplate" });
    if (setting?.value) return setting.value;
  } catch {
    // Use default
  }
  return `# Daily Note — {{date}}\n\n## Tasks\n- [ ] \n\n## Notes\n\n\n#daily\n`;
}

function applyTemplateVars(
  template: string,
  vars: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return result;
}

export function createDailyRouter(notesDir: string): Router {
  const router = Router();

  // POST /api/daily — Create or get today's daily note
  router.post("/", async (_req: Request, res: Response) => {
    try {
      const today = formatDate(new Date());
      const notePath = `Daily/${today}.md`;
      const fullPath = path.join(notesDir, notePath);

      // Check if note already exists
      try {
        await fs.access(fullPath);
        // Note exists, just return it
        const note = await readNote(notesDir, notePath);
        res.json(note);
        return;
      } catch {
        // Note doesn't exist, create it
      }

      // Create the Daily directory if needed
      await fs.mkdir(path.join(notesDir, "Daily"), { recursive: true });

      // Get template and apply variables
      const template = await getDailyTemplate();
      const content = applyTemplateVars(template, {
        date: today,
        title: `Daily Note — ${today}`,
      });

      await writeNote(notesDir, notePath, content);
      const note = await readNote(notesDir, notePath);
      res.status(201).json(note);
    } catch (err) {
      console.error("Error creating daily note:", err);
      res.status(500).json({ error: "Failed to create daily note" });
    }
  });

  return router;
}

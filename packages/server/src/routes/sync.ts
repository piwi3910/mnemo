import { Router, Request, Response } from "express";
import * as fs from "fs/promises";
import * as path from "path";
import { prisma } from "../prisma.js";
import { requireUser, requireScope } from "../middleware/auth.js";
import { getUserNotesDir } from "../services/userNotesDir.js";
import { writeNote, deleteNote } from "../services/noteService.js";

export function createSyncRouter(notesDir: string): Router {
  const router = Router();

  // POST /api/sync/pull
  router.post("/pull", async (req: Request, res: Response) => {
    try {
      const user = requireUser(req);
      const userId = user.id;
      const lastPulledAtMs: number = req.body?.last_pulled_at ?? 0;
      const lastPulledAt = new Date(lastPulledAtMs);
      const isFirstSync = lastPulledAtMs === 0;
      const timestamp = Date.now();

      const userDir = await getUserNotesDir(notesDir, userId);

      // --- Notes ---
      const searchEntries = await prisma.searchIndex.findMany({
        where: { userId, modifiedAt: { gt: lastPulledAt } },
      });

      const noteRecords: object[] = [];
      for (const entry of searchEntries) {
        try {
          const content = await fs.readFile(path.join(userDir, entry.notePath), "utf-8");
          noteRecords.push({
            id: entry.notePath,
            path: entry.notePath,
            title: entry.title,
            content,
            tags: entry.tags,
            modified_at: entry.modifiedAt.getTime(),
          });
        } catch {
          // File may have been deleted after index update — skip it
        }
      }

      // --- Settings ---
      const settingsEntries = await prisma.settings.findMany({
        where: { userId, updatedAt: { gt: lastPulledAt } },
      });

      const settingsRecords = settingsEntries.map((s) => ({
        id: `${s.key}:${userId}`,
        key: s.key,
        value: s.value,
      }));

      // --- NoteShares ---
      const noteShareEntries = await prisma.noteShare.findMany({
        where: {
          OR: [{ ownerUserId: userId }, { sharedWithUserId: userId }],
          updatedAt: { gt: lastPulledAt },
        },
      });

      const noteShareRecords = noteShareEntries.map((ns) => ({
        id: ns.id,
        owner_user_id: ns.ownerUserId,
        path: ns.path,
        is_folder: ns.isFolder,
        shared_with_user_id: ns.sharedWithUserId,
        permission: ns.permission,
        created_at: ns.createdAt.getTime(),
        updated_at: ns.updatedAt.getTime(),
      }));

      // --- TrashItems ---
      const trashEntries = await prisma.trashItem.findMany({
        where: { userId, trashedAt: { gt: lastPulledAt } },
      });

      const trashRecords = trashEntries.map((t) => ({
        id: t.id,
        original_path: t.originalPath,
        trashed_at: t.trashedAt.getTime(),
      }));

      // --- Deletions ---
      const deletions = await prisma.syncDeletion.findMany({
        where: { userId, deletedAt: { gt: lastPulledAt } },
      });

      const deletedNotes: string[] = [];
      const deletedSettings: string[] = [];
      const deletedNoteShares: string[] = [];
      const deletedTrashItems: string[] = [];

      for (const d of deletions) {
        switch (d.tableName) {
          case "notes":
            deletedNotes.push(d.recordId);
            break;
          case "settings":
            deletedSettings.push(d.recordId);
            break;
          case "note_shares":
            deletedNoteShares.push(d.recordId);
            break;
          case "trash_items":
            deletedTrashItems.push(d.recordId);
            break;
        }
      }

      // Build WatermelonDB response
      // On first sync everything goes in "created"; otherwise everything goes in "updated"
      const notesChanges = isFirstSync
        ? { created: noteRecords, updated: [], deleted: deletedNotes }
        : { created: [], updated: noteRecords, deleted: deletedNotes };

      const settingsChanges = isFirstSync
        ? { created: settingsRecords, updated: [], deleted: deletedSettings }
        : { created: [], updated: settingsRecords, deleted: deletedSettings };

      const noteSharesChanges = isFirstSync
        ? { created: noteShareRecords, updated: [], deleted: deletedNoteShares }
        : { created: [], updated: noteShareRecords, deleted: deletedNoteShares };

      const trashItemsChanges = isFirstSync
        ? { created: trashRecords, updated: [], deleted: deletedTrashItems }
        : { created: [], updated: trashRecords, deleted: deletedTrashItems };

      res.json({
        changes: {
          notes: notesChanges,
          settings: settingsChanges,
          note_shares: noteSharesChanges,
          trash_items: trashItemsChanges,
        },
        timestamp,
      });
    } catch (err) {
      console.error("[sync]", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Sync pull failed" });
    }
  });

  // POST /api/sync/push
  router.post("/push", async (req: Request, res: Response) => {
    try {
      const user = requireUser(req);
      requireScope(req, "read-write");
      const userId = user.id;

      const changes = req.body?.changes ?? {};
      const userDir = await getUserNotesDir(notesDir, userId);

      // --- Notes ---
      const notesChanges = changes.notes ?? {};
      const notesCreated: Array<{ path: string; content: string }> = notesChanges.created ?? [];
      const notesUpdated: Array<{ path: string; content: string }> = notesChanges.updated ?? [];
      const notesDeleted: string[] = notesChanges.deleted ?? [];

      for (const note of [...notesCreated, ...notesUpdated]) {
        try {
          await writeNote(userDir, note.path, note.content ?? "", userId);
        } catch (err) {
          console.error("[sync] Failed to write note", note.path, err);
        }
      }

      for (const notePath of notesDeleted) {
        try {
          await deleteNote(userDir, notePath, userId);
        } catch (err) {
          console.error("[sync] Failed to delete note", notePath, err);
        }
      }

      // --- Settings ---
      const settingsChanges = changes.settings ?? {};
      const settingsCreated: Array<{ key: string; value: string }> = settingsChanges.created ?? [];
      const settingsUpdated: Array<{ key: string; value: string }> = settingsChanges.updated ?? [];

      for (const setting of [...settingsCreated, ...settingsUpdated]) {
        try {
          await prisma.settings.upsert({
            where: { key_userId: { key: setting.key, userId } },
            update: { value: setting.value },
            create: { key: setting.key, userId, value: setting.value },
          });
        } catch (err) {
          console.error("[sync] Failed to upsert setting", setting.key, err);
        }
      }

      // note_shares and trash_items are read-only from mobile — ignore push changes

      res.json({});
    } catch (err) {
      console.error("[sync]", err);
      res.status(500).json({ error: err instanceof Error ? err.message : "Sync push failed" });
    }
  });

  return router;
}

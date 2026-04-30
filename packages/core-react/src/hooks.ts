// packages/core-react/src/hooks.ts
import { useSyncExternalStore, useMemo, useEffect, useState } from "react";
import { useKryton } from "./provider";
import type * as Y from "yjs";
import type {
  Note, Folder, Tag, Settings, NoteShare, TrashItem,
} from "@azrtydxb/core";

interface ChangeEvent {
  entityType: string;
  ids: string[];
  source: string;
}

function makeListHook<T>(entityType: string, getList: (core: any) => T[]) {
  return function useList(): T[] {
    const core = useKryton();
    const [items, setItems] = useState<T[]>(() => {
      try { return getList(core); } catch { return []; }
    });
    useEffect(() => {
      return core.bus.on("change", (e: ChangeEvent) => {
        if (e.entityType === entityType) {
          try { setItems(getList(core)); } catch { /* ignore */ }
        }
      });
    }, [core]);
    return items;
  };
}

// ---------------------------------------------------------------------------
// Note hooks
// ---------------------------------------------------------------------------

export function useNote(id: string): Note | null {
  const core = useKryton();
  const subscribe = useMemo(
    () =>
      (cb: () => void): (() => void) =>
        core.bus.on("change", (e: ChangeEvent) => {
          if (e.entityType === "notes" && e.ids.includes(id)) cb();
        }),
    [core, id],
  );
  const get = (): Note | null => (core.notes.findById(id) as Note | undefined) ?? null;
  return useSyncExternalStore(subscribe, get, get);
}

export const useNotes = makeListHook<Note>("notes", c => c.notes.list() as Note[]);
export const useFolders = makeListHook<Folder>("folders", c => (c.folders?.list() as Folder[]) ?? []);
export const useTags = makeListHook<Tag>("tags", c => (c.tags?.list() as Tag[]) ?? []);
export const useSettings = makeListHook<Settings>("settings", c => (c.settings?.list() as Settings[]) ?? []);
export const useNoteShares = makeListHook<NoteShare>("note_shares", c => (c.noteShares?.list() as NoteShare[]) ?? []);
export const useTrashItems = makeListHook<TrashItem>("trash_items", c => (c.trashItems?.list() as TrashItem[]) ?? []);

// ---------------------------------------------------------------------------
// Setting-by-key convenience
// ---------------------------------------------------------------------------

/** Returns the value of a single setting by key, or null. Subscribes to changes. */
export function useSetting<T = string>(key: string): T | null {
  const all = useSettings();
  return useMemo(() => {
    const row = all.find(s => s.key === key);
    if (!row) return null;
    return row.value as unknown as T;
  }, [all, key]);
}

// ---------------------------------------------------------------------------
// Sync status hook
// ---------------------------------------------------------------------------

export interface SyncStatus {
  lastPullAt: number | null;
  lastPushAt: number | null;
  pending: number;
  online: boolean;
}

function readSyncStatus(core: any): SyncStatus {
  const lastPull = parseInt(core.storage?.get?.("last_pull_at", "0") ?? "0", 10);
  const lastPush = parseInt(core.storage?.get?.("last_push_at", "0") ?? "0", 10);
  return {
    lastPullAt: lastPull || null,
    lastPushAt: lastPush || null,
    pending: 0,
    online: true,
  };
}

export function useSyncStatus(): SyncStatus {
  const core = useKryton();
  const [status, setStatus] = useState<SyncStatus>(() => readSyncStatus(core));
  useEffect(() => {
    return core.bus.on("sync:complete", () => setStatus(readSyncStatus(core)));
  }, [core]);
  return status;
}

// ---------------------------------------------------------------------------
// Yjs document hook
// ---------------------------------------------------------------------------

export function useYjsDoc(docId: string): Y.Doc | null {
  const core = useKryton();
  const [doc, setDoc] = useState<Y.Doc | null>(null);

  useEffect(() => {
    if (!docId) return;
    let active = true;
    core.yjs.openDocument(docId).then((d: Y.Doc) => { if (active) setDoc(d); });
    return () => {
      active = false;
      core.yjs.closeDocument(docId);
    };
  }, [core, docId]);

  return doc;
}

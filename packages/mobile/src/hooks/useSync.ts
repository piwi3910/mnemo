import { useState, useEffect, useCallback, useRef } from "react";
import { syncWithServer } from "../db/sync";

export interface SyncState {
  syncing: boolean;
  lastSyncAt: Date | null;
  error: string | null;
}

export interface SyncActions {
  sync: () => Promise<void>;
}

export type UseSyncReturn = SyncState & SyncActions;

export function useSync(): UseSyncReturn {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Use a ref for the guard so the `sync` callback reference stays stable
  const syncingRef = useRef(false);

  const sync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    setError(null);
    try {
      await syncWithServer();
      setLastSyncAt(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sync failed";
      setError(message);
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, []);

  // Auto-sync on mount
  useEffect(() => {
    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { syncing, lastSyncAt, error, sync };
}

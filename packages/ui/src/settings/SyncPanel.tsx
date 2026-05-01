import * as React from "react";
import { Button } from "../primitives/button";

export interface SyncPanelProps {
  lastSyncedAt?: Date | string | null;
  serverUrl?: string;
  isSyncing?: boolean;
  onSyncNow?: () => void;
}

function formatLastSynced(value: Date | string | null | undefined): string {
  if (!value) return "Never";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "Never";
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return d.toLocaleDateString();
}

export function SyncPanel({
  lastSyncedAt,
  serverUrl,
  isSyncing = false,
  onSyncNow,
}: SyncPanelProps) {
  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Sync</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Sync status and server configuration.
        </p>
      </div>

      <section className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <InfoRow label="Last synced" value={formatLastSynced(lastSyncedAt)} />
        {serverUrl && <InfoRow label="Server" value={serverUrl} mono />}
      </section>

      {onSyncNow && (
        <Button
          variant="outline"
          size="sm"
          onClick={onSyncNow}
          disabled={isSyncing}
          aria-label="Sync now"
        >
          {isSyncing ? "Syncing…" : "Sync now"}
        </Button>
      )}
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  mono?: boolean;
}

function InfoRow({ label, value, mono }: InfoRowProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">{label}</span>
      <span
        className={
          mono
            ? "text-sm font-mono text-gray-900 dark:text-gray-50 break-all text-right"
            : "text-sm text-gray-900 dark:text-gray-50 text-right"
        }
      >
        {value}
      </span>
    </div>
  );
}

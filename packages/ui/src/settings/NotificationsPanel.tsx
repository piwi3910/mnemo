import * as React from "react";
import { Switch } from "../primitives/switch";

export type NotificationCategory = "sync-complete" | "share-invite" | "agent-finished";

export interface NotificationSetting {
  category: NotificationCategory;
  label: string;
  description?: string;
  enabled: boolean;
}

export interface NotificationsPanelProps {
  notifications: NotificationSetting[];
  onToggle?: (category: NotificationCategory, enabled: boolean) => void;
}

const DEFAULT_LABELS: Record<NotificationCategory, string> = {
  "sync-complete": "Sync complete",
  "share-invite": "Share invite",
  "agent-finished": "Agent finished",
};

export function NotificationsPanel({
  notifications,
  onToggle,
}: NotificationsPanelProps) {
  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Notifications</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Choose which events trigger notifications.
        </p>
      </div>

      <section className="space-y-2">
        {notifications.map((n) => (
          <div
            key={n.category}
            className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700"
          >
            <div className="space-y-0.5">
              <label
                htmlFor={`notif-${n.category}`}
                className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                {n.label ?? DEFAULT_LABELS[n.category]}
              </label>
              {n.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{n.description}</p>
              )}
            </div>
            <Switch
              id={`notif-${n.category}`}
              checked={n.enabled}
              onCheckedChange={(checked) => onToggle?.(n.category, checked)}
              disabled={!onToggle}
            />
          </div>
        ))}
      </section>
    </div>
  );
}

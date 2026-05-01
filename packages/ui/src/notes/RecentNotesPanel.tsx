import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "../lib/utils";
import type { NoteData } from "../data/types";

export interface RecentNotesPanelProps {
  /** Notes sorted by most-recently-modified first; caller controls ordering. */
  notes: NoteData[];
  activeNotePath?: string | null;
  onSelect: (path: string) => void;
  /** Maximum number of notes to display. Default 10. */
  limit?: number;
  /** Formatter for the modifiedAt timestamp. */
  formatDate?: (timestamp: number) => string;
  className?: string;
}

function defaultFormatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function RecentNotesPanel({
  notes,
  activeNotePath = null,
  onSelect,
  limit = 10,
  formatDate = defaultFormatDate,
  className,
}: RecentNotesPanelProps) {
  const sorted = React.useMemo(
    () => [...notes].sort((a, b) => b.modifiedAt - a.modifiedAt).slice(0, limit),
    [notes, limit],
  );

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <Clock size={13} className="text-gray-400" aria-hidden="true" />
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Recent
        </span>
      </div>
      {sorted.length === 0 ? (
        <p className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 italic">
          No recent notes
        </p>
      ) : (
        <ul>
          {sorted.map((note) => {
            const displayName =
              note.title || note.path.split("/").pop()?.replace(/\.md$/, "") || note.path;
            const isActive = note.path === activeNotePath;
            return (
              <li key={note.id}>
                <button
                  type="button"
                  onClick={() => onSelect(note.path)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors duration-100 text-left",
                    isActive
                      ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-700/40",
                  )}
                >
                  <span className="flex-1 truncate">{displayName}</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
                    {formatDate(note.modifiedAt)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

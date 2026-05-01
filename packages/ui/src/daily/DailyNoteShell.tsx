import * as React from "react";
import { Calendar } from "lucide-react";
import { cn } from "../lib/utils";

export interface DailyNoteShellProps {
  /** ISO date string (YYYY-MM-DD) this daily note is for */
  date: string;
  /** Rendered note editor/content, passed as children */
  children?: React.ReactNode;
  /** Optional extra controls rendered in the header (e.g. nav arrows) */
  headerActions?: React.ReactNode;
  className?: string;
}

function formatDisplayDate(isoDate: string): string {
  try {
    const d = new Date(`${isoDate}T00:00:00`);
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}

/**
 * Layout shell for a daily note page.
 * Provides the standard date header; children slot contains the editor.
 */
export function DailyNoteShell({
  date,
  children,
  headerActions,
  className,
}: DailyNoteShellProps) {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Date header */}
      <div className="flex items-center justify-between px-6 py-3 border-b dark:border-surface-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-violet-500" />
          <h1 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {formatDisplayDate(date)}
          </h1>
        </div>
        {headerActions && (
          <div className="flex items-center gap-1">{headerActions}</div>
        )}
      </div>

      {/* Note content */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

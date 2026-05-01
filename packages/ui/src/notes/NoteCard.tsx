import * as React from "react";
import { FileText, Star } from "lucide-react";
import { cn } from "../lib/utils";
import type { NoteData } from "../data/types";

export interface NoteCardProps {
  note: NoteData;
  isActive?: boolean;
  isStarred?: boolean;
  onSelect: (path: string) => void;
  onToggleStar?: (path: string) => void;
  className?: string;
}

export function NoteCard({
  note,
  isActive = false,
  isStarred = false,
  onSelect,
  onToggleStar,
  className,
}: NoteCardProps) {
  const displayName = note.title || note.path.split("/").pop()?.replace(/\.md$/, "") || note.path;
  const tags = React.useMemo(() => {
    try {
      return JSON.parse(note.tags) as string[];
    } catch {
      return [] as string[];
    }
  }, [note.tags]);

  return (
    <div
      className={cn(
        "group flex items-start gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors duration-100",
        isActive
          ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-700/40",
        className,
      )}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(note.path)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(note.path);
      }}
    >
      <FileText
        size={15}
        aria-hidden="true"
        className={cn(
          "flex-shrink-0 mt-0.5",
          isActive ? "text-violet-500" : "text-gray-400 dark:text-gray-500",
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-medium leading-tight">{displayName}</div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-block px-1 py-0 rounded text-[10px] bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      {onToggleStar && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar(note.path);
          }}
          className={cn(
            "p-0.5 rounded transition-opacity flex-shrink-0",
            isStarred
              ? "text-yellow-500 opacity-100"
              : "opacity-0 group-hover:opacity-100 text-gray-400 hover:text-yellow-500",
          )}
          title={isStarred ? "Unstar" : "Star"}
          aria-label={isStarred ? "Unstar note" : "Star note"}
        >
          <Star size={13} aria-hidden="true" fill={isStarred ? "currentColor" : "none"} />
        </button>
      )}
    </div>
  );
}

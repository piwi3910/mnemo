import * as React from "react";
import { useState, useCallback } from "react";
import { ChevronRight, X } from "lucide-react";
import { TagList, type TagEntry } from "./TagList";
import { cn } from "../lib/utils";

export type { TagEntry };

export interface TagNoteItem {
  notePath: string;
  title: string;
}

export interface TagsScreenProps {
  tags: TagEntry[];
  /** Notes for the currently selected tag. */
  tagNotes: TagNoteItem[];
  /** Whether tagNotes are being loaded. */
  loadingNotes?: boolean;
  /** The currently selected/active tag (controlled). */
  selectedTag?: string | null;
  onTagSelect: (tag: string | null) => void;
  onNoteSelect: (path: string) => void;
  /** Allow collapsing the panel. Defaults to true (expanded). */
  defaultExpanded?: boolean;
  className?: string;
}

/**
 * Tags panel — replaces the client-side `TagPane`. Data-fetching is handled by
 * the parent; this component is purely presentational.
 */
export function TagsScreen({
  tags,
  tagNotes,
  loadingNotes = false,
  selectedTag = null,
  onTagSelect,
  onNoteSelect,
  defaultExpanded = true,
  className,
}: TagsScreenProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleTagClick = useCallback(
    (tag: string) => {
      onTagSelect(selectedTag === tag ? null : tag);
    },
    [selectedTag, onTagSelect],
  );

  if (tags.length === 0) return null;

  return (
    <div className={cn("h-full flex flex-col overflow-hidden", className)}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 w-full px-3 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
      >
        <ChevronRight
          size={12}
          className={cn(
            "transition-transform duration-150",
            expanded && "rotate-90",
          )}
        />
        Tags
      </button>

      {expanded && (
        <div className="px-2 pb-2 flex-1 overflow-y-auto">
          <TagList
            tags={tags}
            selectedTag={selectedTag}
            onTagClick={handleTagClick}
          />

          {selectedTag && (
            <div className="mt-2 bg-white dark:bg-surface-950 rounded-md border p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  #{selectedTag}
                </span>
                <button
                  onClick={() => onTagSelect(null)}
                  className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Close tag notes"
                >
                  <X size={12} className="text-gray-400" />
                </button>
              </div>

              {loadingNotes ? (
                <p className="text-xs text-gray-400">Loading…</p>
              ) : (
                <ul className="space-y-0.5">
                  {tagNotes.map((note) => (
                    <li key={note.notePath}>
                      <button
                        onClick={() => onNoteSelect(note.notePath)}
                        className="text-xs text-violet-500 dark:text-violet-400 hover:underline truncate block w-full text-left py-0.5"
                      >
                        {note.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

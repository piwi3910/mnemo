import * as React from "react";
import { X } from "lucide-react";
import { TagBadge } from "./TagBadge";
import { cn } from "../lib/utils";

export interface TagFilterEntry {
  tag: string;
  count?: number;
}

export interface TagFilterBarProps {
  tags: TagFilterEntry[];
  activeTag: string | null;
  onTagSelect: (tag: string | null) => void;
  className?: string;
}

/**
 * A horizontal bar of clickable tag badges. Clicking a tag selects it as a
 * filter; clicking the active tag (or the clear button) resets the filter.
 */
export function TagFilterBar({
  tags,
  activeTag,
  onTagSelect,
  className,
}: TagFilterBarProps) {
  if (tags.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-1.5 flex-wrap", className)}>
      {tags.map(({ tag, count }) => (
        <TagBadge
          key={tag}
          tag={tag}
          count={count}
          selected={activeTag === tag}
          onClick={(t) => onTagSelect(activeTag === t ? null : t)}
        />
      ))}
      {activeTag && (
        <button
          onClick={() => onTagSelect(null)}
          className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Clear tag filter"
        >
          <X size={12} />
          Clear
        </button>
      )}
    </div>
  );
}

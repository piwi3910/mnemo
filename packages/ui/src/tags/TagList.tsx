import * as React from "react";
import { TagBadge } from "./TagBadge";
import { cn } from "../lib/utils";

export interface TagEntry {
  tag: string;
  count?: number;
}

export interface TagListProps {
  tags: TagEntry[];
  selectedTag?: string | null;
  onTagClick?: (tag: string) => void;
  className?: string;
}

export function TagList({
  tags,
  selectedTag = null,
  onTagClick,
  className,
}: TagListProps) {
  if (tags.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {tags.map(({ tag, count }) => (
        <TagBadge
          key={tag}
          tag={tag}
          count={count}
          selected={selectedTag === tag}
          onClick={onTagClick}
        />
      ))}
    </div>
  );
}

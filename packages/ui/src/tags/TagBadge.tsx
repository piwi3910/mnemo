import * as React from "react";
import { Hash } from "lucide-react";
import { cn } from "../lib/utils";

export interface TagBadgeProps {
  tag: string;
  count?: number;
  selected?: boolean;
  onClick?: (tag: string) => void;
  className?: string;
}

export function TagBadge({
  tag,
  count,
  selected = false,
  onClick,
  className,
}: TagBadgeProps) {
  const base =
    "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs transition-colors";
  const variant = selected
    ? "bg-violet-500 text-white"
    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700";

  if (onClick) {
    return (
      <button
        onClick={() => onClick(tag)}
        className={cn(base, variant, className)}
        aria-pressed={selected}
      >
        <Hash size={10} />
        {tag}
        {count !== undefined && (
          <span
            className={cn(
              "ml-0.5",
              selected ? "text-violet-100" : "text-gray-400 dark:text-gray-500",
            )}
          >
            {count}
          </span>
        )}
      </button>
    );
  }

  return (
    <span className={cn(base, variant, className)}>
      <Hash size={10} />
      {tag}
      {count !== undefined && (
        <span
          className={cn(
            "ml-0.5",
            selected ? "text-violet-100" : "text-gray-400 dark:text-gray-500",
          )}
        >
          {count}
        </span>
      )}
    </span>
  );
}

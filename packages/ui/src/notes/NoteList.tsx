import * as React from "react";
import { NoteCard } from "./NoteCard";
import type { NoteData } from "../data/types";

export interface NoteListProps {
  notes: NoteData[];
  activeNotePath?: string | null;
  starredPaths?: Set<string>;
  onSelect: (path: string) => void;
  onToggleStar?: (path: string) => void;
  emptyMessage?: string;
  className?: string;
}

export function NoteList({
  notes,
  activeNotePath = null,
  starredPaths,
  onSelect,
  onToggleStar,
  emptyMessage = "No notes",
  className,
}: NoteListProps) {
  if (notes.length === 0) {
    return (
      <p className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500 italic">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className={className} role="list">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          isActive={note.path === activeNotePath}
          isStarred={starredPaths?.has(note.path)}
          onSelect={onSelect}
          onToggleStar={onToggleStar}
        />
      ))}
    </div>
  );
}

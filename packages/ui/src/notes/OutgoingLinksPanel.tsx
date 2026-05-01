import * as React from "react";
import { useState, useMemo } from "react";
import { ChevronRight, ArrowDownRight, AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";

export interface OutgoingLink {
  name: string;
  /** Resolved file path, or null if the note does not exist. */
  path: string | null;
  exists: boolean;
}

export interface OutgoingLinksPanelProps {
  /** Parsed outgoing links for the current note. */
  links: OutgoingLink[];
  onNoteSelect: (path: string) => void;
  onCreateNote: (name: string) => void;
  className?: string;
}

/**
 * OutgoingLinksPanel — displays [[wiki-links]] found in the current note.
 * Broken links (no matching note) have a "create" affordance.
 *
 * Data derivation (parsing content + resolving paths) is the caller's
 * responsibility so this component is purely presentational.
 */
export function OutgoingLinksPanel({
  links,
  onNoteSelect,
  onCreateNote,
  className,
}: OutgoingLinksPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const brokenCount = useMemo(
    () => links.filter((l) => !l.exists).length,
    [links],
  );

  if (links.length === 0) return null;

  return (
    <div className={cn("border-t bg-gray-50/50 dark:bg-surface-900/50", className)}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 w-full px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <ChevronRight
          size={14}
          className={cn(
            "transition-transform duration-150",
            expanded && "rotate-90",
          )}
        />
        <ArrowDownRight size={14} />
        Outgoing Links
        <span className="ml-auto text-xs font-normal bg-gray-200 dark:bg-gray-700 rounded-full px-1.5 py-0.5">
          {links.length}
        </span>
        {brokenCount > 0 && (
          <span className="text-xs font-normal bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full px-1.5 py-0.5">
            {brokenCount} broken
          </span>
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-3">
          <ul className="space-y-0.5">
            {links.map((link) => (
              <li key={link.name} className="flex items-center gap-1.5">
                {link.exists ? (
                  <button
                    type="button"
                    onClick={() => link.path && onNoteSelect(link.path)}
                    className="text-sm text-violet-500 dark:text-violet-400 hover:underline truncate text-left py-0.5"
                    title={link.path ?? link.name}
                  >
                    {link.name}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onCreateNote(link.name)}
                    className="text-sm text-red-500 dark:text-red-400 hover:underline truncate text-left py-0.5 flex items-center gap-1"
                    title={`Create "${link.name}"`}
                  >
                    <AlertCircle size={12} />
                    {link.name}
                    <span className="text-xs text-gray-400">(create)</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/** Build a name→path map from a flat list of {name, path} pairs. */
export function buildNotePathMap(
  notes: { name: string; path: string }[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const n of notes) {
    const nameWithoutExt = n.name.replace(/\.md$/, "");
    const pathWithoutExt = n.path.replace(/\.md$/, "");
    map.set(nameWithoutExt.toLowerCase(), n.path);
    map.set(pathWithoutExt.toLowerCase(), n.path);
  }
  return map;
}

/** Extract unique [[wiki-link]] targets from markdown content. */
export function extractOutgoingLinks(content: string): string[] {
  const regex = /\[\[([^\]]+)\]\]/g;
  const links: string[] = [];
  const seen = new Set<string>();
  let match;
  while ((match = regex.exec(content)) !== null) {
    const name = match[1];
    const lower = name.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      links.push(name);
    }
  }
  return links;
}

/** Resolve extracted link names against the path map, returning OutgoingLink[]. */
export function resolveOutgoingLinks(
  linkNames: string[],
  notePathMap: Map<string, string>,
): OutgoingLink[] {
  return linkNames.map((name) => {
    const foundPath = notePathMap.get(name.toLowerCase()) ?? null;
    return { name, path: foundPath, exists: foundPath !== null };
  });
}

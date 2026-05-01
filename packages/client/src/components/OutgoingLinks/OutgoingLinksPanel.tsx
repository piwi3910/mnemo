import { useMemo } from 'react';
import {
  OutgoingLinksPanel as UiOutgoingLinksPanel,
  buildNotePathMap,
  extractOutgoingLinks,
  resolveOutgoingLinks,
} from '@azrtydxb/ui';
import { FileNode } from '../../lib/api';

interface OutgoingLinksPanelProps {
  content: string;
  allNotes: FileNode[];
  onNoteSelect: (path: string) => void;
  onCreateNote: (name: string) => void;
}

/** Flatten a FileNode tree into {name, path} pairs for the path-map builder. */
function flattenNotes(nodes: FileNode[]): { name: string; path: string }[] {
  const flat: { name: string; path: string }[] = [];
  for (const node of nodes) {
    if (node.type === 'file') {
      flat.push({ name: node.name, path: node.path });
    }
    if (node.children) {
      flat.push(...flattenNotes(node.children));
    }
  }
  return flat;
}

/**
 * Thin wrapper around @azrtydxb/ui OutgoingLinksPanel.
 * Derives outgoing links from the current note's content and the full note tree.
 */
export function OutgoingLinksPanel({
  content,
  allNotes,
  onNoteSelect,
  onCreateNote,
}: OutgoingLinksPanelProps) {
  const notePathMap = useMemo(
    () => buildNotePathMap(flattenNotes(allNotes)),
    [allNotes],
  );

  const links = useMemo(() => {
    const linkNames = extractOutgoingLinks(content);
    return resolveOutgoingLinks(linkNames, notePathMap);
  }, [content, notePathMap]);

  return (
    <UiOutgoingLinksPanel
      links={links}
      onNoteSelect={onNoteSelect}
      onCreateNote={onCreateNote}
    />
  );
}

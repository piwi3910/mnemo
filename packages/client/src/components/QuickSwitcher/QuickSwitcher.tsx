import { useMemo } from 'react';
import { NoteQuickSwitcher } from '@azrtydxb/ui';
import { FileNode } from '../../lib/api';

interface QuickSwitcherProps {
  notes: FileNode[];
  onSelect: (path: string) => void;
  onClose: () => void;
}

function collectFiles(nodes: FileNode[]): { path: string; name: string }[] {
  const files: { path: string; name: string }[] = [];
  for (const node of nodes) {
    if (node.type === 'file') {
      files.push({ path: node.path, name: node.name.replace(/\.md$/, '') });
    }
    if (node.children) {
      files.push(...collectFiles(node.children));
    }
  }
  return files;
}

/**
 * Thin wrapper around @azrtydxb/ui NoteQuickSwitcher.
 * Flattens the FileNode tree into the flat NoteEntry list the ui component expects.
 */
export function QuickSwitcher({ notes, onSelect, onClose }: QuickSwitcherProps) {
  const allFiles = useMemo(() => collectFiles(notes), [notes]);

  return (
    <NoteQuickSwitcher
      notes={allFiles}
      onSelect={onSelect}
      onClose={onClose}
    />
  );
}

import { OutlinePane as UiOutlinePane } from '@azrtydxb/ui';

interface OutlinePaneProps {
  content: string;
  onJumpToLine: (line: number) => void;
}

/**
 * Thin wrapper around @azrtydxb/ui OutlinePane.
 * Props are identical — this just re-exports through the component layer.
 */
export function OutlinePane({ content, onJumpToLine }: OutlinePaneProps) {
  return <UiOutlinePane content={content} onJumpToLine={onJumpToLine} />;
}

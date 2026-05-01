import { Resizer } from '@azrtydxb/ui';

interface ResizeHandleProps {
  direction: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
  onResizeEnd?: () => void;
}

/**
 * Thin adapter around @azrtydxb/ui Resizer.
 * Maps the client's `direction` prop vocabulary to ui's `orientation`.
 * Kept here for backward compatibility with call-sites in SidebarLayout / RightPanel.
 */
export function ResizeHandle({ direction, onResize }: ResizeHandleProps) {
  return (
    <Resizer
      orientation={direction}
      onResize={onResize}
    />
  );
}

import * as React from "react";
import { Star, Share2, Pencil, Trash2, FolderInput } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "../primitives/context-menu";

export interface NoteContextMenuProps {
  /** The path of the note this menu is for. */
  notePath: string;
  isStarred?: boolean;
  isShared?: boolean;
  /** Whether to show the share action. */
  canShare?: boolean;
  onStar?: (path: string) => void;
  onRename?: (path: string) => void;
  onMove?: (path: string) => void;
  onShare?: (path: string) => void;
  onDelete?: (path: string) => void;
  children: React.ReactNode;
}

export function NoteContextMenu({
  notePath,
  isStarred = false,
  canShare = true,
  onStar,
  onRename,
  onMove,
  onShare,
  onDelete,
  children,
}: NoteContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="min-w-[160px]">
        {onStar && (
          <ContextMenuItem onClick={() => onStar(notePath)} className="gap-2">
            <Star size={14} aria-hidden="true" fill={isStarred ? "currentColor" : "none"} />
            {isStarred ? "Unstar" : "Star"}
          </ContextMenuItem>
        )}
        {onRename && (
          <ContextMenuItem onClick={() => onRename(notePath)} className="gap-2">
            <Pencil size={14} aria-hidden="true" />
            Rename
          </ContextMenuItem>
        )}
        {onMove && (
          <ContextMenuItem onClick={() => onMove(notePath)} className="gap-2">
            <FolderInput size={14} aria-hidden="true" />
            Move to…
          </ContextMenuItem>
        )}
        {canShare && onShare && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => onShare(notePath)} className="gap-2">
              <Share2 size={14} aria-hidden="true" />
              Share…
            </ContextMenuItem>
          </>
        )}
        {onDelete && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => onDelete(notePath)}
              className="gap-2 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
            >
              <Trash2 size={14} aria-hidden="true" />
              Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

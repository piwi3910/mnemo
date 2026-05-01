import * as React from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link,
  Image,
  ImagePlus,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Table,
  Undo2,
  Redo2,
  Eye,
  Pencil,
} from "lucide-react";
import { cn } from "../lib/utils";

export type ViewMode = "edit" | "preview" | "split";

export interface EditorToolbarProps {
  /**
   * Called when a formatting action should be applied. Receives a command
   * string that consumers can map to their editor instance.
   *
   * Commands: `"bold"`, `"italic"`, `"strikethrough"`, `"code"`, `"link"`,
   * `"image"`, `"heading1"`, `"heading2"`, `"heading3"`, `"ul"`, `"ol"`,
   * `"checkbox"`, `"blockquote"`, `"hr"`, `"table"`, `"undo"`, `"redo"`.
   */
  onCommand: (command: string) => void;
  /**
   * Called when the user requests a file upload (e.g. pasted/dropped image).
   */
  onUploadImage?: (file: File) => void;
  /** Current view mode. */
  viewMode?: ViewMode;
  /** Called when the user toggles the view mode. */
  onViewModeChange?: (mode: ViewMode) => void;
  className?: string;
}

function ToolbarButton({
  icon: Icon,
  title,
  onClick,
  active,
}: {
  icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean | "true" | "false" }>;
  title: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={title}
      title={title}
      className={cn(
        "rounded p-1.5 transition-colors",
        active
          ? "bg-violet-500/20 text-violet-400"
          : "text-gray-400 hover:bg-gray-700/50 hover:text-gray-200",
      )}
    >
      <Icon size={15} aria-hidden="true" />
    </button>
  );
}

function ToolbarSep() {
  return <div className="mx-0.5 h-4 w-px bg-gray-700/50" aria-hidden="true" />;
}

/**
 * EditorToolbar — formatting action bar for the NoteEditor.
 *
 * Decoupled from any specific editor engine: it fires `onCommand(commandName)`
 * and consumers wire it to CodeMirror, a contenteditable, or an iframe-based
 * editor. Includes a view-mode toggle (edit / split / preview).
 */
export function EditorToolbar({
  onCommand,
  onUploadImage,
  viewMode = "edit",
  onViewModeChange,
  className,
}: EditorToolbarProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && onUploadImage) onUploadImage(file);
      e.target.value = "";
    },
    [onUploadImage],
  );

  return (
    <div
      className={cn(
        "flex shrink-0 flex-wrap items-center gap-0.5 border-b border-gray-700/50 bg-surface-900/80 px-2 py-1",
        className,
      )}
      role="toolbar"
      aria-label="Editor formatting toolbar"
    >
      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        aria-hidden="true"
      />

      {/* History */}
      <ToolbarButton icon={Undo2} title="Undo (Ctrl+Z)" onClick={() => onCommand("undo")} />
      <ToolbarButton icon={Redo2} title="Redo (Ctrl+Shift+Z)" onClick={() => onCommand("redo")} />
      <ToolbarSep />

      {/* Headings */}
      <ToolbarButton icon={Heading1} title="Heading 1" onClick={() => onCommand("heading1")} />
      <ToolbarButton icon={Heading2} title="Heading 2" onClick={() => onCommand("heading2")} />
      <ToolbarButton icon={Heading3} title="Heading 3" onClick={() => onCommand("heading3")} />
      <ToolbarSep />

      {/* Inline formatting */}
      <ToolbarButton icon={Bold} title="Bold (Ctrl+B)" onClick={() => onCommand("bold")} />
      <ToolbarButton icon={Italic} title="Italic (Ctrl+I)" onClick={() => onCommand("italic")} />
      <ToolbarButton icon={Strikethrough} title="Strikethrough" onClick={() => onCommand("strikethrough")} />
      <ToolbarButton icon={Code} title="Inline code" onClick={() => onCommand("code")} />
      <ToolbarSep />

      {/* Links & images */}
      <ToolbarButton icon={Link} title="Wiki link" onClick={() => onCommand("link")} />
      <ToolbarButton icon={Image} title="Insert image" onClick={() => onCommand("image")} />
      {onUploadImage && (
        <ToolbarButton
          icon={ImagePlus}
          title="Upload image"
          onClick={() => fileInputRef.current?.click()}
        />
      )}
      <ToolbarSep />

      {/* Lists */}
      <ToolbarButton icon={List} title="Bullet list" onClick={() => onCommand("ul")} />
      <ToolbarButton icon={ListOrdered} title="Numbered list" onClick={() => onCommand("ol")} />
      <ToolbarButton icon={CheckSquare} title="Checkbox" onClick={() => onCommand("checkbox")} />
      <ToolbarSep />

      {/* Block formatting */}
      <ToolbarButton icon={Quote} title="Blockquote" onClick={() => onCommand("blockquote")} />
      <ToolbarButton icon={Minus} title="Horizontal rule" onClick={() => onCommand("hr")} />
      <ToolbarButton icon={Table} title="Insert table" onClick={() => onCommand("table")} />

      {/* View mode toggle */}
      {onViewModeChange && (
        <>
          <div className="flex-1" />
          <ToolbarButton
            icon={Pencil}
            title="Edit mode"
            active={viewMode === "edit"}
            onClick={() => onViewModeChange("edit")}
          />
          <ToolbarButton
            icon={Eye}
            title="Preview mode"
            active={viewMode === "preview"}
            onClick={() => onViewModeChange("preview")}
          />
        </>
      )}
    </div>
  );
}

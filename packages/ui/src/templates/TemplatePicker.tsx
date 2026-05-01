import * as React from "react";
import { useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { TemplateList } from "./TemplateList";
import type { TemplateEntry } from "./TemplateList";

export interface TemplatePickerProps {
  templates: TemplateEntry[];
  loading?: boolean;
  /** Called with processed template content (empty string = blank note) */
  onSelect: (content: string) => void;
  onClose: () => void;
  /** Note title used for {{title}} variable substitution */
  noteTitle?: string;
  /** Called by consumer to fetch raw content for a template name */
  onFetchContent: (name: string) => Promise<string>;
}

function applyTemplateVars(content: string, title: string): string {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return content
    .replace(/\{\{date\}\}/g, dateStr)
    .replace(/\{\{title\}\}/g, title);
}

export function TemplatePicker({
  templates,
  loading,
  onSelect,
  onClose,
  noteTitle = "",
  onFetchContent,
}: TemplatePickerProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (
        dialogRef.current &&
        !dialogRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    },
    [onClose],
  );

  const handleSelect = useCallback(
    async (name: string) => {
      if (name === "") {
        onSelect("");
        return;
      }
      try {
        const raw = await onFetchContent(name);
        const processed = applyTemplateVars(raw, noteTitle);
        onSelect(processed);
      } catch {
        onClose();
      }
    },
    [noteTitle, onSelect, onClose, onFetchContent],
  );

  const modal = (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div
        ref={dialogRef}
        className="bg-white dark:bg-surface-900 rounded-xl shadow-2xl border w-80 max-h-96 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-sm font-semibold">Choose a Template</h3>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost p-1"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-2 overflow-y-auto max-h-72">
          <TemplateList
            templates={templates}
            loading={loading}
            onSelect={handleSelect}
            showBlankOption
          />
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

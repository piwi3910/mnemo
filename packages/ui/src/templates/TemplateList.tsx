import * as React from "react";
import { FileText } from "lucide-react";
import { cn } from "../lib/utils";

export interface TemplateEntry {
  /** Unique name / slug for the template */
  name: string;
  /** File path in the vault, e.g. "Templates/Meeting.md" */
  path: string;
  /** Optional description shown under the name */
  description?: string;
}

export interface TemplateListProps {
  templates: TemplateEntry[];
  loading?: boolean;
  /** Called when the user picks a template by name */
  onSelect: (name: string) => void;
  /** If true, shows a "Blank note" option at the top that calls onSelect('') */
  showBlankOption?: boolean;
  className?: string;
}

export function TemplateList({
  templates,
  loading,
  onSelect,
  showBlankOption = true,
  className,
}: TemplateListProps) {
  if (loading) {
    return (
      <p className={cn("text-sm text-gray-400 p-2", className)}>
        Loading templates...
      </p>
    );
  }

  if (!showBlankOption && templates.length === 0) {
    return (
      <div className={cn("text-center py-6", className)}>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No templates found
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Create notes in the Templates/ folder
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-0.5", className)}>
      {showBlankOption && (
        <button
          type="button"
          onClick={() => onSelect("")}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
        >
          <FileText size={15} />
          Blank note
        </button>
      )}
      {templates.length === 0 && showBlankOption && (
        <div className="text-center py-4">
          <p className="text-xs text-gray-400">
            No templates found. Create notes in the Templates/ folder.
          </p>
        </div>
      )}
      {templates.map((t) => (
        <button
          key={t.path}
          type="button"
          onClick={() => onSelect(t.name)}
          className="w-full flex items-start gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
        >
          <FileText size={15} className="text-violet-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-left min-w-0">
            <div className="truncate">{t.name}</div>
            {t.description && (
              <div className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                {t.description}
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

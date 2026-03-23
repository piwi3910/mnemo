import { useState, useEffect, useCallback } from 'react';
import { api, TemplateData } from '../../lib/api';
import { FileText, X } from 'lucide-react';

interface TemplatePickerProps {
  onSelect: (content: string) => void;
  onClose: () => void;
  noteTitle: string;
}

function applyTemplateVars(content: string, title: string): string {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return content
    .replace(/\{\{date\}\}/g, dateStr)
    .replace(/\{\{title\}\}/g, title);
}

export function TemplatePicker({ onSelect, onClose, noteTitle }: TemplatePickerProps) {
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTemplates()
      .then(setTemplates)
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = useCallback(async (name: string) => {
    try {
      const { content } = await api.getTemplateContent(name);
      const processed = applyTemplateVars(content, noteTitle);
      onSelect(processed);
    } catch {
      onClose();
    }
  }, [noteTitle, onSelect, onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-surface-900 rounded-xl shadow-2xl border w-80 max-h-96 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-sm font-semibold">Choose a Template</h3>
          <button onClick={onClose} className="btn-ghost p-1">
            <X size={16} />
          </button>
        </div>
        <div className="p-2 overflow-y-auto max-h-72">
          {loading ? (
            <p className="text-sm text-gray-400 p-2">Loading templates...</p>
          ) : templates.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">No templates found</p>
              <p className="text-xs text-gray-400 mt-1">Create notes in the Templates/ folder</p>
            </div>
          ) : (
            <>
              <button
                onClick={() => onSelect('')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
              >
                <FileText size={15} />
                Blank note
              </button>
              {templates.map((t) => (
                <button
                  key={t.path}
                  onClick={() => handleSelect(t.name)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  <FileText size={15} className="text-blue-500" />
                  {t.name}
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

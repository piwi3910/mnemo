import { useState, useEffect } from 'react';
import { TemplatePicker as UiTemplatePicker } from '@azrtydxb/ui';
import { api, TemplateData } from '../../lib/api';

interface TemplatePickerProps {
  onSelect: (content: string) => void;
  onClose: () => void;
  noteTitle: string;
}

/**
 * Thin wrapper around @azrtydxb/ui TemplatePicker.
 * Fetches template list and content via the HTTP API.
 */
export function TemplatePicker({ onSelect, onClose, noteTitle }: TemplatePickerProps) {
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTemplates()
      .then(setTemplates)
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, []);

  const handleFetchContent = async (name: string): Promise<string> => {
    const { content } = await api.getTemplateContent(name);
    return content;
  };

  const templateEntries = templates.map(({ name, path }) => ({ name, path }));

  return (
    <UiTemplatePicker
      templates={templateEntries}
      loading={loading}
      onSelect={onSelect}
      onClose={onClose}
      noteTitle={noteTitle}
      onFetchContent={handleFetchContent}
    />
  );
}

import { useState, useEffect, useCallback } from 'react';
import { BacklinksPanel as UiBacklinksPanel } from '@azrtydxb/ui';
import { api, BacklinkData } from '../../lib/api';

interface BacklinksPanelProps {
  notePath: string;
  onNoteSelect: (path: string) => void;
}

/**
 * Thin wrapper around @azrtydxb/ui BacklinksPanel.
 * Fetches backlink data via the HTTP API and passes it down.
 */
export function BacklinksPanel({ notePath, onNoteSelect }: BacklinksPanelProps) {
  const [backlinks, setBacklinks] = useState<BacklinkData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBacklinks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getBacklinks(notePath);
      setBacklinks(data);
    } catch {
      setBacklinks([]);
    } finally {
      setLoading(false);
    }
  }, [notePath]);

  useEffect(() => {
    fetchBacklinks();
  }, [fetchBacklinks]);

  return (
    <UiBacklinksPanel
      backlinks={backlinks}
      loading={loading}
      onNoteSelect={onNoteSelect}
    />
  );
}

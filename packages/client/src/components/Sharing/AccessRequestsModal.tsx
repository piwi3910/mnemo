import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { AccessRequestList } from '@azrtydxb/ui';
import type { AccessRequest } from '@azrtydxb/ui';
import { accessRequestApi } from '../../lib/api';

interface AccessRequestsModalProps {
  onClose: () => void;
}

/**
 * Thin wrapper around @azrtydxb/ui AccessRequestList.
 * Modal shell (overlay + header) stays here; the list rendering delegates to ui.
 */
export function AccessRequestsModal({ onClose }: AccessRequestsModalProps) {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingIds, setRespondingIds] = useState<Set<string>>(new Set());
  const dialogRef = useRef<HTMLDivElement>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const data = await accessRequestApi.list();
      setRequests(data.filter((r) => r.status === 'pending') as AccessRequest[]);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose],
  );

  const handleApprove = useCallback(
    async (id: string, permission: 'read' | 'readwrite') => {
      setRespondingIds(prev => new Set(prev).add(id));
      try {
        await accessRequestApi.respond(id, 'approve', permission);
        setRequests(prev => prev.filter(r => r.id !== id));
      } catch {
        // silently fail
      } finally {
        setRespondingIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [],
  );

  const handleDeny = useCallback(async (id: string) => {
    setRespondingIds(prev => new Set(prev).add(id));
    try {
      await accessRequestApi.respond(id, 'deny');
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch {
      // silently fail
    } finally {
      setRespondingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, []);

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={handleOverlayClick}
    >
      <div
        ref={dialogRef}
        className="bg-white dark:bg-surface-900 rounded-xl shadow-2xl border dark:border-surface-700 w-full max-w-md mx-4 overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-surface-700">
          <h2 className="text-sm font-semibold">Access Requests</h2>
          <button type="button" onClick={onClose} className="btn-ghost p-1" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4">
          <AccessRequestList
            requests={requests}
            loading={loading}
            respondingIds={respondingIds}
            onApprove={handleApprove}
            onDeny={handleDeny}
          />
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

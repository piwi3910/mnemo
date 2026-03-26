import { MutableRefObject, ComponentType, useState, useEffect, useRef } from 'react';
import { FileNode } from '../../lib/api';
import { api, NoteVersion } from '../../lib/api';
import { Preview } from '../Preview/Preview';
import { OutgoingLinksPanel } from '../OutgoingLinks/OutgoingLinksPanel';
import { BacklinksPanel } from '../Backlinks/BacklinksPanel';
import { Breadcrumbs } from '../Layout/Breadcrumbs';
import { BookOpen, Pencil, Share2, Star, FileDown, History, X, RotateCcw, Eye } from 'lucide-react';

interface PreviewModeViewProps {
  activeNote: { path: string; title: string; content: string };
  isStarred: boolean;
  allNotes: FileNode[];
  previewRef: MutableRefObject<HTMLDivElement | null>;
  onEdit: () => void;
  onShare: () => void;
  onToggleStar: () => void;
  onPdfExport: () => void;
  onNoteSelect: (path: string) => void;
  onLinkClick: (name: string) => void;
  onCreateNote: (name: string) => void;
  onRestored?: () => void;
  getCodeFenceRenderer?: (language: string) => { component: ComponentType<{ content: string; notePath: string }> } | undefined;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

interface VersionPreviewModalProps {
  notePath: string;
  version: NoteVersion;
  allNotes: FileNode[];
  onClose: () => void;
  onRestore: (timestamp: number) => void;
}

function VersionPreviewModal({ notePath, version, allNotes, onClose, onRestore }: VersionPreviewModalProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.getVersion(notePath, version.timestamp)
      .then((data) => {
        if (!cancelled) {
          setContent(data.content);
          setLoading(false);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load version content.');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [notePath, version.timestamp]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-surface-800 rounded-lg shadow-xl w-[700px] max-w-[95vw] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-surface-700">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Version from {new Date(version.timestamp).toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onRestore(version.timestamp)}
              className="flex items-center gap-1 px-3 py-1 text-xs bg-violet-600 hover:bg-violet-700 text-white rounded transition-colors"
            >
              <RotateCcw size={12} />
              Restore
            </button>
            <button onClick={onClose} className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading && <p className="text-sm text-gray-400">Loading...</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {content !== null && !loading && (
            <Preview
              content={content}
              onLinkClick={() => {}}
              allNotes={allNotes}
              onCreateNote={() => {}}
              notePath={notePath}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function PreviewModeView({
  activeNote, isStarred, allNotes, previewRef,
  onEdit, onShare, onToggleStar, onPdfExport,
  onNoteSelect, onLinkClick, onCreateNote, onRestored, getCodeFenceRenderer,
}: PreviewModeViewProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<NoteVersion | null>(null);
  const [restoring, setRestoring] = useState<number | null>(null);
  const historyPanelRef = useRef<HTMLDivElement | null>(null);

  // Load versions when the panel opens
  useEffect(() => {
    if (!historyOpen) return;
    setLoadingVersions(true);
    api.listVersions(activeNote.path)
      .then((data) => setVersions(data.versions))
      .catch(() => setVersions([]))
      .finally(() => setLoadingVersions(false));
  }, [historyOpen, activeNote.path]);

  // Close panel when clicking outside
  useEffect(() => {
    if (!historyOpen) return;
    function handleClick(e: MouseEvent) {
      if (historyPanelRef.current && !historyPanelRef.current.contains(e.target as Node)) {
        setHistoryOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [historyOpen]);

  async function handleRestore(timestamp: number) {
    setRestoring(timestamp);
    try {
      await api.restoreVersion(activeNote.path, timestamp);
      setHistoryOpen(false);
      setPreviewVersion(null);
      onRestored?.();
    } catch {
      // Silently fail — user can try again
    } finally {
      setRestoring(null);
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50/50 dark:bg-surface-900/50">
        <div className="flex items-center">
          <BookOpen size={14} className="text-gray-400 mr-2 shrink-0" />
          <Breadcrumbs path={activeNote.path} onFolderClick={onNoteSelect} />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="p-1 rounded text-gray-400 hover:text-violet-500 transition-colors" title="Edit note (Ctrl+E)">
            <Pencil size={14} />
          </button>
          <button onClick={onShare} className="p-1 rounded text-gray-400 hover:text-violet-500 transition-colors" title="Share note">
            <Share2 size={14} />
          </button>
          <button
            onClick={onToggleStar}
            className={`p-1 rounded transition-colors ${isStarred ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-400 hover:text-yellow-500'}`}
            title={isStarred ? 'Unstar (Ctrl+Shift+S)' : 'Star (Ctrl+Shift+S)'}
          >
            <Star size={14} fill={isStarred ? 'currentColor' : 'none'} />
          </button>
          <button onClick={onPdfExport} className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" title="Export as PDF">
            <FileDown size={14} />
          </button>
          {/* History button */}
          <div className="relative" ref={historyPanelRef}>
            <button
              onClick={() => setHistoryOpen((o) => !o)}
              className={`p-1 rounded transition-colors ${historyOpen ? 'text-violet-500' : 'text-gray-400 hover:text-violet-500'}`}
              title="Version history"
            >
              <History size={14} />
            </button>

            {historyOpen && (
              <div className="absolute right-0 top-7 z-40 w-72 bg-white dark:bg-surface-800 border dark:border-surface-700 rounded-lg shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b dark:border-surface-700">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Version History</span>
                  <button onClick={() => setHistoryOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <X size={14} />
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {loadingVersions && (
                    <p className="text-xs text-gray-400 text-center py-4">Loading...</p>
                  )}
                  {!loadingVersions && versions.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">No saved versions yet.</p>
                  )}
                  {!loadingVersions && versions.map((v) => (
                    <div key={v.timestamp} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-surface-700 border-b dark:border-surface-700/50 last:border-0">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                          {timeAgo(v.timestamp)}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(v.timestamp).toLocaleString()} &middot; {(v.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          onClick={() => setPreviewVersion(v)}
                          className="p-1 rounded text-gray-400 hover:text-violet-500 transition-colors"
                          title="Preview this version"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() => handleRestore(v.timestamp)}
                          disabled={restoring === v.timestamp}
                          className="p-1 rounded text-gray-400 hover:text-violet-500 transition-colors disabled:opacity-50"
                          title="Restore this version"
                        >
                          <RotateCcw size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto" ref={previewRef}>
        <Preview
          content={activeNote.content}
          onLinkClick={onLinkClick}
          allNotes={allNotes}
          onCreateNote={onCreateNote}
          notePath={activeNote.path}
          getCodeFenceRenderer={getCodeFenceRenderer}
        />
      </div>
      <OutgoingLinksPanel content={activeNote.content} allNotes={allNotes} onNoteSelect={onNoteSelect} onCreateNote={onCreateNote} />
      <BacklinksPanel notePath={activeNote.path} onNoteSelect={onNoteSelect} />

      {previewVersion && (
        <VersionPreviewModal
          notePath={activeNote.path}
          version={previewVersion}
          allNotes={allNotes}
          onClose={() => setPreviewVersion(null)}
          onRestore={(ts) => {
            setPreviewVersion(null);
            handleRestore(ts);
          }}
        />
      )}
    </div>
  );
}

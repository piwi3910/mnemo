import { useState, useRef, useEffect } from 'react';
import { EditorView } from '@codemirror/view';
import { useTheme } from './useTheme';
import { useNotes } from './useNotes';
import { useAuth } from './useAuth';
import { api, shareApi, GraphData } from '../lib/api';
import { EditorCursorState } from '../components/Editor/Editor';

export function useAppState() {
  const { user, loading } = useAuth();
  const themeCtx = useTheme();
  const notes = useNotes(user?.id);

  // Editing state
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState<string | null>(null);
  const [originalContent, setOriginalContent] = useState<string | null>(null);

  // UI state
  const [showAdmin, setShowAdmin] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [pendingTemplatePath, setPendingTemplatePath] = useState<string | null>(null);
  const [showQuickSwitcher, setShowQuickSwitcher] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareTarget, setShareTarget] = useState<{ path: string; isFolder: boolean } | null>(null);
  const [showAccessRequests, setShowAccessRequests] = useState(false);

  // Layout state
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  const [graphHeight, setGraphHeight] = useState<number | null>(null);

  // Data state
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [graphLoading, setGraphLoading] = useState(true);
  const [cursorState, setCursorState] = useState<EditorCursorState>({
    line: 1, col: 1, wordCount: 0,
  });
  const [starredPaths, setStarredPaths] = useState<Set<string>>(new Set());
  const [sharedNotes, setSharedNotes] = useState<{ id: string; ownerUserId: string; ownerName: string; path: string; isFolder: boolean; permission: string }[]>([]);

  // Refs
  const editorViewRef = useRef<EditorView>(undefined);
  const searchInputRef = useRef<HTMLInputElement>(undefined);
  const previewRef = useRef<HTMLDivElement>(null);

  // Load starred notes
  useEffect(() => {
    if (!user) return;
    api.getSettings().then(settings => {
      if (settings.starred) {
        try {
          const paths = JSON.parse(settings.starred) as string[];
          setStarredPaths(new Set(paths));
        } catch { /* ignore */ }
      }
    }).catch(() => {});
  }, [user]);

  // Fetch shared notes
  useEffect(() => {
    if (!user) return;
    shareApi.withMe().then(data => setSharedNotes(data || [])).catch(() => {});
  }, [user]);

  // Fetch graph data
  const treeKey = notes.tree.length;
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api.getGraph()
      .then(data => { if (!cancelled) { setGraphData(data); setGraphLoading(false); } })
      .catch(() => { if (!cancelled) { setGraphLoading(false); } });
    return () => { cancelled = true; };
  }, [treeKey, user]);

  const isActiveNoteStarred = notes.activeNote ? starredPaths.has(notes.activeNote.path) : false;

  return {
    // Auth
    user, loading,
    // Theme
    themeCtx,
    // Notes
    notes,
    // Editing
    editing, setEditing,
    editContent, setEditContent,
    originalContent, setOriginalContent,
    // UI toggles
    showAdmin, setShowAdmin,
    sidebarOpen, setSidebarOpen,
    mobileMenuOpen, setMobileMenuOpen,
    showTemplatePicker, setShowTemplatePicker,
    pendingTemplatePath, setPendingTemplatePath,
    showQuickSwitcher, setShowQuickSwitcher,
    showShareDialog, setShowShareDialog,
    shareTarget, setShareTarget,
    showAccessRequests, setShowAccessRequests,
    // Layout
    sidebarWidth, setSidebarWidth,
    rightPanelWidth, setRightPanelWidth,
    graphHeight, setGraphHeight,
    // Data
    graphData, graphLoading,
    cursorState, setCursorState,
    starredPaths, setStarredPaths,
    sharedNotes,
    isActiveNoteStarred,
    // Refs
    editorViewRef, searchInputRef, previewRef,
  };
}

export type AppState = ReturnType<typeof useAppState>;

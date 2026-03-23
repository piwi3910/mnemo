import { useEffect } from 'react';

interface ShortcutActions {
  toggleSidebar: () => void;
  toggleEdit: () => void;
  openQuickSwitcher: () => void;
  focusSearch: () => void;
  createNote: () => void;
  renameNote: () => void;
  toggleStar: () => void;
}

export function useKeyboardShortcuts(actions: ShortcutActions) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        actions.toggleStar();
      } else if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        actions.toggleSidebar();
      } else if (e.ctrlKey && e.key === 'e' && !target.closest('.cm-editor')) {
        // Guard: skip when focus is inside CodeMirror (Ctrl+E = cursor to line end)
        e.preventDefault();
        actions.toggleEdit();
      } else if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        actions.openQuickSwitcher();
      } else if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        actions.focusSearch();
      } else if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        actions.createNote();
      } else if (e.key === 'F2' && !isInput) {
        e.preventDefault();
        actions.renameNote();
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [actions]);
}

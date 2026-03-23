# GUI Layout Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the main layout so notes show in preview mode by default with an inline graph panel, and editing is opt-in via an Edit button that opens a split editor+preview.

**Architecture:** Refactor GraphView from a modal to an inline panel component. Replace the 3-way view mode (editor/split/preview) with a boolean `editing` state. The right panel (graph + outline) is always visible in preview mode and hides during editing. Canvas view is removed entirely.

**Tech Stack:** React 19, d3.js (graph), CodeMirror (editor), Tailwind CSS 4

**Spec:** `docs/superpowers/specs/2026-03-23-gui-layout-redesign.md`

**Working directory:** All paths relative to `/Users/pascal/Development/mnemo`.

---

## Task 1: Remove Canvas view and clean up unused imports

**Files:**
- Delete: `packages/client/src/components/Canvas/CanvasView.tsx`
- Modify: `packages/client/src/App.tsx`
- Modify: `packages/client/package.json`

- [ ] **Step 1: Delete CanvasView component**

```bash
rm /Users/pascal/Development/mnemo/packages/client/src/components/Canvas/CanvasView.tsx
```

- [ ] **Step 2: Remove Canvas from App.tsx**

In `packages/client/src/App.tsx`:
- Remove the import: `import { CanvasView } from './components/Canvas/CanvasView';`
- Remove the import: `LayoutDashboard` from the lucide-react import line
- Remove the state: `const [showCanvas, setShowCanvas] = useState(false);`
- Remove the Canvas button from the header (the `<button>` with `aria-label="Canvas view"`)
- Remove the Canvas modal block at the bottom (`{showCanvas && (<CanvasView .../>)}`)

- [ ] **Step 3: Remove @xyflow/react dependency**

```bash
cd /Users/pascal/Development/mnemo/packages/client
npm uninstall @xyflow/react
```

- [ ] **Step 4: Verify build**

```bash
cd /Users/pascal/Development/mnemo
npm run build
```

Expected: Build passes.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: remove Canvas view and @xyflow/react dependency"
```

---

## Task 2: Refactor GraphView from modal to inline panel

**Files:**
- Modify: `packages/client/src/components/Graph/GraphView.tsx`
- Create: `packages/client/src/components/Graph/GraphPanel.tsx`

- [ ] **Step 1: Refactor GraphView to an inline component**

Rewrite `packages/client/src/components/Graph/GraphView.tsx`. The component must:
- Remove the `onClose` prop entirely
- Add `activeNotePath: string | null` prop
- Add `mode: 'local' | 'full'` prop
- Keep `onNoteSelect` prop (but remove the `onClose()` call inside `handleNodeClick`)
- Remove the modal wrapper (`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm`), the inner card, the header, and the close button
- Remove the Escape key handler useEffect
- Keep all d3 canvas rendering, zoom/pan, drag, hover, click, and ResizeObserver logic
- Add local mode filtering: when `mode === 'local'` and `activeNotePath` is set, filter `graphData.nodes` and `graphData.edges` to only include nodes within 1 hop of the active note
- Add active note highlighting: render the active note's node with a larger radius (10 instead of 6) and a distinct fill color (`#2563eb` light, `#3b82f6` dark)
- Add auto-centering: after simulation settles (on `end` event), if `activeNotePath` is set, programmatically set the zoom transform to center the active node in the canvas
- Accept an optional `graphData` prop so the parent can pass cached data, OR fetch internally if not provided. Use `graphData` prop approach — parent fetches and caches.
- Remove the internal `useEffect` that calls `api.getGraph()` — data comes from parent

The new interface:
```ts
interface GraphViewProps {
  graphData: GraphData | null;
  loading: boolean;
  activeNotePath: string | null;
  mode: 'local' | 'full';
  onNoteSelect: (path: string) => void;
}
```

The component renders just:
```tsx
<div className="flex-1 relative">
  {loading && <Loader2 spinner />}
  {error && <error message />}
  {graphData?.nodes.length === 0 && <empty message />}
  <canvas ref={canvasRef} className="w-full h-full" />
</div>
```

- [ ] **Step 2: Create GraphPanel wrapper**

Create `packages/client/src/components/Graph/GraphPanel.tsx`:

```tsx
import { useState } from 'react';
import { Network } from 'lucide-react';
import { GraphView } from './GraphView';
import { GraphData } from '../../lib/api';

interface GraphPanelProps {
  graphData: GraphData | null;
  loading: boolean;
  activeNotePath: string | null;
  onNoteSelect: (path: string) => void;
}

export function GraphPanel({ graphData, loading, activeNotePath, onNoteSelect }: GraphPanelProps) {
  const [mode, setMode] = useState<'local' | 'full'>('local');

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-2">
          <Network size={14} className="text-gray-400" />
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Graph</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMode('local')}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              mode === 'local'
                ? 'bg-blue-500/15 text-blue-500 font-medium'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Local
          </button>
          <button
            onClick={() => setMode('full')}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              mode === 'full'
                ? 'bg-blue-500/15 text-blue-500 font-medium'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Full
          </button>
        </div>
      </div>
      <GraphView
        graphData={graphData}
        loading={loading}
        activeNotePath={activeNotePath}
        mode={mode}
        onNoteSelect={onNoteSelect}
      />
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
cd /Users/pascal/Development/mnemo
npm run typecheck
npm run build
```

Expected: Both pass (GraphView/GraphPanel aren't used in App.tsx yet, so they compile independently).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: refactor GraphView from modal to inline panel with local/full mode"
```

---

## Task 3: Add heading IDs to Preview for outline scroll-to

**Files:**
- Modify: `packages/client/src/components/Preview/Preview.tsx`

- [ ] **Step 1: Add heading ID generation to Preview**

In `packages/client/src/components/Preview/Preview.tsx`, the `transformedContent` string processing already handles wiki-links and embeds. Add a heading transform BEFORE the existing transforms that adds `id` attributes to headings.

After the line `let processedContent = content;` (and after the dataview block extraction), add a heading ID transform:

```ts
// Add IDs to headings for outline scroll-to
let headingCounter = 0;
processedContent = processedContent.replace(
  /^(#{1,6})\s+(.+)$/gm,
  (_match, hashes: string, text: string) => {
    headingCounter++;
    const slug = `heading-${headingCounter}`;
    const level = hashes.length;
    return `<h${level} id="${slug}">${text}</h${level}>`;
  }
);
```

Note: Since we're injecting raw HTML, `rehype-raw` (already in use) will parse these tags. The ReactMarkdown component will then render them with the `id` attribute intact.

- [ ] **Step 2: Verify build**

```bash
cd /Users/pascal/Development/mnemo
npm run build
```

Expected: Build passes.

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/components/Preview/Preview.tsx
git commit -m "feat: add heading IDs to preview for outline scroll-to support"
```

---

## Task 4: Update keyboard shortcuts

**Files:**
- Modify: `packages/client/src/hooks/useKeyboardShortcuts.ts`

- [ ] **Step 1: Replace toggleOutline with toggleEdit**

Rewrite `packages/client/src/hooks/useKeyboardShortcuts.ts`:

```ts
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
      } else if (e.ctrlKey && e.key === 'e') {
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
```

Changes: `toggleOutline` → `toggleEdit`, `Ctrl+O` → `Ctrl+E`.

- [ ] **Step 2: Verify build**

```bash
cd /Users/pascal/Development/mnemo
npm run typecheck
```

Expected: Type errors in App.tsx (it still references `toggleOutline`). That's fine — we fix App.tsx in the next task.

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/hooks/useKeyboardShortcuts.ts
git commit -m "feat: replace toggleOutline shortcut with toggleEdit (Ctrl+E)"
```

---

## Task 5: Rewrite App.tsx layout

This is the main task — rewires the entire layout. **Read the current `packages/client/src/App.tsx` fully before making changes.**

**Files:**
- Modify: `packages/client/src/App.tsx`

- [ ] **Step 1: Update imports**

In `packages/client/src/App.tsx`:
- Remove: `import { GraphView } from './components/Graph/GraphView';`
- Add: `import { GraphPanel } from './components/Graph/GraphPanel';`
- Remove `Network` from the lucide-react import (it's now in GraphPanel)
- Remove `ListTree` from the lucide-react import (outline toggle button removed)
- Add `Pencil` to the lucide-react import (for Edit button icon)
- The remaining lucide imports should be: `PanelLeft, BookOpen, X, Menu, Star, FileDown, Pencil`

- [ ] **Step 2: Update state**

Replace:
```ts
const [viewMode, setViewMode] = useState<ViewMode>('split');
const [showGraph, setShowGraph] = useState(false);
const [showCanvas, setShowCanvas] = useState(false);
const [outlineOpen, setOutlineOpen] = useState(false);
```

With:
```ts
const [editing, setEditing] = useState(false);
const [graphData, setGraphData] = useState<GraphData | null>(null);
const [graphLoading, setGraphLoading] = useState(true);
```

Remove the `type ViewMode = 'editor' | 'preview' | 'split';` type alias.

Add `import { api, GraphData } from './lib/api';` if `GraphData` isn't already imported (it's already imported via `api`).

Ensure `GraphData` is exported from `packages/client/src/lib/api.ts`. Check and add the import.

- [ ] **Step 3: Add graph data fetching**

Add a useEffect to fetch graph data on mount and when notes change:

```ts
// Fetch graph data on mount and when tree changes (note created/deleted/renamed)
useEffect(() => {
  setGraphLoading(true);
  api.getGraph()
    .then(data => { setGraphData(data); setGraphLoading(false); })
    .catch(() => { setGraphLoading(false); });
}, [notes.tree]);
```

- [ ] **Step 4: Update handleOutlineJump for dual-mode**

Replace the existing `handleOutlineJump` with a mode-aware version:

```ts
const handleOutlineJump = useCallback((line: number) => {
  if (editing) {
    // Edit mode: jump to line in editor
    const view = editorViewRef.current;
    if (!view) return;
    const doc = view.state.doc;
    if (line < 1 || line > doc.lines) return;
    const lineObj = doc.line(line);
    view.dispatch({
      selection: { anchor: lineObj.from },
      scrollIntoView: true,
    });
    view.focus();
  } else {
    // Preview mode: scroll to heading by ID
    const el = document.getElementById(`heading-${line}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}, [editing]);
```

Note: The outline gives us a `line` number (1-based heading index from `extractHeadings`). In preview mode, we use this as the heading counter that matches the `id="heading-N"` we added in Task 3. However, the line number from OutlinePane is the actual source line, not the heading index. We need to reconcile this.

**Actually**, the OutlinePane's `extractHeadings` gives sequential headings with `.line` as the source line number (1-based). The Preview's heading IDs use a sequential counter (`heading-1`, `heading-2`, etc.). These don't match by line number — they match by index.

So the approach should be: instead of `heading-${line}`, pass the heading **index** (0-based position in the headings array). But OutlinePane currently passes `heading.line` (source line number).

The simplest fix: change Preview to use the source line number as the ID: `id="heading-line-${lineNumber}"`. Then OutlinePane's `onJumpToLine(heading.line)` maps directly.

Update the Preview heading transform (from Task 3) to use line numbers:

The headings in the source are at specific line numbers. We can track line numbers during the replacement. Actually, let's use a simpler approach — use a map of line numbers. The regex replacement processes headings in order. We know the line number by counting newlines before each match.

Simpler: use `id="heading-line-N"` where N comes from counting which line the heading is on. But `String.replace` doesn't give us line numbers easily.

**Best approach:** Have the Preview component expose heading IDs based on heading index (1, 2, 3...) and have OutlinePane pass the heading index instead of line number. Since OutlinePane already has the headings array, we know the index.

But OutlinePane's interface is `onJumpToLine: (line: number) => void`. Let's change it minimally:

In `handleOutlineJump`, for preview mode, convert the line number to a heading index:
```ts
// Preview mode: find heading index by line number from content
const headingLines = (notes.activeNote?.content || '').split('\n')
  .map((l, i) => ({ line: i + 1, isHeading: /^#{1,6}\s+/.test(l) }))
  .filter(l => l.isHeading);
const headingIndex = headingLines.findIndex(h => h.line === line);
if (headingIndex >= 0) {
  const el = document.getElementById(`heading-${headingIndex + 1}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
```

This matches the Preview's sequential counter.

- [ ] **Step 5: Update shortcutActions**

Replace:
```ts
const shortcutActions = useMemo(() => ({
  toggleSidebar: () => setSidebarOpen(prev => !prev),
  toggleOutline: () => setOutlineOpen(prev => !prev),
  openQuickSwitcher: () => setShowQuickSwitcher(true),
  focusSearch: () => searchInputRef.current?.focus(),
  createNote: handleNewNote,
  renameNote: handleRenameNote,
  toggleStar: toggleActiveNoteStar,
}), [handleNewNote, handleRenameNote, toggleActiveNoteStar]);
```

With:
```ts
const shortcutActions = useMemo(() => ({
  toggleSidebar: () => setSidebarOpen(prev => !prev),
  toggleEdit: () => { if (notes.activeNote) setEditing(prev => !prev); },
  openQuickSwitcher: () => setShowQuickSwitcher(true),
  focusSearch: () => searchInputRef.current?.focus(),
  createNote: handleNewNote,
  renameNote: handleRenameNote,
  toggleStar: toggleActiveNoteStar,
}), [handleNewNote, handleRenameNote, toggleActiveNoteStar, notes.activeNote]);
```

- [ ] **Step 6: Rewrite the header**

Remove the editor/split/preview segmented button, the outline toggle, and the graph button. Add an Edit/Done button. The header's right side should be:

```tsx
<div className="flex items-center gap-0.5">
  {notes.activeNote && (
    <button
      onClick={() => setEditing(!editing)}
      className={`btn-ghost p-2 ${editing ? 'text-blue-500' : ''}`}
      aria-label={editing ? 'Done editing' : 'Edit note'}
      title={editing ? 'Done editing (Ctrl+E)' : 'Edit note (Ctrl+E)'}
    >
      {editing ? <X size={18} /> : <Pencil size={18} />}
    </button>
  )}
  <ThemeToggle theme={themeCtx.theme} setTheme={themeCtx.setTheme} />
</div>
```

- [ ] **Step 7: Rewrite the main content area**

Replace the entire `<main>` section. The new layout:

**When not editing (default):**
- Center: Preview with backlinks/outgoing below
- Right: GraphPanel + OutlinePane stacked

**When editing:**
- Left half: Editor with backlinks/outgoing below
- Right half: Preview

```tsx
<main className="flex-1 flex overflow-hidden">
  {notes.activeNote ? (
    editing ? (
      /* Edit mode: Editor | Preview */
      <>
        <div className="w-1/2 flex flex-col overflow-hidden border-r">
          <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50/50 dark:bg-surface-900/50">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
              {notes.activeNote.path}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleActiveNoteStar}
                className={`p-1 rounded transition-colors ${
                  isActiveNoteStarred
                    ? 'text-yellow-500 hover:text-yellow-600'
                    : 'text-gray-400 hover:text-yellow-500'
                }`}
                title={isActiveNoteStarred ? 'Unstar (Ctrl+Shift+S)' : 'Star (Ctrl+Shift+S)'}
              >
                <Star size={14} fill={isActiveNoteStarred ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={handlePdfExport}
                className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Export as PDF"
              >
                <FileDown size={14} />
              </button>
              {notes.saving && <span className="text-xs text-gray-400">Saving...</span>}
              {!notes.saving && <span className="text-xs text-green-500">Saved</span>}
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <Editor
              content={notes.activeNote.content}
              onChange={notes.updateContent}
              darkMode={themeCtx.resolvedTheme === 'dark'}
              allNotes={notes.tree}
              onCursorStateChange={setCursorState}
              viewRef={editorViewRef}
            />
          </div>
          <OutgoingLinksPanel
            content={notes.activeNote.content}
            allNotes={notes.tree}
            onNoteSelect={handleNoteSelect}
            onCreateNote={handleCreateNoteFromLink}
          />
          <BacklinksPanel
            notePath={notes.activeNote.path}
            onNoteSelect={handleNoteSelect}
          />
        </div>
        <div className="w-1/2 flex flex-col overflow-hidden">
          <div className="flex items-center px-4 py-2 border-b bg-gray-50/50 dark:bg-surface-900/50">
            <BookOpen size={14} className="text-gray-400 mr-2" />
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Preview</span>
          </div>
          <div className="flex-1 overflow-y-auto" ref={previewRef}>
            <Preview
              content={notes.activeNote.content}
              onLinkClick={handleLinkClick}
              allNotes={notes.tree}
              onCreateNote={handleCreateNoteFromLink}
            />
          </div>
        </div>
      </>
    ) : (
      /* Preview mode: Preview | Graph+Outline */
      <>
        <div className="flex-1 flex flex-col overflow-hidden border-r">
          <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50/50 dark:bg-surface-900/50">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
              {notes.activeNote.path}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleActiveNoteStar}
                className={`p-1 rounded transition-colors ${
                  isActiveNoteStarred
                    ? 'text-yellow-500 hover:text-yellow-600'
                    : 'text-gray-400 hover:text-yellow-500'
                }`}
                title={isActiveNoteStarred ? 'Unstar (Ctrl+Shift+S)' : 'Star (Ctrl+Shift+S)'}
              >
                <Star size={14} fill={isActiveNoteStarred ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={handlePdfExport}
                className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Export as PDF"
              >
                <FileDown size={14} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto" ref={previewRef}>
            <Preview
              content={notes.activeNote.content}
              onLinkClick={handleLinkClick}
              allNotes={notes.tree}
              onCreateNote={handleCreateNoteFromLink}
            />
          </div>
          <OutgoingLinksPanel
            content={notes.activeNote.content}
            allNotes={notes.tree}
            onNoteSelect={handleNoteSelect}
            onCreateNote={handleCreateNoteFromLink}
          />
          <BacklinksPanel
            notePath={notes.activeNote.path}
            onNoteSelect={handleNoteSelect}
          />
        </div>
        {/* Right panel: Graph + Outline */}
        <aside className="w-80 flex-shrink-0 flex flex-col bg-gray-50 dark:bg-surface-900 overflow-hidden">
          <GraphPanel
            graphData={graphData}
            loading={graphLoading}
            activeNotePath={notes.activeNote.path}
            onNoteSelect={handleNoteSelect}
          />
          <div className="h-48 flex-shrink-0 border-t">
            <OutlinePane
              content={notes.activeNote.content}
              onJumpToLine={handleOutlineJump}
            />
          </div>
        </aside>
      </>
    )
  ) : (
    /* No note selected */
    <>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-blue-500" />
          </div>
          <h2 className="text-lg font-semibold mb-1">No note selected</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select a note from the sidebar or create a new one
          </p>
          <div className="mt-4 text-xs text-gray-400 dark:text-gray-500 space-y-1">
            <p><kbd className="kbd">Ctrl+P</kbd> Quick switcher</p>
            <p><kbd className="kbd">Ctrl+N</kbd> New note</p>
            <p><kbd className="kbd">Ctrl+B</kbd> Toggle sidebar</p>
          </div>
        </div>
      </div>
      {/* Show full graph even with no note selected */}
      <aside className="w-80 flex-shrink-0 flex flex-col bg-gray-50 dark:bg-surface-900 overflow-hidden border-l">
        <GraphPanel
          graphData={graphData}
          loading={graphLoading}
          activeNotePath={null}
          onNoteSelect={handleNoteSelect}
        />
      </aside>
    </>
  )}
</main>
```

- [ ] **Step 8: Remove the old outline sidebar and graph modal**

Remove from the JSX:
- The outline aside block: `{outlineOpen && notes.activeNote && (<aside className="w-60 ..."><OutlinePane .../></aside>)}`
- The graph modal: `{showGraph && (<GraphView onClose={...} onNoteSelect={...} />)}`

- [ ] **Step 9: Exit edit mode when switching notes**

Add to `handleNoteSelect`:
```ts
const handleNoteSelect = useCallback((path: string) => {
  notes.openNote(path);
  setEditing(false);
  setMobileMenuOpen(false);
}, [notes]);
```

- [ ] **Step 10: Verify full build pipeline**

```bash
cd /Users/pascal/Development/mnemo
npm run typecheck
npm run lint
npm run build
```

Expected: All three pass. Fix any type errors or lint issues.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: rewrite App layout - preview default, inline graph, edit toggle"
```

---

## Task 6: Final verification and push

- [ ] **Step 1: Clean install and full check**

```bash
cd /Users/pascal/Development/mnemo
rm -rf node_modules packages/client/node_modules packages/server/node_modules package-lock.json
npm install
npm run typecheck
npm run lint
npm run build
```

Expected: All pass.

- [ ] **Step 2: Commit any remaining fixes and push**

```bash
git add -A
git status
# Only commit if there are changes
git commit -m "chore: final fixes for GUI layout redesign"
git push
```

- [ ] **Step 3: Verify CI passes**

```bash
gh run watch $(gh run list --limit 1 --json databaseId -q '.[0].databaseId') --exit-status
```

Expected: Build and docker jobs both pass.

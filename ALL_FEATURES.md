# Mnemo - Complete Feature Parity Update

Add ALL missing features to match Obsidian's core functionality.

## 1. CANVAS VIEW (Priority: HIGH)
Infinite canvas for visual note arrangement, like Obsidian Canvas.

**Features:**
- Drag notes onto canvas as cards
- Draw connections between cards
- Pan (drag empty space) and zoom (scroll)
- Add text notes, images, and web embeds
- Save/load canvas as `.canvas` JSON files

**Tech:**
- Use React Flow or similar library
- New route: `/canvas/:name`
- Canvas files stored as `Canvas/name.canvas`

## 2. OUTLINE PANE (Priority: HIGH)
Table of contents extracted from current note headings.

**Features:**
- Right sidebar showing all `#`, `##`, `###` headings
- Click to jump to section
- Auto-updates as you type
- Show heading level with indentation

## 3. STARRED/FAVORITES (Priority: MEDIUM)
Pin important notes for quick access.

**Features:**
- Star icon in file tree and note header
- "Starred" section at top of sidebar
- Keyboard shortcut: `Ctrl+Shift+s`

## 4. PDF EXPORT (Priority: MEDIUM)
Export notes as PDF files.

**Features:**
- Export button in note header
- Use `@react-pdf/renderer` or server-side `puppeteer`
- Include markdown styling
- Option to include backlinks

## 5. DATAVIEW QUERIES (Priority: MEDIUM)
Query notes with a SQL-like syntax.

**Features:**
- Code block language: `dataview`
- Query syntax: `LIST FROM #tag WHERE condition`
- Display as table or list
- Auto-refresh

**Example:**
```dataview
LIST
FROM #project
WHERE status = "active"
SORT file.ctime DESC
```

## 6. OUTGOING LINKS PANEL (Priority: MEDIUM)
Show what notes the current note links TO.

**Features:**
- Panel below editor
- Shows all `[[links]]` in current note
- Click to open linked note
- Show if link is broken (target doesn't exist)

## 7. DAILY NOTES ENHANCEMENT (Priority: LOW)
Better daily note handling.

**Features:**
- "Today" button in sidebar creates/opens today's note
- Configurable daily note template
- Calendar view for daily notes
- Navigation to prev/next day

## 8. TEMPLATES (Priority: LOW - ALREADY EXISTS)
Enhance existing template system.

**Features:**
- Template picker modal on note creation
- Variables: `{{date}}`, `{{time}}`, `{{title}}`, `{{tags}}`
- Custom variables from settings

## 9. VIM MODE (Priority: MEDIUM)
Vim keybindings for power users.

**Features:**
- Install `@replit/codemirror-vim`
- Normal/Insert/Visual modes
- Mode indicator in status bar
- Full vim navigation (h/j/k/l, w/b/e, etc.)

## 10. GLOBAL KEYBOARD SHORTCUTS (Priority: HIGH)
Keyboard-first navigation.

| Shortcut | Action |
|----------|--------|
| `Ctrl+b` | Toggle sidebar |
| `Ctrl+o` | Toggle outline |
| `Ctrl+g` | Toggle graph |
| `Ctrl+p` | Quick switcher |
| `Ctrl+n` | New note |
| `Ctrl+s` | Save (show confirmation) |
| `Ctrl+/` | Focus search |
| `F2` | Rename note |
| `Ctrl+Shift+s` | Star/unstar note |

## 11. STATUS BAR (Priority: MEDIUM)
Bottom bar with useful info.

**Content:**
- Current note path
- Vim mode indicator (if enabled)
- Line:Column
- Word count
- Last saved time

## 12. BROKEN LINK DETECTION (Priority: LOW)
Highlight `[[links]]` that don't resolve.

**Features:**
- Red underline on broken links
- Hover shows "Note not found"
- Click to create the missing note

---

## Implementation Order

1. ✅ Outline pane (easy, high value)
2. ✅ Starred/favorites (easy, high value)
3. ✅ Global keyboard shortcuts (easy, enables faster work)
4. ✅ Status bar (easy, shows progress)
5. ✅ Outgoing links panel (medium, pairs with backlinks)
6. ✅ Vim mode (medium, optional feature)
7. ✅ PDF export (medium, useful)
8. ✅ Dataview queries (harder, powerful)
9. ✅ Canvas view (hardest, major feature)

---

## Quality Requirements
- Zero TypeScript errors
- Zero ESLint errors
- All features must be functional (no stubs)
- Test every feature manually
- Mobile responsive where applicable

After implementing:
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Fix ALL issues

# Mnemo - Backlinks Panel & Enhancements

Add the following features to Mnemo:

## 1. Backlinks Panel (HIGH PRIORITY)
- A panel that shows all notes linking TO the current note
- Should appear in the editor/preview area, either as a collapsible sidebar or bottom panel
- Parse all notes for `[[current note name]]` references
- Display as a list with snippets showing context around the link
- Clicking a backlink opens that note

## 2. Embed Support
- `![[Note Name]]` — embed another note's content inline
- `![[image.png]]` — display images from a configurable assets folder
- Render embedded content in the Preview pane with a visual indicator (border, different bg)

## 3. Tag Pane
- Sidebar section showing all tags with counts
- Click a tag to filter notes by that tag
- Parse `#tag` syntax from notes

## 4. Templates
- Settings option to define template folder path
- When creating new note, option to apply a template
- Templates support variables like `{{date}}`, `{{title}}`

## 5. Daily Note Auto-Create
- When clicking "Today" in sidebar or opening daily notes section
- Auto-create today's note if it doesn't exist
- Template: Daily template if configured

## Implementation

- Update API endpoints as needed (backlinks, tags, templates)
- Update React components
- Maintain zero lint errors, zero type errors
- Keep the beautiful professional UI style

## Files to modify
- packages/server/src/routes/notes.ts — add backlinks endpoint
- packages/server/src/services/noteService.ts — backlink parsing
- packages/server/src/routes/tags.ts — new file for tag endpoints
- packages/client/src/components/Editor/Editor.tsx — embeds support
- packages/client/src/components/Preview/Preview.tsx — render embeds
- packages/client/src/components/Sidebar/Sidebar.tsx — tags section, templates
- packages/client/src/App.tsx — backlinks panel integration

Build everything, run lint and typecheck, ensure it all passes.

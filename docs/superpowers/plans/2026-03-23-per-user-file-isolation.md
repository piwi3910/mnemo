# Per-User File Isolation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure note storage so each user has an isolated directory (`notes/{userId}/`) and all DB queries are scoped by userId.

**Architecture:** Add userId columns to SearchIndex, GraphEdge, and Settings entities. Create a per-user directory helper. Update all route handlers to resolve user-specific paths. Move sample note creation from startup to user registration. No client changes needed — API shapes stay the same.

**Tech Stack:** TypeORM (entity changes), Express (route updates), Node.js fs (directory operations)

**Spec:** `docs/superpowers/specs/2026-03-23-per-user-file-isolation-design.md`

**Working directory:** All paths relative to `/Users/pascal/Development/mnemo`.

---

## Task 1: Update entities — add userId to SearchIndex, GraphEdge, Settings

**Files:**
- Modify: `packages/server/src/entities/SearchIndex.ts`
- Modify: `packages/server/src/entities/GraphEdge.ts`
- Modify: `packages/server/src/entities/Settings.ts`

- [ ] **Step 1: Update SearchIndex entity**

Read `packages/server/src/entities/SearchIndex.ts`. Change:
- Add `@Index() @Column("text") userId: string;`
- Change PK from `@PrimaryColumn("text") notePath` to a compound PK using `@PrimaryColumn("text")` on both `notePath` AND `userId`

The entity should have two `@PrimaryColumn` decorators — TypeORM uses multiple `@PrimaryColumn` for compound PKs.

- [ ] **Step 2: Update GraphEdge entity**

Read `packages/server/src/entities/GraphEdge.ts`. Add:
- `@Index() @Column("text") userId: string;`

Keep the existing UUID primary key — no PK change needed for GraphEdge.

- [ ] **Step 3: Update Settings entity**

Read `packages/server/src/entities/Settings.ts`. Change:
- Add `@Index() @Column("text", { nullable: true }) userId: string | null;`
- Change PK to compound: `@PrimaryColumn("text")` on both `key` AND a new approach — since userId is nullable (global settings have null userId), we can't use it as a PK directly. Instead: keep `key` as PK but add a `userId` column. For the compound uniqueness, add `@Unique(["key", "userId"])` to the entity class and change the PK to a UUID `@PrimaryGeneratedColumn("uuid") id: string`.

Actually, simpler: change Settings to have a UUID PK + unique constraint on (key, userId):
- Replace `@PrimaryColumn("text") key` with `@PrimaryGeneratedColumn("uuid") id: string` + `@Column("text") key: string`
- Add `@Column("text", { nullable: true }) userId: string | null`
- Add `@Unique(["key", "userId"])` to the class

This avoids the nullable-PK issue while still enforcing uniqueness.

- [ ] **Step 4: Verify build**

```bash
cd /Users/pascal/Development/mnemo
npm run typecheck
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add userId to SearchIndex, GraphEdge, Settings entities"
```

---

## Task 2: Create userNotesDir helper and provisionUserNotes

**Files:**
- Create: `packages/server/src/services/userNotesDir.ts`

- [ ] **Step 1: Create the helper file**

Create `packages/server/src/services/userNotesDir.ts` with:

1. `getUserNotesDir(baseDir, userId)` — validates UUID format, returns `path.join(baseDir, userId)`, creates dir if needed
2. `provisionUserNotes(baseDir, userId)` — creates the user's notes directory and writes the sample notes (same content as `SAMPLE_NOTES` currently in `index.ts`). Also indexes all the notes (calls `indexNote` for each, and builds the graph). Move the `SAMPLE_NOTES` constant from `index.ts` into this file.
3. `cleanupOldNotes(baseDir)` — checks if `notes/` root has non-UUID files/dirs, moves them to `notes/.backup-pre-multiuser/`, logs a warning

Import `indexNote` from `searchService`, graph building from `graphService`.

- [ ] **Step 2: Verify build**

```bash
cd /Users/pascal/Development/mnemo
npm run typecheck
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add userNotesDir helper with provisioning and cleanup"
```

---

## Task 3: Update searchService and noteService for userId

**Files:**
- Modify: `packages/server/src/services/searchService.ts`
- Modify: `packages/server/src/services/noteService.ts`

- [ ] **Step 1: Update searchService.ts**

Read the file. Add `userId` parameter to all exported functions:
- `indexNote(notePath, content, userId)` — set `entry.userId = userId` before save. The save key is now the compound (notePath, userId).
- `removeFromIndex(notePath, userId)` — delete where `{ notePath, userId }`
- `renameInIndex(oldPath, newPath, userId)` — find by `{ notePath: oldPath, userId }`, update
- `search(query, userId)` — add `.andWhere("s.userId = :userId", { userId })` to the query builder
- `getAllTags(userId)` — filter `repo.find({ where: { userId } })`
- `getNotesByTag(tag, userId)` — filter by userId
- `extractTitle` — no change (doesn't touch DB)

- [ ] **Step 2: Update noteService.ts**

Read the file. The `indexAllNotes(notesDir)` function currently walks a global directory. Change to:
- `indexUserNotes(userNotesDir, userId)` — walks the user's directory, calls `indexNote(path, content, userId)` for each .md file

Any other functions that call `indexNote` or `removeFromIndex` need the userId parameter added.

- [ ] **Step 3: Verify build**

```bash
cd /Users/pascal/Development/mnemo
npm run typecheck
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add userId to searchService and noteService"
```

---

## Task 4: Update graphService for userId

**Files:**
- Modify: `packages/server/src/services/graphService.ts`

- [ ] **Step 1: Update graphService.ts**

Read the file. Add `userId` parameter:
- When creating GraphEdge records, set `userId`
- When querying edges, filter by `userId`
- `buildGraph(notesDir, userId)` or equivalent — scope to user
- Any `getGraph()` function — add `WHERE userId = :userId`

- [ ] **Step 2: Verify build**

```bash
cd /Users/pascal/Development/mnemo
npm run typecheck
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add userId to graphService"
```

---

## Task 5: Update file-based routes (notes, folders, daily, templates, canvas)

**Files:**
- Modify: `packages/server/src/routes/notes.ts`
- Modify: `packages/server/src/routes/folders.ts`
- Modify: `packages/server/src/routes/daily.ts`
- Modify: `packages/server/src/routes/templates.ts`
- Modify: `packages/server/src/routes/canvas.ts`

- [ ] **Step 1: Update notes.ts**

Read the file. In every route handler in BOTH `createNotesRouter` and `createNotesRenameRouter`:
- Replace `path.join(notesDir, ...)` with:
```ts
const userDir = await getUserNotesDir(notesDir, req.user!.id);
const fullPath = path.join(userDir, ...);
```
- For the file tree listing (GET `/`), scan `userDir` instead of `notesDir`
- Where `indexNote` or `removeFromIndex` or `renameInIndex` is called, pass `req.user!.id` as userId
- Where graph is rebuilt, pass `req.user!.id`

Import `getUserNotesDir` from `../services/userNotesDir`.

- [ ] **Step 2: Update folders.ts**

Same pattern — both `createFoldersRouter` and `createFoldersRenameRouter`. Resolve `userDir` per request. Pass userId to any service calls.

- [ ] **Step 3: Update daily.ts**

Resolve `userDir` for file operations. Update `getDailyTemplate()` to query Settings with userId, falling back to global (userId IS NULL):
```ts
const userTemplate = await settingsRepo.findOneBy({ key: "dailyNoteTemplate", userId: req.user!.id });
const globalTemplate = userTemplate || await settingsRepo.findOneBy({ key: "dailyNoteTemplate", userId: null as any });
```

- [ ] **Step 4: Update templates.ts**

Resolve `userDir` for template file operations.

- [ ] **Step 5: Update canvas.ts**

Resolve `userDir` for canvas file operations. The canvas directory is `path.join(userDir, "Canvas")` instead of `path.join(notesDir, "Canvas")`.

- [ ] **Step 6: Verify build**

```bash
cd /Users/pascal/Development/mnemo
npm run typecheck
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: resolve per-user notes dir in all file-based routes"
```

---

## Task 6: Update DB-query routes (search, graph, settings, backlinks, tags)

**Files:**
- Modify: `packages/server/src/routes/search.ts`
- Modify: `packages/server/src/routes/graph.ts`
- Modify: `packages/server/src/routes/settings.ts`
- Modify: `packages/server/src/routes/backlinks.ts`
- Modify: `packages/server/src/routes/tags.ts`

- [ ] **Step 1: Update search.ts**

Pass `req.user!.id` as userId to `search(query, userId)`.

- [ ] **Step 2: Update graph.ts**

Pass `req.user!.id` to graph service functions.

- [ ] **Step 3: Update settings.ts**

- GET: query `WHERE userId = :userId OR userId IS NULL`, with user-specific values taking precedence for same key
- PUT: upsert with `userId = req.user!.id` (keep the deny-list for admin-only keys)
- The existing `@PrimaryColumn("text") key` is now just `@Column`, and the entity has a UUID PK. Update the find/save logic accordingly.

- [ ] **Step 4: Update backlinks.ts**

Add `WHERE userId = :userId` filter to GraphEdge queries.

- [ ] **Step 5: Update tags.ts**

Pass `req.user!.id` to `getAllTags(userId)` and `getNotesByTag(tag, userId)`.

- [ ] **Step 6: Verify build**

```bash
cd /Users/pascal/Development/mnemo
npm run typecheck
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: scope search, graph, settings, backlinks, tags by userId"
```

---

## Task 7: Update auth routes for user provisioning

**Files:**
- Modify: `packages/server/src/routes/auth.ts`
- Modify: `packages/server/src/services/oauthService.ts`

- [ ] **Step 1: Update register endpoint in auth.ts**

After creating the user in POST `/register`, call `provisionUserNotes(NOTES_DIR, user.id)` to create the user's directory and sample notes. Import from `../services/userNotesDir`.

The `NOTES_DIR` value needs to be available in auth.ts. Either pass it when creating the router (`createAuthRouter(notesDir)`) or read from env.

- [ ] **Step 2: Update OAuth callbacks in auth.ts**

After the Google/GitHub callbacks, if the user was newly created, call `provisionUserNotes`. The `resolveOAuthUser` function needs to indicate whether the user is new.

- [ ] **Step 3: Update oauthService.ts**

Modify `resolveOAuthUser` to return `{ user, isNewUser }` instead of just `User`. The callbacks can then check `isNewUser` to decide whether to provision.

- [ ] **Step 4: Verify build**

```bash
cd /Users/pascal/Development/mnemo
npm run typecheck
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: provision user notes on registration and OAuth signup"
```

---

## Task 8: Update index.ts and admin routes

**Files:**
- Modify: `packages/server/src/index.ts`
- Modify: `packages/server/src/routes/admin.ts`

- [ ] **Step 1: Update index.ts**

1. Remove `SAMPLE_NOTES` constant (moved to userNotesDir.ts)
2. Remove `createSampleNotes()` function and its call
3. Remove global `indexAllNotes(NOTES_DIR)` call
4. Add startup cleanup: call `cleanupOldNotes(NOTES_DIR)` to move old root-level files to backup
5. Add startup: ensure `registration_mode = open` global setting exists (re-create if table was rebuilt)
6. Update the inline `/api/files/{path}` route to resolve per-user directory:
```ts
const userDir = await getUserNotesDir(NOTES_DIR, req.user!.id);
const fullPath = path.resolve(path.join(userDir, filePath));
const resolvedBase = path.resolve(userDir);  // validate against userDir, NOT NOTES_DIR
```

- [ ] **Step 2: Update admin.ts**

In `DELETE /admin/users/:id`: after deleting the User (which cascades auth records), also delete:
- `SearchIndex` rows where `userId = deletedUserId`
- `GraphEdge` rows where `userId = deletedUserId`
- `Settings` rows where `userId = deletedUserId`

Do NOT delete the `notes/{userId}/` directory (soft delete per spec).

- [ ] **Step 3: Verify full pipeline**

```bash
cd /Users/pascal/Development/mnemo
npm run typecheck
npm run lint
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: remove global note creation, add startup cleanup, update admin delete"
```

---

## Task 9: Final verification and push

- [ ] **Step 1: Full build check**

```bash
cd /Users/pascal/Development/mnemo
npm run typecheck
npm run lint
npm run build
```

Fix any errors.

- [ ] **Step 2: Commit and push**

```bash
git add -A
git status
git commit -m "feat: per-user file isolation complete"
git push
```

- [ ] **Step 3: Verify CI**

```bash
gh run watch $(gh run list --limit 1 --json databaseId -q '.[0].databaseId') --exit-status
```

# Changelog

## v3.1.0

### Security
- **Stored XSS prevention** — added `rehype-sanitize` with custom schema, HTML-escaped embed names and image alt attributes
- **WebSocket authentication** — session validation on upgrade handshake, disabled-user check, 64KB message size limit
- **Security headers** — Helmet with CSP (`script-src 'self'`, `object-src 'none'`, `frame-ancestors 'self'`), SVG files served with `script-src 'none'`
- **Path traversal hardening** — centralized `validatePathWithinBase` utility, plugin ID validation, plugin manifest server entry containment
- **Input validation** — Zod schemas on all endpoints (11 new schemas), content size limits (1MB), path length limits (500 chars)
- **Invite code race condition fix** — atomic claiming via `updateMany` with `usedById: null` condition
- **Docker hardening** — non-root `app` user, `.dockerignore`, env var placeholders (no hardcoded passwords)
- **Env validation** — fail-fast startup if `BETTER_AUTH_SECRET` or `DATABASE_URL` missing; secret passed explicitly to better-auth
- **Error privacy** — centralized error handler strips filesystem paths from client responses
- **Folder-share prefix fix** — require trailing `/` to prevent `"Work"` matching `"Worklog/"`

### Code Quality
- **Centralized error handling** — `AppError` classes + Express error middleware replace 15+ duplicated try/catch blocks
- **Shared path utilities** — `decodePathParam`, `ensureExtension`, `validatePathWithinBase` eliminate 5 duplicate implementations
- **Structured logging** — `createLogger(context)` with timestamps, levels, and context replaces 30+ raw `console.*` calls
- **Zod validation everywhere** — all admin, shares, canvas, folder, and rename routes now validated (previously raw `as` casts)
- **`requireUser()` helper** — eliminates 40+ `req.user!` non-null assertions with proper 401 error on missing auth
- **N+1 query fixes** — batched queries in search, graph, and backlinks services; `select` clauses on tag queries
- **Async fs** — replaced all `readFileSync`/`readdirSync` in PluginManager with async equivalents
- **Plugin API through noteService** — plugin file operations now trigger search index and graph cache updates

### Client Improvements
- **DataviewBlock extracted** from Preview.tsx into its own component + query parser
- **D3 graph extracted** into `useD3Graph` hook with named config constants (was 275-line useEffect with 12 magic numbers)
- **Shared `noteTreeUtils`** — deduplicated tree traversal between Preview and Editor
- **Zustand store cleanup** — grouped selectors into logical slices, removed dead code, added `reset()` on logout
- **AppContent decomposed** — extracted AppStatusBar and AppModals as focused sub-components

### Documentation
- **SPEC.md rewritten** — was describing single-user TypeORM app, now matches actual v3 architecture
- **CONTRIBUTING.md** — branch naming, commit conventions, PR process, setup instructions
- **Plugin development guide** (`docs/PLUGINS.md`) — manifest format, lifecycle, server + client APIs
- **CHANGELOG.md** — retroactive for v3.0.0, maintained going forward
- **README updated** — test commands, plugin system in architecture diagram

### Configuration & DX
- **CI runs tests** — added `npm run test` step and `prisma generate` to pipeline
- **Coverage configuration** — `@vitest/coverage-v8` with text+lcov reporters
- **Stricter ESLint** — `eqeqeq: error`, `no-explicit-any: warn`
- **`.editorconfig`** — 2-space indent, LF, UTF-8, trim trailing whitespace
- **`strictPropertyInitialization`** re-enabled in server tsconfig
- **Default registration mode** changed from `"open"` to `"invite-only"`

## v3.0.0

### Major Changes
- **Multi-user support** with per-user file isolation (`notes/{userId}/`)
- **better-auth integration** replacing hand-rolled JWT auth — email/password, Google/GitHub OAuth, and passkey (WebAuthn) support
- **Prisma ORM** replacing TypeORM for all database access
- **Plugin ecosystem** with server-side and client-side extension points, plugin registry, and admin management
- **Note sharing** with read/read-write permissions, access requests, and shared note visibility in graph/search/sidebar

### Features
- MiniSearch in-memory full-text search (replacing Prisma ILIKE)
- Zustand + TanStack Query for client state management
- Zod validation and express-rate-limit on API routes
- Admin panel with user management, invite codes, and registration settings
- Vim mode extracted into a plugin
- Canvas/whiteboard feature
- Daily notes and templates
- PDF export via browser print
- Swagger/OpenAPI documentation at `/api/docs`

### Refactors
- Server migrated to ESM
- Wiki-link parsing moved to remark-wiki-link + custom rehype plugin
- Manual debouncing replaced with use-debounce and hotkeys-js
- html2canvas+jsPDF replaced with window.print() for PDF export

### Security
- XSS prevention via rehype-sanitize on shared notes
- CSRF protection via `X-Requested-With` header
- Path traversal prevention on all file routes
- SHA-256 hashed refresh tokens in httpOnly cookies

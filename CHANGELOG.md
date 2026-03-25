# Changelog

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

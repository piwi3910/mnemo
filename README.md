# Mnemo

A self-hosted, web-based note-taking application with Obsidian-like features.

## Overview

Mnemo is a personal knowledge base built for local-first principles. Your notes are stored as plain Markdown files on disk with with no vendor lock-in. No cloud services required.

## Quick Start

### Development

```bash
# Clone and install
git clone https://github.com/piwi3910/mnemo.git
cd mnemo
npm install

# Start development servers
npm run dev
```

The App runs at http://localhost:5173 (frontend) and http://localhost:3001 (backend)

### Production Build

```bash
# Build for production
npm run build

# Run with Docker
docker compose up -d
```

Access at http://localhost:3100

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | Express + TypeScript |
| Database | PostgreSQL (caching only) |
| Editor | CodeMirror 6 |
| Styling | Tailwind CSS |

## Features

| Feature | Status | Notes |
|---------|--------|-------|
| File tree sidebar | ✅ | Folder navigation |
| Markdown editor | ✅ | CodeMirror 6 with syntax highlighting |
| Live preview | ✅ | Side-by-side rendered view |
| Wiki-links | ✅ | `[[link]]` autocomplete |
| Full-text search | ✅ | Search across all notes |
| Graph view | ✅ | D3 force-directed graph |
| Dark/light theme | ⚠️ | See known issues |
| Keyboard shortcuts | ✅ | Ctrl+B/O/P/N etc. |
| Tags | ✅ | `#tag` support |
| Templates | ✅ | Quick note templates |
| Daily notes | ✅ | Date-based note creation |
| Backlinks | ✅ | Incoming links panel |
| Outgoing links | ✅ | Links from current note |
| Broken link detection | ✅ | Highlights missing links |
| Canvas view | ✅ | Visual canvas for ideas |
| Outline pane | ✅ | Ctrl+O |
| Starred notes | ✅ | Favorites system |
| PDF export | ✅ | Export notes as PDF |
| Vim mode | ✅ | Optional vim keybindings |
| Quick switcher | ✅ | Ctrl+P fuzzy search |
| Status bar | ✅ | Line/column/vim mode |

### Known Issues

- **Theme toggle** - Theme dropdown may not save selection properly. See [Issue #4735](https://github.com/piwi3910/mnemo/issues/4735)

## Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────┐
│   Browser      │      │  React App       │      │           │
│─────────────────┤──────┬─────────────────┤──────┬─────────┤
                                        │
┌─────────────────┐      ┌─────────────────┐
│   Express API   │      │  PostgreSQL     │
│   (port 3001)  │      │  (port 5432)       │
└─────────────────┴──────┴─────────────────┴──────┘
                                        │
┌─────────────────┐
│   File System   │
│   ./notes/   │
│   Markdown files stored on disk    │
└─────────────────┘
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notes` | List all notes as tree |
| GET | `/api/notes/:path` | Get note content |
| POST | `/api/notes` | Create new note |
| PUT | `/api/notes/:path` | Update note |
| DELETE | `/api/notes/:path` | Delete note |
| GET | `/api/tags` | List all tags |
| GET | `/api/graph` | Get graph data |
| GET | `/api/search?q=query` | Full-text search |
| GET | `/api/backlinks/:path` | Get backlinks |
| GET | `/api/outline/:path` | Get note outline |

## Deployment

### Docker

```yaml
services:
  mnemo:
    image: ghcr.io/piwi3910/mnemo/mnemo:latest
    ports:
      - "3100:3000"
    volumes:
      - ./notes:/notes
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/mnemo
      - NOTES_DIR=/notes
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=mnemo
      - POSTGRES_PASSWORD=postgres
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d mnemo"]
      interval: 2s
      timeout: 5s
      retries: 10
    restart: unless-stopped

volumes:
  pgdata:
```

### Manual Deployment

1. Pull the image: `docker pull ghcr.io/piwi3910/mnemo/mnemo`
2. Run: `docker compose -f docker-compose.yml up -d`

## Development

```bash
# Install dependencies
npm install

# Start dev servers (frontend on :5173, backend on :3001)
npm run dev
```

## License

MIT

# Mnemo

A self-hosted, web-based note-taking application — an Obsidian replacement.

See [SPEC.md](./SPEC.md) for full technical specification.

## Quick Start

```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Build for production
npm run build

# Run with Docker
docker-compose up
```

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Backend**: Express + TypeScript + TypeORM
- **Database**: PostgreSQL (caching/indexing only)
- **Editor**: CodeMirror 6
- **Deploy**: Docker

## Features

- Local Markdown files (no vendor lock-in)
- Wiki-style `[[linking]]`
- Graph view of connections
- Full-text search
- Dark/light mode
- Responsive design

## CI/CD

GitHub Actions automates build and deploy on push to master.

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `TRUENAS_HOST` | TrueNAS IP address (e.g., `192.168.10.253`) |
| `TRUENAS_USER` | SSH username (e.g., `root`) |
| `TRUENAS_PASSWORD` | SSH password |

### Workflow

1. **Build job**: TypeCheck → Lint → Build → Upload artifacts
2. **Docker job**: Build image → Push to `ghcr.io/piwi3910/mnemo:latest`
3. **Deploy job**: SSH to TrueNAS → Pull image → Restart containers

### Manual Deploy

```bash
# On TrueNAS
cd /mnt/Pool0/Docker/mnemo
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

## License

MIT

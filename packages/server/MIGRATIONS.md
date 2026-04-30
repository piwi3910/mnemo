# Database Migrations

Kryton uses [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate) for database schema versioning.

## For developers

When you change `prisma/schema.prisma`, create a new migration:

```bash
DATABASE_URL="file:./data/kryton.db" npx prisma migrate dev --name describe_your_change
```

This generates a new migration file in `prisma/migrations/`. Commit it alongside your schema change.

## For production

Migrations run automatically on container startup via `scripts/migrate.mjs`. The script:

1. Backs up the database (keeps the 5 most recent backups)
2. Detects legacy databases and baselines them
3. Runs `prisma migrate deploy` to apply any pending migrations

## Upgrading from pre-v3.3.0 (db push era)

Databases created before v3.3.0 used `prisma db push` and have no migration history. The migration script detects this automatically (no `_prisma_migrations` table present) and baselines the `init` migration before applying any subsequent ones. No manual action is required.

## Renaming `mnemo.db` → `kryton.db` (local dev only)

If you have a local development database file at `packages/server/data/mnemo.db` from before the Mnemo→Kryton rename, rename it once:

```bash
cd packages/server/data
mv mnemo.db kryton.db
mv mnemo.db-journal kryton.db-journal 2>/dev/null
mv mnemo.db-wal kryton.db-wal 2>/dev/null
mv mnemo.db-shm kryton.db-shm 2>/dev/null
```

Then update your local `.env` so `DATABASE_URL="file:./data/kryton.db"`. Production deployments are unaffected — the production Prisma config and Docker entrypoint already reference the new filename.

## Upgrading to v4.4 sync v2

The `20260430153558_sync_v2` migration adds 11 new models (Folder, Tag, NoteTag, NoteRevision, Attachment, Agent, AgentToken, YjsDocument, YjsUpdate, SyncCursor, NoteVersion) and `version` + `cursor` columns on existing tier 1 models. Apply via `npx prisma migrate deploy`. The migration script handles this automatically on container startup.

After v4.4 deployment, on first user login the server lazily backfills `Folder` rows from the user's notes directory and `Tag`+`NoteTag` rows from `SearchIndex.tags`. No manual backfill is required.

#!/bin/sh
set -e

# Sync database schema (SQLite — creates the file if it doesn't exist)
echo "Running database schema sync..."
npx prisma db push --accept-data-loss 2>&1 || \
  echo "Warning: prisma db push failed, continuing anyway"

exec node dist/index.js

#!/bin/sh
# Runs once per container start: bring the DB schema up to date, optionally
# seed demo data, then hand off to the CMD (`next start`).
set -e

echo "→ Applying database schema (prisma db push)…"
npx prisma db push --skip-generate --accept-data-loss

if [ "${SEED_ON_START:-false}" = "true" ]; then
  echo "→ Seeding demo data…"
  npx prisma db seed || echo "⚠ Seed step failed or data already present — continuing."
fi

echo "→ Starting Next.js…"
exec "$@"

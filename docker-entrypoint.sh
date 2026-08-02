#!/bin/sh
set -e

echo "→ Applying database migrations (prisma migrate deploy)…"
./node_modules/.bin/prisma migrate deploy

echo "→ Ensuring an invitation exists (idempotent seed)…"
node prisma/seed.mjs || echo "⚠ seed skipped (non-fatal)"

echo "→ Starting Next.js server…"
exec node server.js

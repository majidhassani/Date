#!/bin/sh
set -e

# Run the Prisma CLI from its real package path so its sibling *.wasm assets and
# transitive deps (e.g. effect) resolve correctly.
echo "→ Applying database migrations (prisma migrate deploy)…"
node node_modules/prisma/build/index.js migrate deploy

echo "→ Ensuring an invitation exists (idempotent seed)…"
node prisma/seed.mjs || echo "⚠ seed skipped (non-fatal)"

echo "→ Starting Next.js server…"
exec node_modules/.bin/next start

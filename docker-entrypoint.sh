#!/bin/sh
set -e

# Invoke the Prisma CLI from its real package path (NOT node_modules/.bin/prisma).
# The .bin entry is a symlink; when copied into the slim runtime image it loses
# its sibling *.wasm files, so we call build/index.js directly where the wasm
# assets live.
PRISMA="node node_modules/prisma/build/index.js"

echo "→ Applying database migrations (prisma migrate deploy)…"
$PRISMA migrate deploy

echo "→ Ensuring an invitation exists (idempotent seed)…"
node prisma/seed.mjs || echo "⚠ seed skipped (non-fatal)"

echo "→ Starting Next.js server…"
exec node server.js

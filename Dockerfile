# syntax=docker/dockerfile:1

# ---- Base ----
FROM node:20-alpine AS base
# libc6-compat + openssl are needed by Prisma's engines on Alpine (musl).
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
# Network resilience for flaky servers / registries.
ENV npm_config_fetch_retries=5 \
    npm_config_fetch_retry_maxtimeout=120000 \
    npm_config_fetch_timeout=600000 \
    NEXT_TELEMETRY_DISABLED=1

# ---- Dependencies ----
FROM base AS deps
COPY package.json package-lock.json* ./
# The Prisma schema must exist because `postinstall` runs `prisma generate`.
COPY prisma ./prisma
# Prefer a reproducible install; fall back to `npm install` if the lock drifts
# or an older npm on the host chokes on optional deps.
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

# ---- Builder ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Ensure /app/public exists even if the repo has no public/ dir.
RUN mkdir -p public
# Env validation is deferred to runtime; the build needs no real secrets/DB.
ENV SKIP_ENV_VALIDATION=1
RUN npm run build
# Drop dev-only deps but KEEP runtime + Prisma CLI (prisma is a prod dependency).
RUN npm prune --omit=dev

# ---- Runner ----
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Full production node_modules (includes next + prisma CLI + all deps/engines).
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/prisma ./prisma
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]

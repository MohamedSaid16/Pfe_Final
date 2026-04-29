# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────
# Backend — Node.js + Express + Prisma (PostgreSQL)
# Multi-stage: deps → build → runtime
# ─────────────────────────────────────────────────────────────

# ── Stage 1: install all deps and build TypeScript ──────────
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# OpenSSL is required by Prisma engines on slim images
RUN apt-get update -y && apt-get install -y --no-install-recommends \
        openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies (postinstall runs `prisma generate`, so the schema must
# be in place before `npm ci`).
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# Copy source and compile TS → dist/
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Strip dev deps from node_modules for a leaner runtime copy
RUN npm prune --omit=dev


# ── Stage 2: minimal runtime image ──────────────────────────
FROM node:20-bookworm-slim AS runtime

ENV NODE_ENV=production \
    PORT=5000

WORKDIR /app

RUN apt-get update -y && apt-get install -y --no-install-recommends \
        openssl ca-certificates tini \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nodejs

# App artifacts
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

# Persisted runtime dirs
RUN mkdir -p /app/uploads/profiles /app/uploads/documents /app/uploads/others \
    && chown -R nodejs:nodejs /app/uploads

USER nodejs

EXPOSE 5000

# tini = proper PID 1 (signal handling, zombie reaping)
ENTRYPOINT ["/usr/bin/tini", "--"]

# Apply pending migrations on container start, then boot the server.
# Use `migrate deploy` (idempotent, prod-safe) — never `migrate dev` in containers.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]

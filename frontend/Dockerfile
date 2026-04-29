# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────
# Frontend — React (CRA) build → static assets served by nginx
# ─────────────────────────────────────────────────────────────

# ── Stage 1: build the React bundle ─────────────────────────
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# CRA bakes REACT_APP_* vars into the bundle at build time.
# Pass via `--build-arg REACT_APP_API_URL=https://api.example.com/api/v1` etc.
ARG REACT_APP_API_URL=http://localhost:5000/api/v1
ARG REACT_APP_AI_URL=http://localhost:5001
ENV REACT_APP_API_URL=$REACT_APP_API_URL \
    REACT_APP_AI_URL=$REACT_APP_AI_URL \
    CI=true \
    GENERATE_SOURCEMAP=false

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


# ── Stage 2: serve static build via nginx ───────────────────
FROM nginx:1.27-alpine AS runtime

# Custom config: SPA fallback, gzip, cache headers
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

# nginx image already has a sensible CMD; no override needed.

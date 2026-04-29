# Docker Setup — University Management System

Containerizes the four pieces of the stack:

| Service       | Image base                | Container port | Host port | Notes                                              |
| ------------- | ------------------------- | -------------- | --------- | -------------------------------------------------- |
| `db`          | `postgres:16-alpine`      | 5432           | 5432¹     | Persisted in `db_data` volume                      |
| `backend`     | `node:20-bookworm-slim`   | 5000           | 5000      | Runs `prisma migrate deploy` on boot               |
| `ai-service`  | `python:3.11-slim`        | 5001           | 5001      | Caches HF/torch models in `ai_cache` volume        |
| `frontend`    | `nginx:1.27-alpine`       | 80             | 3000      | Serves the CRA build, SPA fallback, gzip, caching  |

¹ Bound to `127.0.0.1` only — Postgres is not exposed on the LAN.

## Quick start

```bash
cp .env.example .env
# edit .env — at minimum set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET
docker compose up -d --build
```

Then:

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:5000>
- AI service: <http://localhost:5001/docs>

First build is slow (~5–10 min) because the AI image installs PyTorch +
Transformers + EasyOCR. Subsequent builds reuse the layer cache.

## Common commands

```bash
docker compose up -d --build         # build + start everything
docker compose logs -f backend       # tail one service
docker compose ps                    # status + healthchecks
docker compose down                  # stop (keeps volumes)
docker compose down -v               # stop AND wipe DB / uploads / model cache
docker compose exec backend sh       # shell into backend
docker compose exec db psql -U postgres -d university_db
```

## Database migrations & seed

The backend runs `prisma migrate deploy` on every container start, so applied
migrations are idempotent. To run the seed manually:

```bash
docker compose exec backend npx prisma db seed
```

To reset the database (destructive):

```bash
docker compose down -v
docker compose up -d --build
```

## Environment variables

All env vars live in `.env` at the repo root and are wired into the relevant
services by `docker-compose.yml`. The Prisma `DATABASE_URL` is constructed from
the Postgres credentials — you don't need to set it manually.

`REACT_APP_*` vars are **build-time** for CRA. If you change them, rebuild the
frontend image:

```bash
docker compose up -d --build frontend
```

## Persistent volumes

| Volume             | Mounted at                     | Purpose                              |
| ------------------ | ------------------------------ | ------------------------------------ |
| `db_data`          | `/var/lib/postgresql/data`     | Postgres data files                  |
| `backend_uploads`  | `/app/uploads`                 | User-uploaded files (profile, docs)  |
| `ai_cache`         | `/app/.cache`                  | HuggingFace + torch model cache      |
| `ai_data`          | `/app/data`                    | FAISS indexes, generated artifacts   |

`docker compose down` keeps these. `docker compose down -v` deletes them.

## Production notes

- **Set strong `JWT_*` secrets.** The defaults in `.env.example` are
  placeholders — deployments must replace them.
- **Set `REACT_APP_API_URL` / `REACT_APP_AI_URL` to your public URLs**
  before building the frontend image (they're baked into the bundle).
- **Put a TLS-terminating reverse proxy** (Caddy / Traefik / nginx) in front
  of `backend` and `frontend` for HTTPS.
- The Postgres port is bound to localhost only. To reach it from another host,
  prefer `docker compose exec db psql` or an SSH tunnel rather than opening
  the port.
- The AI service downloads models on first request. Pre-warming runs on
  startup but may take 30–60s; the `start_period` in the healthcheck accounts
  for this.

## Troubleshooting

**Backend exits with `Missing required environment variable`** — check that
`.env` is present and the relevant var is set, then `docker compose up -d`.

**Frontend hits `localhost:5000` from the user's browser instead of the
container** — that's correct. The browser runs on the host, so `localhost`
points at the host port mapping, not at the container network. If you deploy
behind a domain, set `REACT_APP_API_URL` to that domain at build time.

**Prisma engine errors about OpenSSL on Alpine** — we deliberately use
`bookworm-slim` (Debian) instead of Alpine for the backend; Prisma's prebuilt
binaries don't ship for musl by default.

**AI service OOM / slow** — the models need ~2–4 GB RAM. Increase Docker
Desktop's memory limit or run `ai-service` on a beefier host.

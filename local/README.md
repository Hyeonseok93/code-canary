# Local Docker Compose

Local development stack only. **CI/CD deploy uses ECS + Terraform** (`infra/`, `.github/workflows/`).

## Prerequisites

- Repo-root `.env` with `DB_PASSWORD`, `JWT_SECRET` (≥32 chars), `REDIS_PASSWORD`
- Docker Desktop (WSL integration on Linux paths)

## Start stack

From repo root:

```bash
local/docker-up.cmd      # Windows
local/docker-up.sh       # WSL / Linux
```

This runs `local/prepare-docker-secrets.sh` (writes `local/.docker-secrets/`) then `docker compose` with `local/docker-compose.yml`.

Pipeline staging files live in repo-root `data/` (gitignored).

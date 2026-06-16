# Code Canary

Vulnerability intelligence dashboard and operator console for pipeline ingestion control.

## Environment

All configuration lives in **`.env`** at the repo root (database, JWT, worker URLs, operator SPA routes, local dev API proxy).

Backend and worker load it automatically. Vite reads the same file for `VITE_*` vars (`envDir` points to repo root).

Required secrets before Docker: `DB_PASSWORD`, `JWT_SECRET`.

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_ADMIN_BASE` | `/roost` | Operator console URL prefix |
| `VITE_ADMIN_HATCH` | `hatch` | Login sub-path |
| `VITE_ADMIN_FORAGE` | `forage` | Job monitor sub-path |
| `VITE_DEV_API_TARGET` | `http://localhost:8080` | Local dev API proxy (`npm run dev`) |

Routes read `VITE_*` via `frontend/src/constants/roostPaths.ts`. Rebuild the frontend after changing operator paths.

See root `.env` for the full list with comments.

## Local development

```bash
# Frontend (from frontend/)
npm ci
npm run dev

# Full stack — configure root .env, then:
local/docker-up.cmd      # Windows (see local/README.md)
local/docker-up.sh       # WSL / Linux
```

Backend API paths (`/api/auth/*`, `/api/admin/*`) stay server-side only.

## Operations

### Do not publish production URLs

- Do **not** document the live operator URL in this repo, wikis, or tickets.
- If you change `VITE_ADMIN_*`, update nginx allowlist paths to match (see `frontend/nginx.conf`).

### Do not use default operator accounts

- Create operator accounts with strong, unique passwords.
- Do **not** reuse example credentials from SQL scripts in production.

### Nginx IP allowlist (production)

Restrict operator SPA paths (`VITE_ADMIN_*`) and `/api/auth/login`, `/api/admin/**` to trusted IPs. See commented examples in `frontend/nginx.conf`.

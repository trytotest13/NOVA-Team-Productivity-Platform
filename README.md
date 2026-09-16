# NOVA — Team Productivity Platform

> Plan. Collaborate. Deliver.
> Full-stack project management: projects, kanban tasks, comments, activity feed, dashboard.

## Stack

Next.js 14 (App Router) + React 18 + TypeScript strict · Tailwind 3 · Postgres 16 + Prisma 5 · JWT Bearer (`jose`, 7d) + bcryptjs · Zod · TanStack Query v5 + Zustand · dnd-kit kanban · RHF · Lucide

Split deploy: **API on Render, Web on Vercel** (cookies can't cross origins, so Bearer tokens in `localStorage`).

## Quickstart (local)

```bash
cp .env.example .env        # fill DATABASE_URL, AUTH_JWT_SECRET (openssl rand -base64 32)
docker compose up -d        # postgres:16 on :5432
pnpm install
pnpm db:migrate             # prisma migrate dev
pnpm db:seed                # demo data (needs SEED_DEMO_PASSWORD) -> demo@nova.app
pnpm dev                    # http://localhost:3000
```

Checks: `pnpm lint`, `pnpm typecheck`, `pnpm build`

## Env

| Var | Where | Purpose |
|---|---|---|
| `APP_ROLE=api\|web` | both | `api` = full backend, `web` = frontend only (no DB creds) |
| `DATABASE_URL` | api | Postgres connection (`sslmode=require` in prod) |
| `AUTH_JWT_SECRET` | api | JWT signing secret |
| `FRONTEND_URL` | api | Exact web origin (CORS allow-list) |
| `GOOGLE_CLIENT_ID/SECRET` | api | Optional; button hidden when empty |
| `SEED_DEMO_PASSWORD` | seed | Demo account password |
| `NEXT_PUBLIC_API_URL` | web | API base URL, e.g. `https://nova-api.onrender.com` |

## Deploy

See `DEPLOYMENT.md`. Summary: Postgres (Neon) → Render Blueprint (`render.yaml`, health `/api/health`, set `FRONTEND_URL`) → `pnpm db:deploy && pnpm db:seed` → Vercel (`APP_ROLE=web`, `NEXT_PUBLIC_API_URL`) → backfill `FRONTEND_URL` on Render.

## Features → assignment rubric

| Requirement | Where |
|---|---|
| Frontend (Next.js, dashboard, board/list/activity/settings) | `src/app/(app)`, `src/components`, `src/hooks` |
| Backend + API (REST, envelopes, Zod, status codes) | `src/app/api/**`, `src/lib/api.ts`, `src/lib/validations/`, `docs/api.http` |
| Database (relational schema, migrations, seed) | `prisma/schema.prisma`, `prisma/seed.ts` |
| Auth (register/login/logout, Google OAuth, isolation) | `src/app/api/auth/**`, `src/app/api/register`, `src/app/(auth)` |
| Deployment (public URL + demo account) | `DEPLOYMENT.md`, `render.yaml` |

Auth: email+password (bcrypt) + optional Google (API-tier, JWKS-verified). Every API route checks session + project membership; users only see their own projects.

## Docs

`prd.md` requirements · `trd.md` stack/API/auth · `architecture.md` layout + data flow · `schema.md` DB · `design.md` UI tokens · `implementation.md` tasks · `todo.md` tracker · `SECURITY.md` · `DEPLOYMENT.md` runbook

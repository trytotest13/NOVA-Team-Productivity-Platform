# Deploying NOVA — API on Render, Web on Vercel

Architecture rationale and the auth model live in `trd.md` §5/§5b. This is the click-by-click runbook.

## 0. Prerequisites

- GitHub repo pushed (this one)
- A managed Postgres: **Neon** (free, permanent) or **Render Postgres** (free tier expires)
- Accounts on [render.com](https://render.com) and [vercel.com](https://vercel.com)

## 1. Database

1. Create a PostgreSQL 16 instance (Neon project, or Render → New → PostgreSQL).
2. Copy the connection string (ensure `sslmode=require`).

## 2. API tier — Render

1. Render → New → **Blueprint** → select this repo (reads `render.yaml`), or New → Web Service with:
   - Build: `pnpm install && pnpm build`
   - Start: `pnpm start` (`next start` binds Render's `$PORT` automatically)
   - Health check path: `/api/health`
2. Set environment variables (render.yaml prefills `APP_ROLE`; `AUTH_JWT_SECRET` auto-generates):
   - `DATABASE_URL` = connection string from step 1
   - `FRONTEND_URL` = your exact Vercel origin (add after step 3, then redeploy — CORS is locked to it)
3. First deploy: run migrations + seed from the Render shell (or locally against the prod DB):
   ```bash
   pnpm db:deploy   # prisma migrate deploy
   pnpm db:seed     # demo data (SEED_DEMO_PASSWORD must be set for the seed run)
   ```
4. Note the API URL, e.g. `https://nova-api.onrender.com` — verify `GET /api/health` returns
   `{"data":{"status":"ok","role":"api"}}`.

## 3. Web tier — Vercel

1. Vercel → Add New → Project → import the repo (framework auto-detects Next.js).
2. Environment variables (Production + Preview):
   - `APP_ROLE=web`
   - `NEXT_PUBLIC_API_URL=https://nova-api.onrender.com` (your Render URL from step 2.4)
3. Deploy. Note the origin, e.g. `https://nova.vercel.app`.
4. Go back to Render → set `FRONTEND_URL=https://nova.vercel.app` (exact origin, no trailing slash)
   → redeploy the API so CORS allows the web origin.

## 4. Google OAuth (optional)

1. Google Cloud console → Credentials → OAuth client (Web application).
2. Authorized redirect URI: `https://nova-api.onrender.com/api/auth/google/callback`
3. Put the client id/secret on the **Render** service → redeploy. The login page's Google button
   starts `GET /api/auth/google`, which redirects to Google and returns the JWT to `/auth/callback`.

## 5. Smoke checklist (maps to implementation.md P4-T6 acceptance)

- [ ] Vercel URL loads the landing page
- [ ] Register → dashboard works end-to-end (token via `/api/register`)
- [ ] `curl -i https://nova-api.onrender.com/api/projects` → `401` with
      `access-control-allow-origin: https://nova.vercel.app` header present
- [ ] Board drag-and-drop persists after refresh
- [ ] Demo login `demo@nova.app` works (if seeded)

## Notes

- **Free Render instances sleep** after ~15 min idle — first request after sleep takes ~30-60s.
- The web tier holds **no** database credentials; every data call is a Bearer-authenticated API call.
- Rotate `AUTH_JWT_SECRET` ⇒ all sessions invalid (users just log in again).

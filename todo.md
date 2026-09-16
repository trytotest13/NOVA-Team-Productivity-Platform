# NOVA — Live Task Tracker

> **AI instruction (always applies):** after completing every task, update this file *without being
> asked* — move the finished task to `[x] Done`, set the next task to `[/] In Progress`, and add a
> one-line note (files touched / verification result) under **Session Log**. Re-read the relevant
> docs (`prd.md`, `trd.md`, `architecture.md`, `schema.md`, `design.md`, `rules.md`) before each task.
> Task definitions & acceptance criteria live in `implementation.md`.

Legend: `[ ]` Todo · `[/]` In Progress · `[x]` Done

---

## Todo

### Phase 2 — Database, Auth & API
- [ ] P2-T1 Local database (docker-compose postgres:16) + Prisma init
- [ ] P2-T2 Prisma schema + migration (match schema.md)
- [ ] P2-T3 Seed script (demo users/projects/tasks/comments/activity)
- [ ] P2-T4 NextAuth (credentials + Google, JWT, middleware, login/register pages)
- [ ] P2-T5 API foundation (guards, envelopes, Zod validations, api.http)
- [ ] P2-T6 Projects + members API
- [ ] P2-T7 Tasks + comments + reorder + activity + dashboard API

### Phase 3 — Core Features
- [ ] P3-T1 App shell (sidebar, topbar, user menu)
- [ ] P3-T2 Projects list + create dialog
- [ ] P3-T3 Project detail, settings + member manager
- [ ] P3-T4 Kanban board (dnd-kit, optimistic updates, keyboard path)
- [ ] P3-T5 Task list + URL-driven filters
- [ ] P3-T6 Task drawer + comments
- [ ] P3-T7 Activity feed
- [ ] P3-T8 Dashboard (stats, my tasks, progress bars)

### Phase 4 — Polish & Deployment
- [ ] P4-T1 Global loading/error/not-found + toasts everywhere — **largely pre-completed in Phase 3**:
  `(app)/loading.tsx`, `(app)/error.tsx`, root `not-found.tsx`, toasts on all mutations, skeletons on
  every async surface. Remaining: sweep for missed states.
- [ ] P4-T2 Accessibility pass (keyboard walkthrough, axe, contrast)
- [ ] P4-T3 Responsive QA (360/768/1280)
- [ ] P4-T4 Performance pass (Lighthouse ≥ 90)
- [ ] P4-T5 Security pass (secret scan, audit, middleware coverage)
- [ ] P4-T6 Deployment (Neon + Vercel, migrations, OAuth prod URIs, prod seed) — needs Neon/Vercel accounts
- [ ] P4-T7 Final QA + README + demo script

## In Progress

- [/] P4-T6 Deployment (split: API on Render, Web on Vercel) — **code + configs complete, awaiting
  your Render/Vercel accounts to click through**. Follow `DEPLOYMENT.md` (runbook) and `render.yaml`.
  DB must be migrated/seeded first (`docker compose up -d` locally, or Neon/Render Postgres in prod).

## Done

- [x] Split-deployment refactor (user request: "backend on Render, frontend on Vercel") — commits
  fe10730 + b51a0f5. NextAuth cookie auth replaced with **JWT Bearer** (`jose`, HS256, 7d) because
  cookies cannot cross the Vercel/Render origins; full change list in the Session Log below.

- [x] P3-T1…P3-T8 — Phase 3 complete in one pass (commit 8348fa7): app shell + sidebar + user menu,
  dashboard (stats/my tasks/progress, deep-link to board drawer), projects list + create dialog +
  archive/delete, project layout with tabs + server-side membership gate, kanban board (dnd-kit,
  optimistic reorder w/ rollback, quick-add, keyboard "Move to…" path), task list with URL-driven
  filters + overdue highlighting, shared task drawer (edit/assign/due date, comments, delete),
  activity feed (infinite scroll, human-readable), settings + member manager (owner-guarded,
  last-owner protection surfaced via toasts). lint + typecheck + build all green (12 routes).

- [x] P1-T1…P1-T6 — Phase 1 complete (see Session Log history below).
- [x] P2-T1 Local database — docker-compose.yml (postgres:16) + Prisma 5.22 singleton + db scripts.
  **Amended (user request): Docker not run in this session** — `docker compose up -d` + `pnpm db:migrate`
  are pending; every other gate passes without a live DB.
- [x] P2-T2 Prisma schema — valid per schema.md (enums, FKs, cascades, indexes); client generated.
  Fix: added missing `Activity.createdAt` to schema.md (doc bug caught by prisma validate).
- [x] P2-T3 Seed — idempotent (delete-by-key + recreate), demo users/projects/tasks/comments/activity;
  password from SEED_DEMO_PASSWORD (never hardcoded). `prisma db seed` runnable once DB is up.
- [x] P2-T4 NextAuth — Credentials + conditional Google provider, JWT strategy, Prisma adapter,
  register route, login/register pages (RHF + Zod), middleware protecting /dashboard + /projects;
  session.user.id augmented in types.
- [x] P2-T5 API foundation — `lib/api.ts` (requireSession/requireProjectMember, envelopes,
  handleApiError mapping Zod/Prisma errors), `lib/validations/{auth,project,task,comment}.ts`,
  `docs/api.http` smoke collection (401/403/404/409/422 paths included).
- [x] P2-T6 Projects + members API — list w/ progress, create (OWNER membership + activity),
  detail w/ stats, owner-guarded update/archive/delete, add-by-email (404/409 handled),
  remove with last-owner protection (409).
- [x] P2-T7 Tasks/comments/reorder/activity/dashboard API — filtered task list, create w/ position
  baseline + assignee-member check, PATCH w/ status-transition activities + completedAt handling,
  creator-or-owner delete, transactional reorder w/ cross-project guard, comments CRUD per rules,
  cursor-paginated activity feed, dashboard stats. All routes compiled (13 dynamic endpoints).

## Session Log

- 2026-09-11 — P1-T1 complete: fresh repo scoped to project root, security baseline verified.
- 2026-09-11 — P1-T2 complete: Next.js 14.2 + React 18.3 + TS 5.9 installed via pnpm; build verified.
- 2026-09-11 — P1-T6 complete. Documented micro-deviations: `lib/prisma.ts` placeholder deferred to
  P2-T1 (Prisma installs then); `instrumentation.ts` + `experimental.instrumentationHook` added as the
  boot-time env validation hook.
- 2026-09-11 — Phase 2 code complete WITHOUT running Docker (user request: "don't run Docker Desktop,
  just write the code"). Pending DB-dependent steps: `docker compose up -d` → `pnpm db:migrate` →
  `pnpm db:seed`. Prisma pinned to 5.22.0 stable (v8 RC on the registry rejected). ESLint: disabled
  `import/no-named-as-default` (next-auth providers are default exports) and `alphabetize`
  (unstable against grouped path conventions).

- 2026-09-11 — Phase 1 documentation generated (`prd.md`, `trd.md`, `architecture.md`, `design.md`,
  `schema.md`, `implementation.md`, `todo.md`, `rules.md`, `.gitignore`, `.env.example`, `SECURITY.md`).
  Awaiting user approval at the Phase 1 confirmation gate.

- 2026-09-11 — Split-deployment refactor complete. Auth model: `POST /api/auth/login` + token-bearing
  `/api/register` + `/api/auth/me`; Google OAuth moved to the API tier (`/api/auth/google[/callback]`,
  id_token verified against Google JWKS, state cookie CSRF guard, redirect to web `/auth/callback#token`).
  `requireSession()` now verifies `Authorization: Bearer` via `next/headers`; `middleware.ts` repurposed
  as CORS gate (`FRONTEND_URL` origin, preflight 204); `/api/health` added for the Render probe.
  Frontend: `AuthProvider` (localStorage token + /me hydration + 401 auto-logout), client-side route
  guards in `(app)` and `(auth)` layouts, project layout de-servered (API-enforced membership, 403 UI),
  next-auth + prisma-adapter removed, `jose` added. Env became role-aware (`APP_ROLE=api|web`) so the
  web tier holds no DB credentials; local `.env` regenerated (gitignored, verified). ESLint: two
  sanctioned `process.env` exceptions documented in rules.md (`lib/http.ts` NEXT_PUBLIC var,
  `middleware.ts` Edge origin). Gates: lint 0 warnings, typecheck 0 errors, build 19 routes green.

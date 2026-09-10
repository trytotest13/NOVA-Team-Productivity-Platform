# NOVA — Implementation Roadmap

> Execution order for Phase 2 (build). Task IDs (`P<phase>-T<task>`) are referenced by `todo.md`.
> Work **one task at a time**: state the ID → build → verify acceptance criteria → update `todo.md` → commit.
> If any deviation from the docs is needed: STOP, explain the tradeoff, get approval, update docs first.

---

## Phase 1 — Project Setup & Tooling

### P1-T1 — Git init + security baseline
- `git init` at project root; write `.gitignore` + `.env.example` (already generated in Phase 1 docs).
- **Note:** a parent-directory repo exists (`C:\Users\ankit`); the fresh repo inside the project root
  takes precedence for all work done here — never add/commit in the parent repo.
- Run `git status` and verify **no** `.env` or secret file is tracked; create `.env` locally from the example.
- Optional but recommended: install `gitleaks` pre-commit hook (see SECURITY.md).
- **AC:** `git status` clean of secrets; initial commit `chore: project docs and security baseline` contains docs + `.gitignore` + `.env.example` only.

### P1-T2 — Scaffold Next.js
- Create Next.js 14 (App Router, TypeScript, ESLint, `src/`, import alias `@/*`) **in place**, keeping the docs.
- **AC:** `pnpm dev` serves the starter at localhost:3000; `git status` shows only intended files.

### P1-T3 — Formatting + lint gates
- Prettier (config per rules.md), ESLint `next/core-web-vitals` + rules.md additions; scripts:
  `dev`, `build`, `lint`, `typecheck`, `format`.
- **AC:** `pnpm lint && pnpm typecheck && pnpm build` all pass.

### P1-T4 — Design tokens
- Implement design.md in `tailwind.config.ts` + `globals.css` (colors, typography, spacing, radii,
  shadows via CSS variables); Inter via `next/font`.
- **AC:** starter page restyled with tokens only; zero raw hex values outside config.

### P1-T5 — UI primitives
- Build `components/ui/*` from design.md §6: button, input, textarea, select, card, badge, dialog,
  dropdown-menu, avatar, skeleton, spinner, toast, empty-state, error-state.
- **AC:** each primitive typed, accessible (labels/focus states), and matches tokens; story-like
  demo route (`/styleguide`, dev-only) renders all states.

### P1-T6 — Env validation + core lib
- `lib/env.ts` (Zod, fail-fast), `lib/utils.ts` (`cn`), `lib/prisma.ts` placeholder, ESLint ban on
  raw `process.env` outside `lib/env.ts`.
- **AC:** removing a var from `.env` crashes dev server with a clear message; lint enforces the ban.

## Phase 2 — Database, Auth & API Layer

### P2-T1 — Local database
- `docker-compose.yml` (postgres:16) + local `.env` `DATABASE_URL`; Prisma init.
- **AC:** `docker compose up -d` + `prisma migrate dev` succeed against local DB.

### P2-T2 — Prisma schema + migrations
- Implement schema.md in `schema.prisma`; create migration.
- **AC:** schema matches schema.md (enums, FKs, cascades, indexes); `prisma migrate dev` clean; `prisma studio` shows tables.

### P2-T3 — Seed
- `prisma/seed.ts` per schema.md §6 (idempotent upserts, demo password from env).
- **AC:** `prisma db seed` twice without duplicates; demo dataset matches spec.

### P2-T4 — NextAuth
- Credentials + Google providers, JWT strategy, Prisma adapter, session callbacks, register route,
  login/register pages (forms per design.md), `middleware.ts` route protection.
- **AC:** register → login → logout works; anonymous `/dashboard` redirects to `/login`; Google
  OAuth works locally; session contains `user.id`.

### P2-T5 — API foundation
- `lib/api.ts`: `requireSession`, `requireProjectMember`, `handleApiError`, success/error envelopes;
  `lib/validations/*` Zod schemas; `docs/api.http` smoke collection started.
- **AC:** a probe endpoint returns 401/403/200 correctly; errors never leak internals.

### P2-T6 — Projects + members API
- Endpoints per trd.md §4 (projects CRUD, members add/remove) with activity logging.
- **AC:** all project endpoints verified via api.http incl. 401/403/404/422 paths; non-members get 403.

### P2-T7 — Tasks + comments + activity + reorder API
- Task CRUD, `reorder` (transactional, §4 of schema.md), comments CRUD, activity feed, dashboard stats.
- **AC:** every endpoint verified incl. validation failures; reorder persists board order; activity rows written in same transaction.

## Phase 3 — Core Features

### P3-T1 — App shell
- `(app)/layout` (session gate), sidebar, topbar, user menu (logout).
- **AC:** gated routes render shell; nav active states per tokens; keyboard-navigable.

### P3-T2 — Projects list + create
- Cards with progress %, member avatars, color dot; create dialog (name/description/color/dueDate).
- **AC:** create → appears instantly (cache update); loading skeleton; empty state with CTA; Zod client validation errors inline.

### P3-T3 — Project detail + settings
- Header (name, color, due, members), tabs (Board/List/Activity/Settings); settings: edit fields,
  archive/unarchive, delete (confirm dialog), MemberManager (add by email, remove, role display).
- **AC:** owner-only controls hidden/disabled for members; server enforces roles (403 handled in UI).

### P3-T4 — Kanban board
- 4 columns, `@dnd-kit` drag between/within columns, optimistic updates + rollback, task card per
  design.md, "Move to…" menu as keyboard/AT path, quick-add per column.
- **AC:** DnD persists after refresh; failure rolls back + toasts; keyboard path completes a move; all three async states handled.

### P3-T5 — Task list + filters
- Table (status, priority, assignee, due), filters (assignee/priority/status/search) in URL params.
- **AC:** filters shareable via URL; empty-results state; overdue highlighting.

### P3-T6 — Task drawer + comments
- Drawer (edit all fields, assignee select of members, due date, delete per rules), comment thread
  (add/delete per rules).
- **AC:** edits reflect in board+list via cache invalidation; comment add/delete optimistic; a11y focus trap + Esc.

### P3-T7 — Activity feed
- Human-readable feed from `metadata` (no dead joins), relative timestamps, pagination.
- **AC:** all 9 event types render correctly; shows actor avatar + time.

### P3-T8 — Dashboard
- Stat cards (open, overdue, completed this week, active projects), My Tasks list (due-sorted,
  click → task drawer), per-project progress bars.
- **AC:** numbers match seeded data; overdue task click-through works; empty state for new users.

## Phase 4 — Polish, Accessibility & Deployment

### P4-T1 — Global states & errors
- `loading.tsx`/`error.tsx`/`not-found.tsx` everywhere, toast system wired to all mutations, 403
  fallback UI ("You don't have access"), boundary component.
- **AC:** forcing each error path shows designed state, never a blank screen.

### P4-T2 — Accessibility pass
- Keyboard-only walkthrough (register → dashboard → create project → move task → comment), focus
  management in dialogs/drawer, `aria-*` audit, contrast audit (≥ 4.5:1), `prefers-reduced-motion`.
- **AC:** axe DevTools: 0 critical violations on dashboard/board.

### P4-T3 — Responsive QA
- 360 / 768 / 1280 widths: board scrolls horizontally, drawer becomes sheet on mobile, sidebar →
  hamburger on `<md`.
- **AC:** no horizontal page scroll on any non-board page at 360px; touch targets ≥ 40px.

### P4-T4 — Performance pass
- Lighthouse ≥ 90 perf & a11y on dashboard; image/dynamic import hygiene; Query stale times tuned.
- **AC:** Lighthouse report saved to `docs/`.

### P4-T5 — Security pass
- `git log -p` secret scan, `gitleaks` run, dependency audit (`pnpm audit`), middleware coverage
  check, header review (Vercel defaults), confirm error messages leak nothing.
- **AC:** SECURITY.md checklist fully ticked; no findings outstanding.

### P4-T6 — Deployment (split: API on Render, Web on Vercel)
- **API (Render):** create Postgres (or reuse Neon) → Render web service from the repo
  (build `pnpm install && pnpm build`, start `pnpm start`, health check `/api/health`) → set
  `APP_ROLE=api`, `DATABASE_URL`, `AUTH_JWT_SECRET`, `FRONTEND_URL`, Google creds → `pnpm db:deploy` → seed.
- **Web (Vercel):** import repo → set `APP_ROLE=web` + `NEXT_PUBLIC_API_URL=https://<render-app>.onrender.com`.
- **Google OAuth:** register redirect URI `https://<render-app>.onrender.com/api/auth/google/callback`.
- **AC:** Vercel URL loads; login + full board flow work cross-origin (CORS verified);
  direct unauthenticated API probes return 401 + correct CORS headers.

### P4-T7 — Final QA + README
- README: overview, screenshots, stack rationale, local setup, demo account, feature→rubric mapping,
  known limitations (out-of-scope list). Fresh-clone walkthrough test. Demo script for reviewers.
- **AC:** fresh `git clone` → `.env` → `pnpm i && docker compose up && pnpm db:setup && pnpm dev`
  works with no undocumented steps.

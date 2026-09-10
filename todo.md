# NOVA — Live Task Tracker

> **AI instruction (always applies):** after completing every task, update this file *without being
> asked* — move the finished task to `[x] Done`, set the next task to `[/] In Progress`, and add a
> one-line note (files touched / verification result) under **Session Log**. Re-read the relevant
> docs (`prd.md`, `trd.md`, `architecture.md`, `schema.md`, `design.md`, `rules.md`) before each task.
> Task definitions & acceptance criteria live in `implementation.md`.

Legend: `[ ]` Todo · `[/]` In Progress · `[x]` Done

---

## Todo

### Phase 1 — Setup & Tooling
- [ ] P1-T4 Design tokens in Tailwind config + globals.css + Inter font
- [ ] P1-T5 UI primitives (`components/ui/*`) + dev-only styleguide route
- [ ] P1-T6 Env validation (`lib/env.ts`) + core lib + process.env lint ban

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
- [ ] P4-T1 Global loading/error/not-found + toasts everywhere
- [ ] P4-T2 Accessibility pass (keyboard walkthrough, axe, contrast)
- [ ] P4-T3 Responsive QA (360/768/1280)
- [ ] P4-T4 Performance pass (Lighthouse ≥ 90)
- [ ] P4-T5 Security pass (secret scan, audit, middleware coverage)
- [ ] P4-T6 Deployment (Neon + Vercel, migrations, OAuth prod URIs, prod seed)
- [ ] P4-T7 Final QA + README + demo script

## In Progress

- [/] P1-T3 Prettier + ESLint gates + npm scripts

## Done

- [x] P1-T1 Git init + security baseline — `git init -b main` at project root; `git status`
  verified clean of secrets/env files; parent `C:\Users\ankit` repo untouched (nested repo takes precedence).
- [x] P1-T2 Scaffold Next.js 14 — manual scaffold (create-next-app refuses non-empty dirs):
  package.json + tsconfig (strict + noUncheckedIndexedAccess) + next/postcss/tailwind configs +
  minimal `src/app`; `pnpm build` green (pnpm 11 required `allowBuilds` in pnpm-workspace.yaml for
  unrs-resolver — approved, non-interactive).

## Session Log

- 2026-09-11 — P1-T1 complete: fresh repo scoped to project root, security baseline verified.
- 2026-09-11 — P1-T2 complete: Next.js 14.2 + React 18.3 + TS 5.9 installed via pnpm; build verified.

- 2026-09-11 — Phase 1 documentation generated (`prd.md`, `trd.md`, `architecture.md`, `design.md`,
  `schema.md`, `implementation.md`, `todo.md`, `rules.md`, `.gitignore`, `.env.example`, `SECURITY.md`).
  Awaiting user approval at the Phase 1 confirmation gate.

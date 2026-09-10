# NOVA — Technical Requirements Document

> Companion to `prd.md`. Defines stack, versions, state management, API strategy, auth, and env config.
> Version numbers are minimum-known-stable majors; **pin exact versions at install time** and record
> them in `package.json` (lockfile committed).

---

## 1. Tech Stack

| Layer | Technology | Version | Why |
|---|---|---|---|
| Framework | **Next.js** (App Router) | 14.2.x | Single codebase covering Frontend + Backend + API; first-class TypeScript; trivial Vercel deploy |
| Language | **TypeScript** (strict) | 5.5.x | End-to-end type safety, required by rules.md |
| UI | **React** | 18.3.x | Next.js 14 pairing |
| Styling | **Tailwind CSS** | 3.4.x | Token-driven styling per design.md; fast iteration |
| Database | **PostgreSQL** | 16 | Relational fit (projects↔members↔tasks); free managed tier via Neon |
| ORM | **Prisma** | 5.x | Typed schema-as-code, migrations, seeded demo data |
| Auth | **Auth.js / NextAuth** | v4 | Credentials + Google OAuth, middleware integration, well-documented for Next 14 |
| API validation | **Zod** | 3.23.x | Schema validation + type inference at API boundaries |
| Server state | **TanStack Query** | v5 | Caching, refetching, optimistic updates, invalidation |
| Client UI state | **Zustand** | v4 | Lightweight store for transient UI (DnD, drawers, modals) |
| Drag & drop | **@dnd-kit/core, @dnd-kit/sortable** | 6.x / 8.x | Accessible, modern DnD for the kanban board |
| Password hashing | **bcryptjs** | 2.4.x | Pure-JS bcrypt (no native build issues on Windows/Vercel) |
| Dates | **date-fns** | 3.x | Tree-shakeable date formatting |
| Icons / utils | **lucide-react**, **clsx**, **tailwind-merge** | latest stable | Icons + class merging |
| Forms | **react-hook-form** + **@hookform/resolvers** | 7.x / 3.x | Accessible forms wired to Zod |
| Tooling | **ESLint** (`next/core-web-vitals`), **Prettier** | 8.x / 3.x | Lint + format gates per rules.md |
| Local DB | **Docker** (postgres:16) or local PostgreSQL | — | `docker-compose.yml` for reproducible local dev |
| Deployment | **Vercel** + **Neon** (managed Postgres) | — | Free-tier, zero-config Next.js deploy |

## 2. State Management — Choice & Rationale

| State kind | Owner | Why |
|---|---|---|
| **Server state** (projects, tasks, comments, activity, stats) | **TanStack Query** — never in component state or Redux-style stores | Needs caching, background refetch, optimistic mutation + rollback, and invalidation; hand-rolling this is the #1 source of stale-UI bugs |
| **Ephemeral UI state** (open drawers/modals, DnD transient ids, board filters) | **Zustand** (`src/stores/`) | Tiny, typed, no provider nesting; transient state must not round-trip the server |
| **URL state** (selected project tab, task filters) | Next.js `useSearchParams` / route params | Shareable, back-button-correct |
| **Auth state** | NextAuth `useSession` / `getServerSession` | Single source of truth, JWT strategy |

**Rule:** a component never `fetch()`es into `useState` — reads go through Query hooks
(`src/hooks/use-*.ts`); writes go through mutation hooks that invalidate the affected query keys.

## 3. API Strategy

- **Style:** REST over Next.js Route Handlers (`src/app/api/**/route.ts`) — an explicit, inspectable
  API layer (the assignment evaluates the API tier explicitly).
- **Envelopes:** success → `200 { "data": ... }`; error → `{ "error": { "code", "message", "details?" } }`.
- **Validation:** every route parses `params`/`query`/`body` with Zod schemas from `src/lib/validations/`.
- **Authorization:** helpers `requireSession()` → `requireProjectMember(projectId)`; every handler calls
  them before touching Prisma. Row-level isolation is app-enforced (no client-side trust).
- **Pagination:** list endpoints accept `?take=&cursor=` (cursor = id); default `take=50`.
- **Error taxonomy:** `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `VALIDATION_ERROR` (422),
  `CONFLICT` (409), `INTERNAL` (500). Central `handleApiError()` maps Prisma/Zod errors safely
  (never leaks internals or SQL).
- **Rate limiting / CORS:** out of scope; same-origin only by default.

## 4. Endpoint Outline

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/register` | — | Create account (name, email, password) |
| \* | `/api/auth/[...nextauth]` | — | NextAuth handlers (login, logout, Google) |
| GET | `/api/projects` | session | List my projects (+ progress, memberCount) |
| POST | `/api/projects` | session | Create project (creator becomes OWNER) |
| GET | `/api/projects/:id` | member | Project detail + stats |
| PATCH | `/api/projects/:id` | owner | Edit / archive project |
| DELETE | `/api/projects/:id` | owner | Delete project (cascade) |
| GET | `/api/projects/:id/members` | member | List members |
| POST | `/api/projects/:id/members` | owner | Add member by email |
| DELETE | `/api/projects/:id/members/:userId` | owner | Remove member (owner protected) |
| GET | `/api/projects/:id/tasks` | member | Tasks (filter: status, assigneeId, priority, q) |
| POST | `/api/projects/:id/tasks` | member | Create task |
| PATCH | `/api/tasks/:id` | member | Update fields / status / order |
| DELETE | `/api/tasks/:id` | creator or owner | Delete task |
| POST | `/api/tasks/:id/reorder` | member | Persist board DnD (status + ordered ids) |
| GET | `/api/tasks/:id/comments` | member | List comments |
| POST | `/api/tasks/:id/comments` | member | Add comment |
| DELETE | `/api/comments/:id` | author or owner | Delete comment |
| GET | `/api/projects/:id/activity` | member | Activity feed (paginated) |
| GET | `/api/me/dashboard` | session | My tasks, overdue, completed-this-week, per-project progress |

## 5. Auth Setup

- **Providers:** `CredentialsProvider` (email + bcrypt password against `User`) and `GoogleProvider`.
- **Session strategy: `jwt`** — mandatory with credentials login (database sessions don't support it).
- **Callbacks:** `jwt` stores `user.id` on sign-in; `session` exposes `session.user.id`.
- **Middleware** (`src/middleware.ts`): unauthenticated users hitting `/dashboard` or `/projects/**`
  → redirect `/login?callbackUrl=…`; authenticated users hitting `/login|/register` → redirect `/dashboard`.
- **Registration:** dedicated route handler creates `User` (bcrypt hash, cost 10) then the client
  signs in via the credentials provider.
- **Google OAuth:** account linking by verified email (NextAuth default); first login creates `User`
  + `Account` rows via the Prisma adapter.

## 6. Environment Variables

All secrets live **only** in `.env` (gitignored). Boot-time validation in `src/lib/env.ts`
(Zod schema; app fails fast with a clear message if a variable is missing).

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Neon in prod) |
| `NEXTAUTH_URL` | Base URL (http://localhost:3000 locally) |
| `NEXTAUTH_SECRET` | JWT signing secret (`openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client id |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `SEED_DEMO_PASSWORD` | Password for the seeded demo account (local/preview only) |

`.env.example` (placeholders only) is committed — see project root. **Never commit real values.**

## 7. Quality Gates

- `pnpm lint` (ESLint), `pnpm typecheck` (`tsc --noEmit`), `pnpm build` — all green before any phase completion.
- Prisma `migrate dev` applies cleanly from scratch; `prisma db seed` produces the demo dataset.
- API smoke collection (REST Client file `docs/api.http`) covers every endpoint incl. 401/403 paths.

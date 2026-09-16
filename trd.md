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
| Auth (API) | **Custom JWT** via `jose` | 5.x | Bearer-token auth — required for the split deployment (cookie sessions cannot cross origins) |
| API validation | **Zod** | 3.23.x | Schema validation + type inference at API boundaries |
| Server state | **TanStack Query** | v5 | Caching, refetching, optimistic updates, invalidation |
| Token storage | `localStorage` + Bearer header | — | Frontend keeps the JWT issued by the API (see section 5) |
| Client UI state | **Zustand** | v4 | Lightweight store for transient UI (DnD, drawers, modals) |
| Drag & drop | **@dnd-kit/core, @dnd-kit/sortable** | 6.x / 8.x | Accessible, modern DnD for the kanban board |
| Password hashing | **bcryptjs** | 2.4.x | Pure-JS bcrypt (no native build issues on Windows/Vercel) |
| Dates | **date-fns** | 3.x | Tree-shakeable date formatting |
| Icons / utils | **lucide-react**, **clsx**, **tailwind-merge** | latest stable | Icons + class merging |
| Forms | **react-hook-form** + **@hookform/resolvers** | 7.x / 3.x | Accessible forms wired to Zod |
| Tooling | **ESLint** (`next/core-web-vitals`), **Prettier** | 8.x / 3.x | Lint + format gates per rules.md |
| Local DB | **Docker** (postgres:16) or local PostgreSQL | — | `docker-compose.yml` for reproducible local dev |
| Deployment | **Frontend: Vercel** - **API: Render** + managed Postgres (Neon or Render) | — | Split topology per assignment requirement (see section 5b) |

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

## 5. Auth Setup (split-deployment)

Cookies cannot be shared across the Vercel/Render origins, so the API uses **stateless JWT Bearer auth**:

- `POST /api/auth/login` - email + password (bcrypt) -> `{ token, user }` (HS256 JWT, `sub` = userId, 7-day expiry, signed with `AUTH_JWT_SECRET`).
- `POST /api/register` - creates the account -> `{ token, user }` (auto sign-in).
- `GET /api/auth/google` -> Google consent redirect (optional; 503 JSON when creds absent).
- `GET /api/auth/google/callback` - code exchange, id_token verified against Google's JWKS (issuer + audience), user upserted + `Account` row, then `302 -> {FRONTEND_URL}/auth/callback#token=...`.
- `GET /api/auth/me` (Bearer) - current profile; used by the frontend `AuthProvider` on boot.
- `GET /api/health` - Render health-check probe.

**API authorization:** `requireSession()` reads the `Authorization: Bearer` header (via `next/headers`), verifies the JWT, and loads the user; `requireProjectMember()` builds on it unchanged. Same app-level membership rules as before (schema.md section 5).

**CORS:** `src/middleware.ts` (API deployment) answers preflights and stamps `Access-Control-Allow-Origin: {FRONTEND_URL}` + `Authorization`/`Content-Type` headers on `/api/**`.

**Frontend session:** `AuthProvider` stores the token in `localStorage`, hydrates the user from `/api/auth/me`, attaches the Bearer header via `lib/http.ts`, and redirects to `/login` on 401. Route guards are client-side (the web tier holds no DB credentials).

## 5b. Deployment Topology

| Tier | Platform | Role | Env vars |
|---|---|---|---|
| Web | **Vercel** | Pages/UI only (API code inert) | `NEXT_PUBLIC_API_URL`, `APP_ROLE=web` |
| API | **Render** (Node service, `pnpm start`, port `$PORT`) | `/api/**`, Prisma, auth, CORS, health check | `DATABASE_URL`, `AUTH_JWT_SECRET`, `FRONTEND_URL`, `GOOGLE_CLIENT_ID/SECRET`, `APP_ROLE=api` |
| DB | Neon (or Render Postgres) | PostgreSQL 16 | `DATABASE_URL` on the API tier |

Config lives in `render.yaml` + `DEPLOYMENT.md`. Local dev stays single-origin (`APP_ROLE=api`, `NEXT_PUBLIC_API_URL=http://localhost:3000`).

## 6. Environment Variables

All secrets live **only** in `.env` (gitignored). Boot-time validation in `src/lib/env.ts`
(Zod, role-aware via `APP_ROLE`: the API role requires DB + JWT secrets, the web role requires nothing secret).

| Variable | Tier | Purpose |
|---|---|---|
| `APP_ROLE` | both | `api` (default) or `web` - selects required vars |
| `DATABASE_URL` | api | PostgreSQL connection string |
| `AUTH_JWT_SECRET` | api | HS256 signing secret for auth tokens (`openssl rand -base64 32`) |
| `FRONTEND_URL` | api | Exact web origin - CORS allow-list + OAuth redirect target |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | api | Google OAuth (optional; flow disabled when absent) |
| `SEED_DEMO_PASSWORD` | local | Password for the seeded demo account |
| `NEXT_PUBLIC_API_URL` | web | Browser-facing base URL of the API (e.g. `https://nova-api.onrender.com`) |

`.env.example` (placeholders only) is committed - see project root. **Never commit real values.**

## 7. Quality Gates

- `pnpm lint` (ESLint), `pnpm typecheck` (`tsc --noEmit`), `pnpm build` — all green before any phase completion.
- Prisma `migrate dev` applies cleanly from scratch; `prisma db seed` produces the demo dataset.
- API smoke collection (REST Client file `docs/api.http`) covers every endpoint incl. 401/403 paths.

# NOVA — Architecture Document

> Companion to `prd.md` + `trd.md`. Directory layout, data flow, component hierarchy, rendering strategy,
> and third-party service boundaries. App lives at the project root (package name `nova`).

---

## 1. Directory Tree

```
nova/  (project root)
├── prd.md · trd.md · architecture.md · design.md · schema.md
├── implementation.md · todo.md · rules.md · SECURITY.md
├── .gitignore · .env.example
├── docker-compose.yml            # local postgres:16
├── docs/
│   ├── api.http                  # REST Client smoke collection
│   └── assignment/               # original assignment PDF
├── prisma/
│   ├── schema.prisma             # source of truth (mirrored in schema.md)
│   └── seed.ts                   # demo dataset
├── public/
└── src/
    ├── middleware.ts             # route protection (session gate)
    ├── app/
    │   ├── layout.tsx            # root layout: fonts, providers
    │   ├── page.tsx              # marketing/landing → CTA login/register
    │   ├── (auth)/
    │   │   ├── login/page.tsx
    │   │   └── register/page.tsx
    │   ├── (app)/                # session-gated shell (sidebar layout)
    │   │   ├── layout.tsx
    │   │   ├── dashboard/page.tsx
    │   │   └── projects/
    │   │       ├── page.tsx                    # project list
    │   │       └── [projectId]/
    │   │           ├── layout.tsx              # project header + tabs
    │   │           ├── board/page.tsx          # kanban
    │   │           ├── list/page.tsx           # task table + filters
    │   │           ├── activity/page.tsx       # feed
    │   │           └── settings/page.tsx       # edit/archive + members
    │   └── api/                  # route handlers (see trd.md §4)
    │       ├── register/route.ts
    │       ├── auth/[...nextauth]/route.ts
    │       ├── me/dashboard/route.ts
    │       ├── projects/route.ts
    │       ├── projects/[projectId]/
    │       │   ├── route.ts · members/route.ts
    │       │   ├── members/[userId]/route.ts
    │       │   ├── tasks/route.ts · activity/route.ts
    │       ├── tasks/[taskId]/route.ts
    │       ├── tasks/[taskId]/reorder/route.ts
    │       ├── tasks/[taskId]/comments/route.ts
    │       └── comments/[commentId]/route.ts
    ├── components/
    │   ├── ui/                   # design-system primitives (design.md)
    │   │   ├── button.tsx · input.tsx · textarea.tsx · card.tsx · badge.tsx
    │   │   ├── dialog.tsx · dropdown-menu.tsx · avatar.tsx · select.tsx
    │   │   ├── skeleton.tsx · spinner.tsx · toast.tsx
    │   │   └── empty-state.tsx · error-state.tsx
    │   ├── layout/               # app-shell.tsx · sidebar.tsx · topbar.tsx · user-menu.tsx
    │   ├── projects/             # project-card.tsx · create-project-dialog.tsx · member-manager.tsx
    │   ├── tasks/                # task-card.tsx · task-drawer.tsx · task-filters.tsx · comment-thread.tsx
    │   ├── board/                # kanban-board.tsx · column.tsx · draggable-task-card.tsx
    │   └── dashboard/            # stat-card.tsx · my-tasks.tsx · project-progress-list.tsx
    ├── hooks/                    # use-projects.ts · use-tasks.ts · use-comments.ts · use-dashboard.ts (TanStack Query)
    ├── stores/                   # board-ui.store.ts (Zustand: drawer, DnD transient)
    ├── lib/
    │   ├── env.ts                # Zod-validated process.env (fail-fast)
    │   ├── prisma.ts             # PrismaClient singleton
    │   ├── auth.ts               # NextAuth options
    │   ├── api.ts                # guards (requireSession/requireProjectMember) + handleApiError + envelopes
    │   ├── activity.ts           # activity-log helper
    │   ├── validations/          # zod schemas: auth.ts · project.ts · task.ts · comment.ts
    │   └── utils.ts              # cn() etc.
    └── types/                    # shared TS types (api envelope, domain)
```

## 2. Data Flow

```
                    ┌──────────────────────── Server (Next.js) ────────────────────────┐
 Browser            │                                                                  │
 ────────────       │   ┌────────────┐    Zod validate    ┌──────────┐    typed SQL     │
 │ Client UI  │──1──▶   │ Route      │─────────2────────▶ │ Guards + │──────4────────▶  │
 │ (React)    │◀─5───   │ Handler    │                    │ API lib  │          ┌────┐  │
 └────────────┘         │ /api/**    │◀────3──────────────│ (auth,   │          │PG  │  │
       ▲                └────────────┘   error envelope   │ member)  │◀─read────┘────┘  │
       │                        ▲                         └──────────┘                  │
       │6 optimistic            │                                       Prisma ────────┘
       │ update                 │                                       migrations/seed
 ┌────────────┐          ┌──────────────┐
 │ TanStack   │          │ Server       │   Read path for first paint (RSC):
 │ Query      │          │ Components   │   (app)/layout + dashboard + project pages call
 │ cache      │          │ (Prisma      │   lib/query-*.ts → Prisma directly (no HTTP hop)
 └────────────┘          │  direct)     │   Mutations + client refreshes always use /api/**.
                         └──────────────┘
```

**Mutation flow (canonical):** UI event → mutation hook → optimistic cache update (Zustand tracks
transient DnD) → `fetch(/api/...)` → Zod parse → `requireSession()`/`requireProjectMember()` →
Prisma write (+ activity log in the same transaction) → response → TanStack Query invalidates
affected keys → authoritative re-render. On API failure the optimistic update rolls back and a toast
shows the typed error.

## 3. Component Hierarchy

```
RootLayout (fonts, QueryClientProvider, SessionProvider, Toaster)
├── (auth)/login | register → AuthForm
└── (app)/layout → AppShell
    ├── Sidebar (nav: Dashboard, Projects; UserMenu)
    ├── Topbar (breadcrumbs, quick actions)
    └── page content
        ├── DashboardPage → StatCard×4 · MyTasks · ProjectProgressList
        ├── ProjectsPage → ProjectCard[] · CreateProjectDialog
        └── ProjectLayout (header, tabs, MemberAvatars)
            ├── BoardPage → KanbanBoard → Column×4 → DraggableTaskCard[] → TaskDrawer
            │                                              └── CommentThread (in drawer)
            ├── ListPage → TaskFilters → TaskTable → TaskDrawer
            ├── ActivityPage → ActivityFeed
            └── SettingsPage → ProjectSettingsForm · MemberManager
```

`TaskDrawer` (task detail + comments + edit) is shared by board and list views — single source of
task UX. UI primitives in `components/ui/` are the only place raw colors/radii/shadows appear.

## 4. Rendering Strategy

| Route | Strategy | Rationale |
|---|---|---|
| `/` landing | Static | Zero data |
| `/login`, `/register` | Client | Forms, OAuth buttons |
| `(app)/layout` | **RSC** (`getServerSession`) | Auth gate + shell before paint |
| `/dashboard` | RSC initial (lib/query-*) + client refetch | Fast first paint of stats |
| `/projects` | RSC initial + client mutations | Same |
| `/projects/[id]/board` | Client (TanStack Query) | DnD + optimistic updates need full client control |
| `/projects/[id]/list` | Client (query params as filters) | Filter-driven refetching |
| `/projects/[id]/activity`, `/settings` | RSC + client mutations | Mostly reads |
| `/api/**` | Route Handlers | Explicit API tier (assignment requirement) |

Streaming: `loading.tsx` per route segment with skeleton UI. Client pages render skeletons via
TanStack Query `isPending`.

## 5. Third-Party Service Boundaries

| Service | Boundary | Failure mode |
|---|---|---|
| **Neon Postgres** (prod) | Only reachable via Prisma from server code; connection string only in env | API returns `INTERNAL` envelope; UI shows retry state |
| **Google OAuth** | Only inside NextAuth provider config | Login page shows "Google sign-in failed — try email" |
| **Vercel** | Build + host; secrets configured in Vercel dashboard, never in repo | — |
| No other third parties | No analytics/trackers for this assignment | — |

## 6. Cross-Cutting Concerns

- **Error model:** one envelope, one mapper (`lib/api.ts`), page-level `error.tsx` + `not-found.tsx`.
- **Logging:** server-side `console.error` with route + error code (no PII, no secrets).
- **Audit trail:** `Activity` rows written in the same Prisma transaction as the triggering mutation.
- **Accessibility:** dnd-kit keyboard sensor + a "Move to…" menu on each card as the non-pointer path.

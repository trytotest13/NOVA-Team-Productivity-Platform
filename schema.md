# NOVA — Database Schema Document

> PostgreSQL 16 via Prisma ORM. `prisma/schema.prisma` is the executable source of truth; this
> document is the reviewed spec. Auth tables follow the NextAuth v4 Prisma adapter convention.

---

## 1. Entity-Relationship Overview

```
User 1──* Account, Session            (NextAuth)
User 1──* Project        (owner)
User 1──* ProjectMember  ◀──* Project   (membership, unique per pair)
Project 1──* Task ──* Comment ──* User (author)
Task *──1 User (assignee, nullable)
Project 1──* Activity (actor = User; optional task ref)
```

## 2. Tables

### User
| Column | Type | Constraints |
|---|---|---|
| `id` | String (cuid) | **PK** |
| `name` | String? | — |
| `email` | String | **UNIQUE** |
| `emailVerified` | DateTime? | — |
| `image` | String? | Avatar URL (OAuth) |
| `passwordHash` | String? | Null for OAuth-only accounts; bcrypt |
| `createdAt` / `updatedAt` | DateTime | Defaults `now()` / autoupdate |

### Account / Session / VerificationToken — NextAuth standard shapes
- `Account(id PK, userId FK→User CASCADE, type, provider, providerAccountId, …)` —
  UNIQUE(`provider`,`providerAccountId`), INDEX `userId`
- `Session(id PK, sessionToken UNIQUE, userId FK→User CASCADE, expires)` — INDEX `userId`
- `VerificationToken(identifier, token UNIQUE, expires)` — PK(`identifier`,`token`)

### Project
| Column | Type | Constraints |
|---|---|---|
| `id` | String (cuid) | **PK** |
| `name` | String | required, 1–80 chars |
| `description` | String? | ≤ 500 chars |
| `color` | String | default `#4F46E5`; must be one of the 8 fixed tokens (design.md §1) |
| `status` | Enum `ProjectStatus` (`ACTIVE`, `ARCHIVED`) | default `ACTIVE` |
| `dueDate` | DateTime? | — |
| `ownerId` | String | FK→User `RESTRICT` (owner deletion blocked while owning projects) |
| `createdAt` / `updatedAt` | DateTime | defaults |

Indexes: `INDEX ownerId`; `INDEX (status, updatedAt desc)` for the list query.

### ProjectMember (join table)
| Column | Type | Constraints |
|---|---|---|
| `id` | String (cuid) | **PK** |
| `projectId` | String | FK→Project `CASCADE`, **UNIQUE with userId** |
| `userId` | String | FK→User `CASCADE` |
| `role` | Enum `MemberRole` (`OWNER`, `MEMBER`) | default `MEMBER` |
| `joinedAt` | DateTime | default `now()` |

Indexes: `UNIQUE (projectId, userId)`; `INDEX userId` ("my projects" lookup).

### Task
| Column | Type | Constraints |
|---|---|---|
| `id` | String (cuid) | **PK** |
| `projectId` | String | FK→Project `CASCADE` |
| `title` | String | 1–140 chars |
| `description` | String? | ≤ 2000 chars |
| `status` | Enum `TaskStatus` (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`) | default `TODO` |
| `priority` | Enum `TaskPriority` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) | default `MEDIUM` |
| `position` | Int | ordering within column (see §4) |
| `assigneeId` | String? | FK→User `SET NULL`; **must be a project member (app-enforced)** |
| `creatorId` | String | FK→User `RESTRICT` |
| `dueDate` | DateTime? | — |
| `completedAt` | DateTime? | Set when status → `DONE`; cleared otherwise |
| `createdAt` / `updatedAt` | DateTime | defaults |

Indexes: `INDEX (projectId, status, position)` — the board query; `INDEX assigneeId`; `INDEX dueDate`.

### Comment
| Column | Type | Constraints |
|---|---|---|
| `id` | String (cuid) | **PK** |
| `taskId` | String | FK→Task `CASCADE` |
| `authorId` | String | FK→User `RESTRICT` |
| `body` | String | 1–2000 chars |
| `createdAt` / `updatedAt` | DateTime | defaults |

Index: `INDEX (taskId, createdAt)` — thread ordering.

### Activity
| Column | Type | Constraints |
|---|---|---|
| `id` | String (cuid) | **PK** |
| `projectId` | String | FK→Project `CASCADE`, INDEX `(projectId, createdAt desc)` |
| `taskId` | String? | FK→Task `SET NULL` (feed survives task deletion) |
| `actorId` | String | FK→User `RESTRICT` |
| `type` | Enum `ActivityType` — `PROJECT_CREATED`, `MEMBER_ADDED`, `MEMBER_REMOVED`, `TASK_CREATED`, `TASK_MOVED`, `TASK_ASSIGNED`, `TASK_COMPLETED`, `TASK_DELETED`, `COMMENT_ADDED` | |
| `metadata` | Json | e.g. `{"from":"TODO","to":"DONE","taskTitle":"…"}` — feed must render without joins to deleted rows |

## 3. Enums (Prisma)

```prisma
enum ProjectStatus { ACTIVE ARCHIVED }
enum MemberRole    { OWNER MEMBER }
enum TaskStatus    { TODO IN_PROGRESS IN_REVIEW DONE }
enum TaskPriority  { LOW MEDIUM HIGH URGENT }
enum ActivityType  { PROJECT_CREATED MEMBER_ADDED MEMBER_REMOVED TASK_CREATED TASK_MOVED
                     TASK_ASSIGNED TASK_COMPLETED TASK_DELETED COMMENT_ADDED }
```

## 4. Ordering & Concurrency (board DnD)

`position` is an integer per `(projectId, status)` column. Reorder endpoint receives the full
ordered id list for one column and rewrites positions **in a transaction** with a gap-500 baseline
(`500, 1000, …`); inserts place a task between neighbors by averaging with `position` rebalance when
the gap collapses. Last-write-wins is acceptable for this scope; the reorder payload includes an
`updatedAt` guard to reject stale overwrites (409 `CONFLICT`).

## 5. Security Policies (app-enforced)

No database-level RLS (single app role via Prisma). Isolation is enforced in the API layer and
verified by tests:

1. **Session first:** every handler calls `requireSession()` → 401 if absent.
2. **Membership:** every project-scoped read/write passes `requireProjectMember(projectId)`
   → 403 if the session user is not an active member (owner **or** member role).
3. **Role checks:** owner-only mutations (edit/archive/delete project, add/remove member) verify
   `role == OWNER` → 403 otherwise; the sole owner cannot be removed.
4. **Assignee integrity:** setting `assigneeId` validates the user is a project member (422 otherwise).
5. **Cascade hygiene:** deleting a project cascades tasks/comments/members/activity in one
   transaction; comment/task delete checks author-or-owner.
6. **Secrets:** DB credentials only via `DATABASE_URL` env; never logged (Prisma error mapper redacts).

## 6. Seed Data (`prisma/seed.ts`) — idempotent (`upsert`)

- Demo user **Priya (lead)** `demo@nova.app` — password from `SEED_DEMO_PASSWORD` env (documented in
  README; never hardcoded in the repo). Second user **Marcus (member)** `marcus@nova.app`.
- Project **"Website Relaunch"** (active, due +21 days, both users; Priya OWNER) with ~10 tasks
  spread across statuses (2 done, 1 overdue, 1 due soon), comments on 3 tasks.
- Project **"Mobile App MVP"** (active, Marcus-only viewer isolation demo) with 4 tasks.
- Archived project **"Q1 Offsite"** (Priya) to demo archive filtering.
- Activity rows back-filled to match the seeded state (so the feed is never empty).

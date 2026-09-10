# NOVA — Team Productivity Platform — Product Requirements Document

> **Tagline:** Plan. Collaborate. Deliver.
> **Version:** 1.0 · **Status:** Approved for implementation
> **Source:** "Full Stack Development Intern Assignment" — Build a Full-Stack Project Management Application
> **Note:** The provided assignment PDF was truncated (ends at "Frontend Examples: React, Next.js").
> Requirements below are derived from the stated Objective and Suggested Product sections.

---

## 1. Problem Statement

Small teams coordinate work across chat threads, spreadsheets, and sticky notes. Tasks lose owners,
progress is invisible until someone asks, and there is no single place that answers "what are we
doing, who is doing it, and how far along is it?"

NOVA is a project management platform that gives a team one application to **create projects, manage
tasks, collaborate with members, and track project progress**.

This project is also a full-stack engineering exercise: it must demonstrate competence across the
complete application stack — **Frontend → Backend → API → Database → Authentication → Deployment**.

## 2. Target Audience & Personas

| Persona | Role | Goals | Pain today |
|---|---|---|---|
| **Priya — Team Lead** | Creates projects, assigns work, monitors delivery | See project health at a glance; balance workload; keep tasks unblocked | No consolidated view; chases people for status |
| **Marcus — Team Member** | Executes tasks | Know exactly what's mine and what's due; update status in seconds; find context in one place | Task info scattered across chat; duplicate status updates |
| **Dana — Stakeholder** | Occasional reviewer | Check completion % and recent activity without asking anyone | Must interrupt the team for progress |

## 3. Core Functional Requirements

### FR-1 — Authentication & Account
- User can **register** with name, email, and password (min 8 chars); password stored hashed (bcrypt).
- User can **log in** with email + password, and **log out**.
- User can **log in with Google** (OAuth 2.0).
- Session persists across refreshes; protected routes redirect anonymous users to login.
- Authenticated user has a profile (name, email, avatar) shown in the app shell.

### FR-2 — Projects
- Authenticated user can **create** a project (name required; optional description, color, due date).
- Projects list view shows the user's projects (owned + member) with progress indicator and member count.
- Project detail has an **overview** (description, members, due date, progress %) and a **settings** area.
- Owner can **edit** and **archive** a project; archived projects are hidden from the default list.
- Owner can **delete** a project (with confirmation); deletion cascades to its tasks/comments/activity.

### FR-3 — Project Members & Roles
- Project owner can **add members by email** (user must exist; pending-invite flow is out of scope — see §5).
- Project owner can **remove** a member; the last owner cannot be removed or demoted.
- Roles: `OWNER` (full control, manages members) and `MEMBER` (works on tasks, comments).
- **Only project members can view or modify a project and its tasks** (enforced server-side).

### FR-4 — Tasks & Kanban Board
- Members can **create** tasks in a project: title (required), optional description, assignee
  (project member), priority (`LOW|MEDIUM|HIGH|URGENT`), due date.
- Task statuses: `TODO → IN_PROGRESS → IN_REVIEW → DONE`, rendered as kanban columns.
- **Drag-and-drop** moves tasks between columns and reorders within a column (persisted order).
- Members can **edit** all task fields, **reassign**, and **delete** (creator or owner only) tasks.
- Every board operation updates optimistically in the UI and reconciles with the API.

### FR-5 — Task Collaboration (Comments)
- Members can **comment** on any task in their project; comments show author, avatar, timestamp.
- Comment author can **delete** their own comment; project owner can delete any comment.

### FR-6 — Activity Feed
- The system **automatically logs** key events: project created, member added/removed, task created/
  moved/status changed/assigned/completed/deleted, comment added.
- Each project has an **activity tab** (reverse-chronological, human-readable, e.g. "Priya moved
  'Design landing page' from To Do to In Progress").

### FR-7 — Progress Tracking & Dashboard
- **Project progress** = % of tasks `DONE`, shown on project cards and overview.
- **Personal dashboard**: my open tasks (across projects, sorted by due date), overdue count,
  tasks completed this week, and per-project progress list.
- **Project stats**: task counts by status and by priority.

### FR-8 — Authorization & Data Isolation
- All `/dashboard`, `/projects/**` routes require a session (middleware-enforced).
- Every API route verifies the session **and** project membership before reading/writing.
- Users can never see or mutate projects they are not members of (verified by automated checks).

## 4. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-1 | End-to-end **TypeScript strict mode**; zero `any` without a written justification comment. |
| NFR-2 | Every async UI surface explicitly handles **loading, empty, and error** states. |
| NFR-3 | Responsive from **360 px** to desktop; core flows keyboard-accessible; visible focus states; semantic HTML; target WCAG 2.1 AA for core flows. |
| NFR-4 | **Security by default**: secrets only in environment variables (validated at boot); passwords hashed; input validated with Zod at every API boundary; server-side authorization on every route. |
| NFR-5 | API responses use a **consistent JSON envelope** and correct HTTP status codes. |
| NFR-6 | Performance: board interactions feel instant (**optimistic updates < 100 ms perceived**); Lighthouse performance ≥ 90 on dashboard. |
| NFR-7 | **Deployed** to a public URL with a working seeded demo account. |
| NFR-8 | Clean Git history (conventional commits); `git status` must never show tracked secrets. |

## 5. Out of Scope (Explicit Boundaries)

| Excluded | Rationale |
|---|---|
| Real-time multi-user sync (WebSockets) | Polling/refetch on focus is sufficient for the evaluation scope; noted as future work |
| Email invitations / email notifications | Requires SMTP + template infra; add-by-existing-email covers collaboration |
| File attachments on tasks | Storage & scanning overhead not core to the assignment |
| Calendar / Gantt views, time tracking | Nice-to-have; kanban + due dates cover progress needs |
| Billing / subscription tiers | Product is a free internal tool |
| SSO (SAML), org-level workspaces, i18n, mobile apps | Beyond intern-assignment scope |

## 6. Success Criteria (Demo Day)

1. Public deployed URL loads; login with the seeded demo account works.
2. From login, a reviewer can: open a project → drag a task across columns → comment → see activity
   and progress update — in **under 3 minutes**, with zero console errors.
3. A second account confirms data isolation (sees only their projects).
4. README explains setup, stack decisions, and maps features to the assignment rubric.

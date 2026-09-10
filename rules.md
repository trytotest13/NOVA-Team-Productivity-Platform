# NOVA — Coding Rules

> Enforced at every task. Lint/format automate what they can; the rest is review discipline.
> These rules exist so any file in the repo looks like it was written by one careful author.

---

## 1. TypeScript

- `"strict": true` (plus `noUncheckedIndexedAccess`). **No `any`.** If truly unavoidable, justify
  with a comment: `// any: <reason + safer alternative considered>` — and prefer `unknown` + narrowing.
- No non-null assertions (`!`) except in tests; no `as` casts across unrelated types (`as unknown as X` is banned).
- Explicit return types on all exported functions; `interface` for object shapes, `type` for unions/utilities.
- Validate external data (API bodies, env, params) with **Zod** — types inferred, never hand-duplicated.

## 2. Naming

| Thing | Convention | Example |
|---|---|---|
| Components/classes/types/enums | `PascalCase` | `TaskDrawer.tsx`, `MemberRole` |
| Variables/functions/hooks | `camelCase` (hooks prefixed `use`) | `useTasks.ts` |
| Constants/env keys | `SCREAMING_SNAKE_CASE` | `MAX_TASK_TITLE = 140` |
| Files | components `PascalCase.tsx`; lib/hooks/stores `kebab-case.ts`; Next routes: `page.tsx`, `route.ts`, `layout.tsx` | |
| Booleans | `is/has/should` prefix | `isDragging` |
| DB fields | `camelCase` (Prisma convention) | `dueDate`, `passwordHash` |
| Event handlers | `onX` prop / `handleX` impl | `onClose` / `handleClose` |

## 3. Imports (order — ESLint `import/order`, groups separated by blank lines)

1. `react` / `next` built-ins
2. Third-party packages
3. `@/lib/**`, `@/types/**`
4. `@/components/**`, `@/hooks/**`, `@/stores/**`
5. Relative imports (`./`, `../`)

Absolute `@/` alias is mandatory for cross-feature imports — no `../../../` climbing.

## 4. Error Handling

- **API routes:** Zod-parse inputs → `requireSession()`/`requireProjectMember()` → logic inside
  try/catch → all errors through `handleApiError()` (typed envelope, correct status, no internal leakage).
  No route may `NextResponse.json` a raw `Error`.
- **Client:** every mutation has `onError` (toast + optimistic rollback); every list/query surface
  renders **loading (skeleton), empty (empty-state), error (error-state with retry)** — all three or it's not done.
- No silent `catch {}`; if swallowing is intentional, comment why. Never log secrets or full DB errors.
- Promises are `await`ed inside `try/catch` — floating promises are lint errors.

## 5. Design & UX Compliance

- **No ad-hoc colors, spacing, fonts, radii, or shadows.** Use Tailwind tokens from `design.md`;
  raw hex/px in a component = bug. New visual need → update `design.md` first, then code.
- Every interactive element: visible focus ring, disabled state, and loading state where async.
- Destructive actions require a confirm dialog and use the `danger` button style.
- Copy: sentence case, no jargon; errors say what happened + what to do next.

## 6. Banned Patterns

- `console.log` in committed code (`console.error`/`warn` allowed server-side).
- `process.env` outside `lib/env.ts`.
- Default exports **except** Next.js special files (`page/layout/route/error/loading/not-found/middleware`).
- Secrets, tokens, connection strings in code or docs — **any** appearance stops the commit (see §8).
- `useEffect` for data fetching (use TanStack Query); `index` as React `key` on dynamic lists (use entity id).
- New UI dependencies without a documented rationale in `trd.md`; moment.js; CSS-in-JS libraries.
- Comment noise: comments must state a non-obvious constraint, never narrate the obvious.

## 7. Formatting

- Prettier: singleQuote, semi, printWidth 100, trailingComma `all`, 2-space indent — run via
  `pnpm format` (pre-commit).
- Tailwind class order via `prettier-plugin-tailwindcss`; keep `cn()` for conditional classes.
- One component per file (small private helpers co-located are fine); file ≤ ~250 lines → split.

## 8. Sensitive-Data Rules (ALWAYS)

1. **NEVER hardcode** API keys, passwords, tokens, DB URLs, or secrets in code.
2. All secrets live **only** in `.env` (gitignored), accessed via `lib/env.ts` (Zod-validated) —
   never via raw `process.env` elsewhere.
3. Only `.env.example` (placeholders, **no real values**) may be committed.
4. If a secret is ever accidentally committed: **STOP immediately**, tell the user to **rotate the
   key now** — removing it from history alone is not enough (it's already exposed).
5. **Before every commit**, scan staged files for secrets (keys, tokens, connection strings,
   `postgres://`, `sk-`, `AIza`, long base64 literals) and warn the user if anything matches.
   `git status` must never list `.env` or any `*.pem`/`*.key` file.

## 9. Git & Workflow

- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:` — one task ≈ one commit,
  message references the task ID (e.g. `feat(api): task reorder endpoint (P2-T7)`).
- Commit only after: lint + typecheck pass and the feature's acceptance criteria are met.
- `todo.md` is updated in the same commit as its task (or immediately after — never deferred).
- Deviations from docs require doc-first approval (see implementation.md header).

# NOVA — Design System Document

> Single source of truth for all visual decisions. **No ad-hoc colors, spacing, or fonts in code** —
> everything must map to a token below. Tokens are implemented once in `tailwind.config.ts` +
> `globals.css` and consumed via Tailwind classes.

Brand: **NOVA** — Plan. Collaborate. Deliver. Look: modern productivity SaaS — calm, high-contrast,
light-first (dark-mode tokens reserved for future work).

---

## 1. Color Palette

### Brand / Primary — Indigo
| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| `primary-50` | `#EEF2FF` | `indigo-50` | Subtle selected backgrounds |
| `primary-100` | `#E0E7FF` | `indigo-100` | Hover on subtle chips |
| `primary-500` | `#6366F1` | `indigo-500` | Focus rings, active nav dot |
| `primary-600` | `#4F46E5` | `indigo-600` | **Primary buttons, links, active tab** |
| `primary-700` | `#4338CA` | `indigo-700` | Primary button hover |

### Neutrals — Slate
| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| `bg` | `#FFFFFF` | `white` | App background |
| `bg-subtle` | `#F8FAFC` | `slate-50` | Sidebar, page alt background, board column bg |
| `border` | `#E2E8F0` | `slate-200` | Cards, inputs, dividers |
| `border-strong` | `#CBD5E1` | `slate-300` | Input hover border |
| `text-primary` | `#0F172A` | `slate-900` | Headings, primary text |
| `text-secondary` | `#475569` | `slate-600` | Body text |
| `text-muted` | `#94A3B8` | `slate-400` | Placeholders, timestamps, meta |

### Semantic
| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| `success` | `#16A34A` | `green-600` | DONE status, positive deltas |
| `success-bg` | `#F0FDF4` | `green-50` | Success badge bg |
| `warning` | `#D97706` | `amber-600` | Due-soon indicators |
| `warning-bg` | `#FFFBEB` | `amber-50` | Warning badge bg |
| `danger` | `#DC2626` | `red-600` | Destructive actions, overdue |
| `danger-bg` | `#FEF2F2` | `red-50` | Danger badge bg |
| `info` | `#0284C7` | `sky-600` | Info toasts |
| `info-bg` | `#F0F9FF` | `sky-50` | Info badge bg |

### Domain Colors
| Domain | Value | Usage |
|---|---|---|
| Status `TODO` | `slate-500 #64748B` | Column header dot |
| Status `IN_PROGRESS` | `sky-600 #0284C7` | Column header dot |
| Status `IN_REVIEW` | `violet-600 #7C3AED` | Column header dot |
| Status `DONE` | `green-600 #16A34A` | Column header dot |
| Priority `LOW` | `slate-500 #64748B` | Badge |
| Priority `MEDIUM` | `blue-600 #2563EB` | Badge |
| Priority `HIGH` | `orange-600 #EA580C` | Badge |
| Priority `URGENT` | `red-600 #DC2626` | Badge |
| Project colors | `#4F46E5 · #0EA5E9 · #10B981 · #F59E0B · #EF4444 · #8B5CF6 · #EC4899 · #14B8A6` | Project color picker (fixed set) |

**Rule:** sibling UI elements are differentiated by weight/bg — never by introducing new hues.
Contrast: all text pairs ≥ 4.5:1 (verify `text-muted` only on `bg`/`bg-subtle`).

## 2. Typography — Inter (via `next/font/google`)

| Token | Size/Line | Tailwind | Weight | Usage |
|---|---|---|---|---|
| `display` | 30/36 | `text-3xl` | Bold (700) | Page titles |
| `h1` | 24/32 | `text-2xl` | Semibold (600) | Section titles |
| `h2` | 20/28 | `text-xl` | Semibold | Card titles, dialog titles |
| `h3` | 16/24 | `text-base` | Semibold | Sub-sections, column headers |
| `body` | 14/20 | `text-sm` | Regular (400) | Default UI text |
| `body-lg` | 16/24 | `text-base` | Regular | Long-form (descriptions) |
| `small` | 13/18 | `text-[13px]` | Regular | Meta, timestamps |
| `label` | 12/16 | `text-xs` | Medium (500) | Form labels, badges (uppercase + `tracking-wide` where noted) |
| `mono` | 13/18 | `text-sm font-mono` | Regular | IDs in settings only |

Tabular numerals (`tabular-nums`) for stats and progress percentages.

## 3. Spacing Scale — 4 px base

| Token | px | Tailwind | Usage |
|---|---|---|---|
| `space-1` | 4 | `p-1`/`gap-1` | Icon ↔ label nudge |
| `space-2` | 8 | `p-2`/`gap-2` | Inside badges/chips, compact lists |
| `space-3` | 12 | `p-3`/`gap-3` | Card inner padding (dense), board cards |
| `space-4` | 16 | `p-4`/`gap-4` | Card padding, form field gaps |
| `space-6` | 24 | `p-6`/`gap-6` | Section gaps, dialog padding |
| `space-8` | 32 | `p-8`/`gap-8` | Page block separation |
| `space-12` | 48 | `p-12` | Hero/landing sections only |

Page container: `max-w-7xl mx-auto px-4 md:px-6`, `py-8`. Board is full-bleed horizontally with
`px-4` and horizontal scroll on overflow.

## 4. Radii

| Token | px | Tailwind | Usage |
|---|---|---|---|
| `radius-sm` | 6 | `rounded-md` | Badges, inputs |
| `radius-md` | 8 | `rounded-lg` | Buttons, small cards, dropdown items |
| `radius-lg` | 12 | `rounded-xl` | Cards, dialogs, columns |
| `radius-full` | 9999 | `rounded-full` | Avatars, dots, pills |

## 5. Shadows & Focus

| Token | Value | Usage |
|---|---|---|
| `shadow-sm` | Tailwind `shadow-sm` | Inputs at rest |
| `shadow-card` | `0 1px 3px 0 rgb(15 23 42 / 0.08), 0 1px 2px -1px rgb(15 23 42 / 0.06)` | Cards (rest) |
| `shadow-pop` | Tailwind `shadow-lg` | Dialogs, dropdowns, dragging card |
| Focus ring | `ring-2 ring-indigo-500 ring-offset-2` (offset color = surface) | All interactive elements, keyboard-visible |

## 6. Core Component Styles

**Button** — heights: `sm` 32px / `md` 40px / `lg` 44px; padding `px-3/4`; `radius-md`; label `body`
medium; disabled `opacity-50 pointer-events-none`.
- `primary`: `bg-indigo-600 text-white hover:bg-indigo-700`
- `secondary`: `bg-white text-slate-900 border border-slate-200 hover:bg-slate-50`
- `ghost`: `text-slate-600 hover:bg-slate-100`
- `danger`: `bg-red-600 text-white hover:bg-red-700` (confirm dialogs for destructive actions)

**Input / Textarea / Select** — 40px (textarea auto), `radius-sm`, `border-slate-200`,
`bg-white`, label above (`label` token), error text `danger` `small` + `aria-invalid`,
helper text `text-muted`. Focus: `ring-2 ring-indigo-500`.

**Card** — `bg-white border border-slate-200 rounded-xl shadow-card`, `p-4` (dense `p-3`).

**Badge** — pill (`rounded-full`), `label` token, `px-2 py-0.5`; domain colors from §1 (e.g.
priority badge = colored text + matching `-50` bg).

**Dialog** — overlay `bg-slate-900/40`; panel `bg-white rounded-xl shadow-pop p-6 max-w-lg`,
title `h2`, focus-trapped, closes on Esc + overlay click (forms confirm instead of discarding).

**Dropdown menu** — `bg-white rounded-lg shadow-pop border border-slate-200 py-1`, item
`px-3 py-2 text-sm hover:bg-slate-50`; destructive item `text-red-600`.

**Avatar** — `rounded-full bg-indigo-100 text-indigo-700` initials fallback; sizes 24/32/40;
stacked member list overlaps `-space-x-2` with `ring-2 ring-white`.

**Kanban column** — `bg-slate-50 rounded-xl w-72 md:w-80`, header = status dot (§1) + `h3` title +
count + add button; body `p-2 space-y-2`, `min-h-[120px]` drop zone highlights with
`ring-2 ring-indigo-300 bg-indigo-50/40` while dragging.

**Task card** — Card (dense) + title `body` medium, priority badge, due date (`warning` when ≤ 48h,
`danger` when overdue), assignee avatar right, comments count icon; dragging → `shadow-pop rotate-1`.

**Toast** — bottom-right, `radius-md`, semantic border-left 3px, auto-dismiss 5s, `role="status"`.

**Skeleton** — `bg-slate-200/70 rounded-md animate-pulse`, matches final layout shape.

**Empty state** — centered icon (lucide, `text-slate-300` 40px) + `h2` + `body` + primary CTA.
**Error state** — same geometry, `danger` icon, "Retry" secondary button.

## 7. Iconography & Motion

- Icons: **lucide-react**, 16px inline / 20px buttons, `stroke-[1.75]`, never recolor outside tokens.
- Motion: `transition-colors duration-150` on interactive elements; dialog/dropdown 150 ms fade+scale;
  no other animation (respect `prefers-reduced-motion`).

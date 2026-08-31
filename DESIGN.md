# Homestay Green Design System

## Visual thesis

Homestay Green presents a stay as a calm arrival sequence rather than a catalog.
Public surfaces pair real room photography with precise booking controls and
quiet, editorial pacing. Operational surfaces remain denser and inherit only
the shared semantic tokens and control behavior.

## Palette and material

- Canvas is a soft mineral neutral; cards are clean white surfaces.
- Deep slate carries immersive hero and closing regions.
- Blue is reserved for primary navigation and booking actions.
- Green communicates real availability only; amber warning and red error.
- Depth comes from soft offset shadows and image layering, not decorative
  borders or glass effects.

## Typography

- Display copy uses a humanist system display stack with compact tracking,
  strong weight, and short line lengths.
- Interface and body copy use the workhorse sans stack already defined by the
  application.
- Public headings use a clear 64/48/36/28 scale on desktop and 44/36/28/24 on
  mobile; body copy remains 16–18px with generous leading.

## Composition

- The homepage is an arrival path: inspiration, immediate search, verified
  confidence, room choice, experience, visual proof, and decisive close.
- Photography owns large uninterrupted fields. Controls attach to the image or
  decision they affect instead of floating between unrelated sections.
- Public card radii stay between 12–16px. Sections alternate immersive,
  editorial, and decision-dense passages to pace the scroll.

## Controls and state

- Primary controls are blue, 44px minimum height, and name the next action.
- Booking search exposes dates and guests first; optional refinement belongs on
  the search-results surface.
- Loading uses layout-matched skeletons. Error and empty states preserve the
  next useful action.
- Focus is always visible, dynamic result text uses polite announcements, and
  reduced-motion users receive static imagery and transitions.

## Imagery and motion

- Use approved property room images from the Backend wherever possible. If the
  current media is unsuitable, a curated marketing image may be used only with
  a visible illustrative label; never fabricate guest, award, rating, booking,
  room-size, or availability evidence.
- One slow hero image reveal and restrained section entrances form the motion
  signature. Hover zoom and elevation are subtle and disabled for reduced
  motion.
- Images below the first viewport are lazy-loaded and always have meaningful
  alt text or empty alt text when decorative.

---

## Management grammar (v3 — frozen for operational UI)

Management surfaces favor density, hierarchy, and scanability over editorial
pacing. These rules are the reference for every management screen; two
reference implementations (Dashboard 4A, Payments 4B) demonstrate them.

### Layout

- Workspace container: `max-w-management` (110rem) centered with the standard
  page gutters. Public surfaces keep `max-w-app` (80rem).
- Page rhythm: `page-stack` (`gap-6`), `section-stack` (`gap-4`).
- Audit on touch; editorial display text remains public-only.

### Typography roles

| Role | Spec | Usage |
|---|---|---|
| `page-title` | `text-2xl sm:text-3xl font-bold tracking-tight text-ink` | `PageHeader.title` — once per page |
| `section-title` | `text-lg font-bold text-ink` | Card and section headings |
| `kpi` | `text-3xl font-bold tracking-tight tabular-nums` with semantic color | Hero dashboard metrics |
| `kpi-label` | `text-sm font-semibold text-muted` | KPI labels and sub-notes |
| `body` | `text-sm text-ink leading-6` | Default copy |
| `label` | `text-sm font-semibold text-ink` | Form labels, table header cells |
| `meta` | `text-xs text-muted` | Timestamps, ids, helper lines |
| `eyebrow` | `text-xs font-bold uppercase tracking-eyebrow text-brand` | Category tags in `PageHeader` |
| `link-inline` | `text-sm font-semibold text-brand-strong hover:underline` | Inline links |

Weight policy: `font-black` is reserved for the brand wordmark. Management
copy tops out at `font-bold`; `font-semibold` for labels and CTA text; do not
use `font-medium` as a substitute for hierarchy.

### Surfaces and elevation

- Border first, elevation second. `Card` = `rounded-panel border-line bg-surface
  shadow-card` (elev-2).
- Filter bars are surface cards with `p-4`, not bare forms.
- Table wrapper = `Card` with `p-0 overflow-hidden` and its own
  `overflow-x-auto` scroller.
- Drawer/overlay = elev-3; dialogs = elev-4; sticky header stays elev-1.
- Shadow aliases (`shadow-sm/md/lg`) remain synonyms of elevation levels but
  new screens use `shadow-elevation-*` names.

### Status and feedback colors

- `neutral`: informational/static; `info`: active/in-progress;
  `success`: completed/healthy; `warning`: needs attention/SLA risk;
  `danger`: failure, invalid state, destructive, or immediate intervention.
- `REFUND_PENDING` stale past SLA is `warning`, not `danger`.
- Badge tones follow the same mapping; `violet` is not a management tone.

### Action hierarchy

- Maximum one primary action per surface or row; secondary actions are
  outline; tertiary actions are text/ghost.
- Every destructive or financial action uses `variant="danger"` and a
  `ConfirmationDialog tone="danger"`. Never ghost destructive actions.
- Decisions:
  - Rooms uses dedicated routes for create/edit/images.
  - Payments list is scan-first (six columns); technical metadata lives at
    `/management/payments/:id`.

### Tables and density

- Header `bg-surface-muted text-xs uppercase tracking-wide text-muted`,
  cells `px-4 py-3`, rows `hover:bg-surface-muted align-top`, wrapper
  `overflow-x-auto` inside a `Card`.
- Ten to twelve rows per page; monospaced/tabular-nums for amounts and ids.

### Responsive management rules

- Mobile (<lg) renders stacked task-prioritized cards; do not mirror desktop
  columns 1:1.
- Desktop (≥lg) renders tables. `TableCards` remain feature-local until two
  features share one card grammar.
- Filter bars stack on mobile and become `flex items-end gap-3` from `sm`.

### State and accessibility

- Every interactive primitive covers default/hover/active/focus-visible/
  selected/disabled/loading states.
- Skeletons are layout-matched and `aria-hidden`; live regions remain polite
  for async results.

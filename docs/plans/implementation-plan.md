# HBMS Frontend Implementation Plan

## Context

This plan is based on the verified repository discovery in:

- `docs/analysis/current-state.md`
- `docs/analysis/business-rules.md`
- `docs/analysis/open-questions.md`
- `docs/analysis/risks-and-technical-debt.md`
- `docs/architecture/system-overview.md`

The working tree already contains uncommitted changes from previously approved frontend waves. No task below assumes a clean baseline; every task must compare test signatures against the recorded baseline debt.

## Scope

### In scope

- Preserve and verify the three frontend surfaces: CUSTOMER, STAFF and ADMIN/MANAGEMENT.
- Harden unified login and workspace-aware post-login routing.
- Complete management shell consistency where approved.
- Validate Dashboard reference implementation through visual/semantic QA.
- Implement Payments reference screen only after Dashboard reference approval.
- Migrate Rooms, Users/Customers and Bookings incrementally after reference screens are accepted.
- Keep generated API contract synchronized with Backend OpenAPI.

### Out of scope

- Backend schema or endpoint changes unless separately approved.
- New payment business rules.
- New RBAC/permission model.
- Replacing customer/staff/admin application surfaces with one UI.
- Blind global codemods or speculative design-system abstractions.
- Repairing the three baseline test failures unless a future task directly touches their feature and changes their failure signature.

## Assumptions

- Backend remains the source of truth for auth, authorization, booking, payment, pricing and availability.
- Existing route guards remain security boundaries.
- Runtime visual QA may use controlled fixtures when live backend data is unavailable, but reports must distinguish fixture evidence from live evidence.

## Quality gates for every implementation task

1. Focused tests for the changed behavior.
2. `npm run typecheck`.
3. `npm run lint` with accepted FilterBar warnings documented.
4. `npm run test` and comparison to the three baseline failures.
5. `npm run build` when applicable.
6. `npm run architecture:check`.
7. Review `git diff` and update `docs/progress.md`.

---

## TASK-001: Freeze and verify authentication/workspace policy

### Objective

Ensure one login entry point routes deterministically to the correct CUSTOMER, STAFF or ADMIN workspace without weakening authorization.

### Scope

- Verify generated auth contract and principal normalization.
- Keep `/login` canonical and legacy login compatibility only where needed.
- Validate workspace-specific `returnTo` policy.
- Test session switching and `/auth/me` restoration.

### Out of scope

- Backend unified login endpoint.
- Permission changes.
- UI redesign beyond neutral login entry.

### Files likely to change

- `src/auth/api.ts`
- `src/auth/AuthProvider.tsx`
- `src/auth/components/LoginForm.tsx`
- `src/routes/workspace-policy.ts`
- `src/routes/AuthRouteAdapters.tsx`
- `src/routes/router.tsx`
- `src/auth/**/*.test.*`
- `src/routes/*test.*`

### Dependencies

Discovery complete; Backend OpenAPI snapshot available.

### Acceptance criteria

- CUSTOMER defaults to `/bookings`.
- STAFF defaults to `/staff/counter`.
- ADMIN defaults to `/management/dashboard`.
- Cross-workspace returnTo never changes post-login workspace.
- RouteGuard behavior remains unchanged.
- Fresh login, logout/login switch and `/auth/me` restore preserve role.

### Test strategy

Unit tests for policy; API normalization tests; AuthProvider session tests; route adapter tests; authorization direct-URL tests.

### Risks

Backend may return a role different from the expected fixture. Stop and report backend/data issue rather than mapping it in frontend.

### Definition of Done

Focused tests pass; baseline failures unchanged; all quality gates pass; docs/progress updated.

---

## TASK-002: Management shell and context awareness

### Objective

Make management navigation, container behavior and nested page context clearer without decorative redesign.

### Scope

- Navigation grouping based on actual management tasks.
- `max-w-management` boundary with page-specific inner widths where needed.
- Minimal `PageHeader` breadcrumb contract for nested entities.
- Mobile drawer focus, scroll-lock and active state verification.

### Out of scope

- Dashboard/Payments screen redesign.
- Rooms route migration.
- Table refactor.

### Files likely to change

- `src/layouts/ManagementLayout.tsx`
- `src/routes/management-policy.ts`
- `src/shared/components/PageHeader.tsx`
- `src/shared/components/PageHeader.test.tsx`
- `src/layouts/LayoutAccessibility.test.tsx`
- `DESIGN.md`
- `AGENTS.md`

### Dependencies

TASK-001 routing policy must remain stable.

### Acceptance criteria

- Existing routes and permissions remain intact.
- Navigation groups reduce flat-list scanning without unnecessary grouping.
- Breadcrumbs render only for meaningful nested context, with `aria-current`.
- Mobile shell remains within touch/accessibility requirements.

### Test strategy

Component tests for breadcrumbs and shell accessibility; route policy regression; manual review at mobile, 1280px and wide desktop.

### Risks

Over-grouping or container stretching can reduce operational density. Keep inner page widths local.

### Definition of Done

Shell tests and gates pass; visual notes recorded; no route behavior regressions.

---

## TASK-003: Shared primitives proven by cross-feature contracts

### Objective

Provide only the shared UI primitives required by reference screens and repeated semantic contracts.

### Scope

- Table family for management data tables.
- FilterBar for list filtering only.
- IconButton for compact icon-only interaction.
- Skeleton only where loading geometry is shared and proven.

### Out of scope

- Global KeyValue/DescriptionList before a second feature shares the same contract.
- Generic DashboardCard, TableCards, Tooltip, Tabs or modal framework.
- Blind replacement of existing markup.

### Files likely to change

- `src/shared/components/Table.tsx`
- `src/shared/components/FilterBar.tsx`
- `src/shared/components/IconButton.tsx`
- `src/shared/components/Skeleton.tsx`
- Corresponding component tests.

### Dependencies

TASK-002 shell grammar; reference screen design decisions.

### Acceptance criteria

- Primitives expose semantic/accessibility contracts, not merely class duplication.
- No primitive is adopted by a screen without a visual/interaction reason.
- Existing accepted FilterBar warnings are not optimized unless HMR or architecture suffers.

### Test strategy

Vitest semantic rendering, keyboard, loading and forwarded attributes; targeted architecture/typecheck tests.

### Risks

Premature abstraction can make screens serve the primitive instead of users. Keep feature-local variants where needed.

### Definition of Done

Primitives tested, adopted only where justified, quality gates pass.

---

## TASK-004: Dashboard reference implementation and visual QA

### Objective

Make Dashboard glanceable, calm and operationally useful within 3–5 seconds.

### Scope

- Period control compact and non-card unless evidence requires otherwise.
- Hero/supporting KPI hierarchy using size/weight/placement, not semantic color misuse.
- Conditional attention unit after KPI.
- Booking/room breakdown and revenue/occupancy analysis.
- Normal, attention and no-activity state review at 375, 768, 1280, 1440 and 1920 widths.

### Out of scope

- New backend metrics, trends, charts or fake comparisons.
- Payments redesign.
- Generic dashboard abstractions.

### Files likely to change

- `src/features/dashboard/pages/ManagementDashboardPage.tsx`
- `src/features/dashboard/pages/ManagementDashboardPage.test.tsx`
- `DESIGN.md` only for rules proven by the reference implementation.

### Dependencies

TASK-002 and TASK-003.

### Acceptance criteria

- Revenue is neutral metric treatment; no success color solely for emphasis.
- Refunded amount is neutral/ink with explicit label.
- Warning attention does not outrank normal KPIs.
- Quick-action duplication is removed or justified contextually.
- Loading/error/zero/attention states remain clear.
- Visual QA is performed with screenshots or explicitly reports runtime limitation.

### Test strategy

Content/conditionality/link/accessibility tests; visual manual QA; full quality gates.

### Risks

Screenshots may use fixture data and not reflect production density. Label evidence as fixture/live.

### Definition of Done

Dashboard reference is reviewed and explicitly approved before TASK-005.

---

## TASK-005: Payments reference information architecture

### Objective

Create a scan-first payment operations screen with safe financial actions and a detail route for technical metadata.

### Scope

- Six-column operational table.
- Payment detail route and local technical metadata content model.
- Mobile task-prioritized payment cards.
- Warning semantics for pending/review; danger only for failure/destructive action.
- Confirmation dialog for refund/reconcile actions.

### Out of scope

- Backend payment contract redesign.
- Global KeyValue primitive unless a second feature proves the same contract.
- New payment business semantics.

### Dependencies

TASK-004 reference approval; backend/generated payment DTO review; OQ-004.

### Acceptance criteria

- List contains only decision-useful fields.
- Technical/reconciliation/refund metadata is available in detail view.
- Financial actions are explicit and confirmable.
- Mobile card hierarchy is identity/status → important metadata → primary action.

### Test strategy

Payment component tests, route tests, status semantics, authorization UI states, responsive/manual QA and E2E where backend is available.

### Definition of Done

Payments reference passes review before rollout.

---

## TASK-006: Rooms route-based editor migration

### Objective

Separate Rooms scan/list workflows from focused create/edit/image workflows.

### Scope

- `/management/rooms`
- `/management/rooms/new`
- `/management/rooms/:id`
- `/management/rooms/:id/edit`
- `/management/rooms/:id/images`
- Preserve backend request/response contract.

### Out of scope

- Backend changes.
- New room business rules.
- Global table/card abstraction.

### Dependencies

TASK-002, TASK-003, TASK-004 reference grammar; OQ-003.

### Acceptance criteria

- List remains scan/find/act.
- Editor is focused and independently navigable.
- Existing image upload and room validation behavior remains intact.
- Direct URL and back-navigation behavior are tested.

### Test strategy

Route adapter tests, room form tests, image workflow tests, Playwright room flow.

### Definition of Done

Route and form behavior pass; mobile/desktop review complete.

---

## TASK-007: Users and Customers responsive task cards

### Objective

Make identity administration readable and usable on mobile without mirroring desktop columns.

### Scope

- Semantic stacked cards.
- Identity/status first, important metadata second, one primary action visible.
- Secondary/destructive actions in appropriate overflow/secondary treatment.
- Shared Table only where it preserves desktop scanability.

### Out of scope

- Backend role/permission changes.
- Generic card framework.

### Dependencies

TASK-005 reference grammar; TASK-003.

### Acceptance criteria

- Desktop tables remain scan-friendly.
- Mobile cards are task-prioritized and touch-safe.
- Lock/password actions preserve authorization and confirmation behavior.

### Test strategy

Component tests, responsive Playwright smoke, authorization tests.

### Definition of Done

Desktop/mobile review complete and baseline failures unchanged.

---

## TASK-008: Bookings consistency pass

### Objective

Bring booking list/filter/header/table behavior into the approved reference grammar without changing booking semantics.

### Scope

- FilterBar only where list-filter semantics match.
- Table contract alignment.
- Breadcrumb/entity context on detail routes.
- Preserve BookingCard mobile model.

### Out of scope

- Booking business rules, backend DTOs, payment behavior or route authorization changes.

### Dependencies

TASK-004 and TASK-005 approvals.

### Acceptance criteria

- Query params and ownership behavior unchanged.
- Desktop/tablet/mobile scanability improves.
- Existing booking E2E behavior remains.

### Test strategy

Existing booking component/E2E tests plus visual/manual review.

### Definition of Done

Focused and full quality gates pass; docs/progress updated.

---

## TASK-009: Contract and final verification

### Objective

Verify the completed approved wave set with current Backend contract and documented evidence.

### Scope

- OpenAPI type check/generation when Backend changes.
- Full unit/component, lint, typecheck, build, architecture and available E2E.
- Security/secret/diff review.
- Documentation and progress update.

### Out of scope

- Repairing unrelated baseline failures without separate approval.

### Dependencies

All implementation tasks selected for the release.

### Acceptance criteria

- No undocumented scope changes.
- No unverified claim labeled PASS.
- Baseline failures separated from regressions.
- Open questions and follow-ups documented.

### Test strategy

All configured quality gates plus targeted live verification where runtime is available.

### Definition of Done

Verification report contains commands, actual results, files changed, remaining risks and follow-up issues.

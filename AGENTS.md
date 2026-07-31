# HBMS Frontend Agent Instructions

This React/Vite frontend follows an ECC-inspired, project-local workflow. Keep
the UI practical for a management tool and aligned with the Backend contract.

## Architecture Rules

- Feature code lives under `src/features/<domain>`.
- Shared primitives live under `src/shared`.
- API client behavior belongs in `src/api` and feature `api.ts` files.
- Prefer generated OpenAPI types when available.
- Do not duplicate Backend business rules in the UI except for helpful form
  validation and disabled states.
- Treat the Backend as the source of truth for auth, pricing, booking status,
  payment status, and room availability.

## UI Direction

- Management screens should be dense, calm, and scan-friendly.
- Avoid landing-page style layouts for operational pages.
- Use existing shared components before adding new visual primitives.
- Keep buttons, tables, forms, dialogs, filters, and status badges consistent.
- Make mobile layouts usable; text must not overflow buttons or cards.

## Frontend Module Checklist

For each new or changed feature:

1. Confirm the Backend route, actor, request body, and response body.
2. Update or generate API types.
3. Add schema validation for forms.
4. Add React Query hooks where data is loaded or mutated.
5. Add optimistic UI only when rollback behavior is clear.
6. Show loading, empty, error, and success states.
7. Add unit/component tests for validation, rendering, and important actions.
8. Add Playwright E2E for critical user journeys.

## Payment And Booking UI Rules

- VNPay return pages should treat query params as untrusted display input.
- Payment success must be confirmed by Backend state, not only browser return.
- Refund state `REFUND_PENDING` is normal while VNPay shows pending/review.
- Booking availability must be refreshed after create, cancel, expire, pay, or
  refund actions that can affect user decisions.

## Commands

- Architecture hygiene: `npm run architecture:check`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Unit/component tests: `npm run test`
- E2E: `npm run test:e2e`
- Contract generation: `npm run contract:generate`
- Build: `npm run build`

## Contract Policy

- When Backend OpenAPI changes, run Backend `npm run openapi:generate`, then FE
  `npm run contract:generate`.
- Prefer removing hand-written response types over adding more duplicates once
  the generated contract covers that API.
- Do not hand-edit generated files under `src/api/generated`.

# Business Rules — Frontend Boundary

## Verified frontend rules

- Frontend must not duplicate backend business rules beyond validation and helpful disabled states.
- Authenticated principal contains `actorType`; user principals also contain `role`.
- Customer default workspace is `/bookings`.
- STAFF default workspace is `/staff/counter`.
- ADMIN default workspace is `/management/dashboard`.
- Post-login `returnTo` must be safe, authorized, and belong to the principal's workspace surface.
- ADMIN may technically access authorized staff routes, but a staff route is not an ADMIN post-login landing destination.
- Route guards remain authoritative for runtime authorization.
- Payment success is determined by backend state, not browser return parameters alone.
- `REFUND_PENDING` is a normal recoverable/pending state; stale attention is warning semantics, not automatically failure.
- Backend remains source of truth for pricing, availability, booking status and payment status.

## UI rules

- Destructive and financial actions require explicit confirmation.
- Management lists are scan-first; mobile representations reprioritize information rather than mirror desktop columns.
- Dashboard metrics use visual hierarchy through size, weight, placement and whitespace; ordinary metrics do not use success/danger colors merely for emphasis.

## Open questions

These require backend/product confirmation before implementation that depends on them:

- Whether a unified backend login endpoint will replace frontend endpoint fallback.
- Exact permissions and routes for future management/staff overlap.
- Payment detail metadata and route contract.
- Rooms editor route/data loading contract.

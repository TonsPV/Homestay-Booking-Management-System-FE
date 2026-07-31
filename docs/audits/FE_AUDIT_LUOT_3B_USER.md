# FE Audit - Lượt 3B - User account management

Ngày kiểm chứng: 2026-07-29

## Scope

- ADMIN list/filter internal User accounts.
- ADMIN create/update/status for STAFF.
- STAFF authorization boundary for the ADMIN-only User screen.
- Unique conflict feedback for email/phone.

## Contract

| Capability | Method/path |
|---|---|
| List/filter | `GET /api/v1/users` |
| Create STAFF | `POST /api/v1/users` |
| Update profile/password | `PATCH /api/v1/users/{id}` |
| Lock/unlock | `PATCH /api/v1/users/{id}/status` |

Request types derive from generated `CreateUserDtoWritable`,
`UpdateUserDtoWritable` and `UserAdminListUsersData`. FE deliberately omits
`role` from create/update inputs because Backend only issues `STAFF` through
this API.

## Design decisions

1. Create form states that every new account is STAFF; it does not expose a
   role selector.
2. Update form shows the current role as read-only context. It cannot send
   role changes that Backend does not support.
3. The API adapter rebuilds create/update bodies from an explicit whitelist,
   so an accidental extra `role` property cannot cross the network boundary.
4. The current ADMIN can edit profile data but cannot click the self-lock
   action. The disabled action explains the Backend constraint with a title.
5. List role filters retain both ADMIN and STAFF because the read contract
   returns both roles; filtering is not an authorization mutation.
6. Backend `409` messages and `requestId` remain visible instead of replacing
   them with generic client copy.

## Defects fixed

- Removed unsupported `ADMIN` option from the update form.
- Removed `role` from User create/update client inputs and network payloads.
- Connected User request/query types to generated OpenAPI types.
- Prevented the signed-in ADMIN from triggering a known-invalid self-lock.
- Added unit/API coverage for validation and role payload hardening.
- Added mocked and live browser journeys for create, update, conflict, role
  denial, lock and revoked login.
- Replaced remaining visible `HB` initials and the management brand label with
  `HG` / `Homestay Green`.

## State and authorization coverage

| Capability | Loading/error/empty/success | Authorization |
|---|---|---|
| List/filter | Existing loading, retry error, empty, pagination | ADMIN route |
| Create | Pending button, schema errors, API error, success alert | ADMIN route/action |
| Update | Pending button, schema errors, API error, success alert | ADMIN route/action |
| Lock/unlock | Pending row action, API error, success alert | ADMIN; self-lock disabled |
| STAFF access | N/A | Redirects to `/forbidden` |

## Test evidence

- `src/features/users/api.test.ts`: authenticated paths, create/update methods
  and hard whitelist that strips an injected `ADMIN` role.
- `src/features/users/validation.test.ts`: valid form, mismatch/contact errors
  and removal of unknown role input.
- `e2e/user-management.pw.ts`: ADMIN create → edit → lock; self-lock disabled;
  Backend unique conflict copy on desktop and mobile.
- `e2e-live/user-management.pw.ts`: real ADMIN creates and edits STAFF,
  Backend normalizes phone to E.164, STAFF receives `403`, ADMIN locks STAFF,
  and locked STAFF login is rejected.
- Live credentials are passed only by environment variables against
  `NODE_ENV=test` and an `_test` database.

## Commands and results

| Command | Result |
|---|---|
| `npm run contract:check` | PASS |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run test` | PASS, 43 files / 170 tests |
| `npm run build` | PASS |
| `npm run test:e2e` | PASS, 27 pass / 1 skip |
| User live journey | PASS, 1 |

Build vẫn còn FE-009 `INEFFECTIVE_DYNAMIC_IMPORT`, giữ tới Lượt 10.

## Exit decision

`PASS`

User contract, authorization, validation, loading/error/empty/success states
và critical live journey đều đạt exit gate. Lượt 4 - Amenity được phép bắt đầu.

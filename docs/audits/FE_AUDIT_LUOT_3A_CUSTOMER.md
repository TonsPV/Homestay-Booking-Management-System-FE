# FE Audit - Lượt 3A - Customer account management

Ngày kiểm chứng: 2026-07-29

## Scope

- Customer profile view/update.
- Customer change password and token revocation behavior.
- ADMIN list/filter and lock/unlock Customer.
- ADMIN set initial password for an eligible counter Customer.

## Contract

| Capability | Method/path |
|---|---|
| Profile | `GET /api/v1/customers/me` |
| Update profile | `PATCH /api/v1/customers/me` |
| Change own password | `PATCH /api/v1/customers/me/password` |
| Admin list | `GET /api/v1/customers` |
| Admin status | `PATCH /api/v1/customers/{id}/status` |
| Initial password | `PATCH /api/v1/management/customers/{id}/initial-password` |

Response types dùng generated `AuthCustomerDto` và
`CustomerCredentialResultDto`. Initial password body chỉ gửi `{ password }`;
không được lưu trong query cache, URL, persistent state hoặc log.

## Design decisions

1. Không thêm modal hoặc `prompt()`. ADMIN chọn action ngay tại customer row,
   sau đó nhập password và confirmation trong một card task riêng.
2. Do list contract không trả `passwordConfigured`, FE không đoán eligibility.
   Action được hiển thị và Backend trả `409` nếu Customer đã có password.
3. Card tự focus password, có validation, loading, error, cancel và success.
4. Sau đổi mật khẩu riêng, session/query cache bị xóa; login page hiển thị
   success notice bằng trusted query flag, không nhận arbitrary message từ URL.
5. Profile mutation cập nhật Auth principal và invalidate dữ liệu liên quan.

## Defects fixed

- Bổ sung API/hook/UI cho management initial Customer password.
- Bổ sung validation password + confirmation.
- Bổ sung success/error state và reset credential khỏi form memory.
- Sửa race giữa logout và Router redirect làm mất thông báo đổi mật khẩu.
- Giữ `requestId` trong server error để hỗ trợ tra cứu.

## Capability matrix

| Capability | Status | Unit/API | Mocked browser | Live Backend |
|---|---|---|---|---|
| Profile view/update | PASS | Query + validation | Existing protected UI | Update thật |
| Change password | PASS | API + validation | Session teardown tests | Change + re-login thật |
| Admin list/filter | PASS | Query/API | Customer management page | Search thật |
| Lock/unlock | PASS | Mutation | Role guard | Lock/unlock thật |
| Initial password | PASS | API + validation | Desktop/mobile | ADMIN set → CUSTOMER login |
| Credential secrecy | PASS | Body-only contract | Password input | Fixture does not log password |

## Test evidence

- `e2e/customer-initial-password.pw.ts`: ADMIN initial password UI trên
  desktop/mobile.
- `e2e-live/customer-auth.pw.ts`: register → login → restore → profile update
  → change password → success notice → re-login → logout.
- `e2e-live/customer-management.pw.ts`: ADMIN search counter Customer → set
  initial password → lock → unlock → CUSTOMER login.
- Backend `test:fixtures:auth` provisions only explicit accounts in `_test`,
  resets the counter Customer to `passwordHash = null` before the journey.

## Commands and results

| Command | Result |
|---|---|
| `npm run contract:check` | PASS |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run test` | PASS, 41 files / 165 tests |
| `npm run build` | PASS |
| `npm run test:e2e` | PASS, 23 pass / 1 skip |
| Customer live journeys | PASS, 2 |
| Backend lint/build | PASS |

Build vẫn còn FE-009 `INEFFECTIVE_DYNAMIC_IMPORT`, giữ tới Lượt 10.

## Exit decision

`PASS`

Customer contract, validation, loading/error/empty/success states và critical
live journeys đều đạt exit gate. Lượt 3B - User account management được phép
bắt đầu.

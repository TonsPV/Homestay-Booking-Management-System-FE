# FE Audit - Lượt 2 - Auth và route authorization

Ngày kiểm chứng: 2026-07-29

## Scope

- Customer register/login.
- STAFF/ADMIN login.
- `/auth/me` restore, session expiry và cross-tab synchronization.
- Customer/management route guard, role guard và redirect.
- Logout và private React Query cache.
- `401`, `403`, `409`, `429` và malformed login response.
- Không thêm refresh token hoặc Backend logout vì OpenAPI không có contract đó.

## Backend contract

| Capability | Method/path | Actor |
|---|---|---|
| Register Customer | `POST /api/v1/auth/customers/register` | Public |
| Login Customer | `POST /api/v1/auth/customers/login` | Public |
| Login STAFF/ADMIN | `POST /api/v1/auth/users/login` | Public |
| Restore principal | `GET /api/v1/auth/me` | Bearer Customer/User |

Auth request dùng generated `LoginDtoWritable` và
`RegisterCustomerDtoWritable`. Raw response dùng generated
`AuthCustomerDto`, `AuthLoginResponseDto`,
`AuthMeCustomerResponseDto` và `AuthMeUserResponseDto`.

`LoginResponse` là view model phân biệt actor, chỉ được tạo sau khi adapter xác
nhận actor và principal tương ứng có mặt. FE không tạo refresh/logout request
không tồn tại trong contract.

## Design decisions

1. Giữ hai login entry point vì Customer và User là hai actor Backend khác nhau.
2. Customer mặc định về `/bookings`; STAFF/ADMIN mặc định về `/management`.
3. Sai actor hoặc role đi `/forbidden`, không chỉ ẩn navigation.
4. `401` có token hiện tại sẽ clear session và toàn bộ query cache.
5. `403` không bị giả thành logout; session được giữ để UI hiển thị permission
   error và cho người dùng chủ động đăng xuất.
6. Logout là local session teardown vì Backend chưa có logout endpoint.
7. Session storage/local storage được validate version, expiry, token type,
   actor, role và principal trước khi dùng; `/auth/me` vẫn là bước revalidation.
8. Nhận diện chữ đổi sang **Homestay Green**; chưa đổi hệ màu trong lượt Auth để
   tránh redesign lan rộng.

## Actor/role matrix

| Principal | Customer route | Management route | Admin-only route |
|---|---|---|---|
| Anonymous | Redirect `/login` | Redirect `/management/login` | Redirect login |
| CUSTOMER | Allow | Forbidden | Forbidden |
| STAFF | Forbidden | Allow | Forbidden |
| ADMIN | Forbidden | Allow | Allow |

## Defects fixed and tests added

- Auth core request/response đã nối generated OpenAPI types.
- Login adapter từ chối response đúng actor nhưng thiếu principal.
- Bổ sung unit test xác nhận `403` không clear session.
- Bổ sung mocked browser login CUSTOMER, STAFF, ADMIN và anonymous redirect.
- Bổ sung live CUSTOMER register → login → reload/restore → logout.
- Bổ sung live STAFF/ADMIN login → reload/restore → logout.
- Bổ sung Backend fixture script chỉ chạy với `NODE_ENV=test` và DB `_test`;
  credential bắt buộc truyền qua environment, không được ghi hoặc log.
- Cập nhật brand text và document title thành **Homestay Green**.

## Capability matrix

| Capability | Status | Unit/component | Mocked browser | Live integration |
|---|---|---|---|---|
| Customer register/login | PASS | API + validation | Customer login | Register/login thật |
| STAFF login | PASS | API + guard | Login + role route | Login/restore/logout thật |
| ADMIN login | PASS | API + guard | Login + admin route | Login/restore/logout thật |
| Session restore/expiry | PASS | Provider + storage | Route journeys | Reload `/auth/me` |
| Anonymous redirect | PASS | RouteGuard | Desktop/mobile | Customer protected route |
| 401 teardown | PASS | Session/cache test | Covered by guard flow | Backend auth matrix |
| 403 permission state | PASS | Session retained | STAFF admin denial | Backend role contract |
| 409 register conflict | PASS | Error pipeline | Error UI shared | Backend E2E contract |
| 429 cooldown | PASS | Cooldown tests | Shared login UI | Backend rate-limit E2E |
| Logout cache teardown | PASS | Direct/cross-tab tests | UI logout | CUSTOMER/STAFF/ADMIN |

## Safe live fixture workflow

Required environment values:

- `NODE_ENV=test`
- `DB_DATABASE` ending `_test`
- `HBMS_LIVE_ADMIN_IDENTIFIER`
- `HBMS_LIVE_STAFF_IDENTIFIER`
- `HBMS_LIVE_AUTH_PASSWORD`

Provision with Backend `npm run test:fixtures:auth`, then run FE
`npm run test:e2e:live` with the existing live safety variables and the same
three auth variables. The fixture script updates only the two explicit test
accounts and revokes their previous tokens by incrementing `tokenVersion`.

## Commands and results

| Command | Result |
|---|---|
| `npm run contract:check` | PASS |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run test` | PASS, 41 files / 163 tests |
| `npm run build` | PASS |
| `npm run test:e2e` | PASS, 21 pass / 1 skip |
| `npm run test:e2e:live` | PASS, 4 live Chromium journeys |
| Backend `npm run lint` | PASS |
| Backend `npm run build` | PASS |
| Backend `npm run test:fixtures:auth` | PASS against `hbms_test` |

Build vẫn có FE-009 `INEFFECTIVE_DYNAMIC_IMPORT`, xử lý ở Lượt 10 theo kế
hoạch đã khóa.

## Exit decision

`PASS`

Auth contract, session lifecycle, actor/role guard, error behavior và browser
evidence đều đạt exit gate. Không còn P0/P1 trong phạm vi Lượt 2. Lượt 3 -
Customer/User account management được phép bắt đầu.

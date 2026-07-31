# HBMS Frontend Module-by-Module Execution Plan

Ngày lập: 2026-07-29

Phạm vi: `D:\HBMS\homestay-booking-management-system-fe`

Nguồn contract Backend:
`D:\HBMS\homestay-booking-management-system-api\docs\openapi.json`

## 1. Mục tiêu

Kế hoạch này đưa Frontend hiện có từ trạng thái đã có phần lớn giao diện và API
wrapper sang trạng thái tích hợp được kiểm chứng với Backend mới.

Các nguyên tắc bắt buộc:

1. Thực hiện lần lượt từng module; không audit hoặc sửa toàn hệ thống trong một
   lượt.
2. Backend OpenAPI, response runtime và Backend E2E là nguồn sự thật. Frontend
   không suy luận business rule từ giao diện.
3. Mỗi module phải kiểm tra đủ route, actor/role, request, response, state, error,
   responsive và luồng liên module.
4. Có file hoặc giao diện không đồng nghĩa capability đã hoàn tất. Capability chỉ
   được đánh dấu `PASS` khi có bằng chứng test phù hợp.
5. Sửa defect trong đúng lượt của module. Refactor chỉ thực hiện sau khi có test
   bảo vệ hành vi.
6. Không đổi thiết kế giao diện hàng loạt trong giai đoạn tích hợp. Giữ style
   hiện có, ưu tiên tính đúng, nhất quán và khả năng vận hành.
7. Không coi file chưa được Git theo dõi là file rác nếu chưa chứng minh được nó
   không còn được import, không thuộc build/test/tooling và không phải thay đổi
   đang làm dở.

## 2. Baseline đã xác nhận

### 2.1. Công nghệ và cấu trúc

- React 19, React Router 7, Vite 8 và TypeScript.
- TanStack React Query quản lý server state.
- React Hook Form và Zod quản lý form/validation.
- Vitest, Testing Library, MSW và Playwright đã được cấu hình.
- Feature code đã chia theo domain tại `src/features`.
- HTTP client và response envelope đã tập trung tại `src/api`.
- Auth session, actor/role guard và public/management layout đã tồn tại.
- Có 205 file dự án ngoài `node_modules`, `dist` và `test-results`; trong đó 186
  file thuộc `src` và 45 file test.

### 2.2. Quality gate hiện tại

Kết quả ngày 2026-07-29:

| Gate | Kết quả |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run test` | PASS, 41 file / 161 test |
| `npm run build` | PASS |
| `npm run test:e2e` | PASS, 13 pass / 1 skip |

Lưu ý:

- Playwright hiện mock Backend bằng `page.route`; đây là browser/component
  integration, chưa phải bằng chứng tích hợp với Backend runtime thật.
- Build có cảnh báo `room-types/index.ts` vừa dynamic import vừa static import,
  làm giảm hiệu quả tách chunk.
- Worktree hiện có `readme.md` đã sửa và phần lớn scaffold chưa được Git theo
  dõi. Phải tạo baseline/checkpoint rõ ràng trước khi triển khai lớn.

### 2.3. Trạng thái module hiện có

| Module | UI/API hiện có | Bằng chứng hiện có | Gap chính |
|---|---|---|---|
| Foundation | API client, envelope, config, query client, error boundary | Unit + build | Chưa giữ `requestId`; generated contract mới chỉ phủ Room Calendar |
| Auth | Register, Customer login, User login, restore session, guards | Unit/component; browser authorization | Chưa có live Backend login/register/restore journey |
| Customer | Profile, đổi mật khẩu, admin list/status | Unit API/validation | Thiếu management initial-password UI/API; thiếu browser journey |
| User | Admin list/create/update/status | Query/UI code | Thiếu browser journey và generated DTO |
| Amenity | Public options, Admin CRUD/restore | Unit; mocked browser create | Chưa có live Backend flow |
| RoomType | Public data, Admin CRUD/restore/amenity assignment | Unit API/schema | Public route đang redirect về Room; thiếu browser journey |
| Room | Public list/search/detail; management CRUD/status/image/calendar | Unit/component | Thiếu live flow cho image, cover và calendar conflict |
| Booking | Customer và management create/list/detail/transition/cancel | Unit/component; mocked customer booking | Thiếu management browser flow và live conflict/state transition |
| Payment | Customer VNPay; management manual/refund/reconcile | Unit/component; mocked VNPay return | Thiếu live/provider-simulated flow và stale-refund queue |
| Dashboard | Màn hình link tĩnh | Component test | Chưa gọi `/management/dashboard/summary` |

### 2.4. Gap liên repository cần đóng trước

Backend đã có:

- 66 OpenAPI operations và 67 component schemas.
- 0 documented response thiếu JSON schema.
- Success/error envelope có `requestId`.
- Dashboard summary endpoint.
- Management initial Customer password endpoint.
- Booking/Payment/Room contract đã ổn định sau refactor.

Frontend hiện còn:

1. `src/api/generated/openapi.ts` chỉ sinh type Room Calendar.
2. Auth, User, Customer, Amenity, RoomType, Room, Booking và Payment vẫn có
   response type viết tay.
3. `ApiSuccess`, `ApiFailure` và `ApiError` chưa giữ `requestId`.
4. Chưa có test chứng minh FE typecheck fail khi Backend bỏ/đổi field response.
5. Chưa có browser E2E chạy với Backend runtime thật.

Đây là P1 và phải xử lý tại Lượt 1 trước khi mở rộng tính năng.

## 3. Định nghĩa trạng thái capability

Mỗi capability chỉ dùng một trong các trạng thái:

- `NOT_STARTED`: chưa có implementation.
- `UI_ONLY`: có giao diện nhưng chưa nối contract thật.
- `IMPLEMENTED`: có code và test cục bộ.
- `INTEGRATED`: đã chạy với Backend runtime.
- `PASS`: integrated và qua toàn bộ exit gate của module.
- `BLOCKED`: có dependency cụ thể, owner và điều kiện gỡ block.
- `DEFERRED`: chủ động để sau, có lý do và không ảnh hưởng release scope hiện tại.

Không dùng từ `done`, `ready` hoặc `complete` nếu chưa ghi bằng chứng.

## 4. Quy trình bắt buộc cho mỗi lượt

Mỗi lượt chỉ xử lý một module theo trình tự sau.

### Bước A - Khóa phạm vi

- Liệt kê page, route, component, hook, API wrapper, type và test của module.
- Liệt kê dependency đi vào và capability liên module bị ảnh hưởng.
- Ghi rõ phần không thuộc lượt để tránh refactor lan rộng.

### Bước B - Chốt contract

- Xác nhận method/path, actor/role và ownership từ OpenAPI + Backend E2E.
- Map request/query/response sang generated type.
- Liệt kê enum, nullable/optional, ID, money, datetime và date-only.
- Liệt kê lỗi cần xử lý: `400`, `401`, `403`, `404`, `409`, `429`, `5xx`.

### Bước C - Vẽ use case và state

- Happy path.
- Loading, empty, error và success.
- Unauthorized/forbidden.
- Conflict và stale data.
- Retry/idempotency nếu là mutation.
- Transition trước/sau và query cần invalidate/refetch.

### Bước D - Audit implementation

- Component không gọi URL trực tiếp.
- Business rule không bị nhân bản ở FE.
- Query key và invalidation không dùng string rải rác.
- Form có schema validation và server error.
- Mutation chỉ optimistic khi có rollback rõ ràng.
- Mobile, keyboard, focus và overflow được kiểm tra.

### Bước E - Sửa trong module

Thứ tự sửa:

1. Contract/type drift.
2. Authorization hoặc ownership.
3. Business flow sai.
4. Error/loading/empty/success state thiếu.
5. Test thiếu.
6. Cấu trúc code và hiệu năng.

### Bước F - Kiểm chứng

Chạy tối thiểu:

```bash
npm run contract:generate
npm run typecheck
npm run lint
npm run test
npm run build
```

Sau đó chạy Playwright cho module. Module có mutation hoặc business transition
phải có ít nhất một browser journey với Backend runtime/test environment thật.

### Bước G - Báo cáo và đóng lượt

Mỗi lượt tạo/cập nhật capability matrix:

| Capability | Status | Contract | Unit/component | Mocked browser | Live integration | Gap |
|---|---|---|---|---|---|---|

Chỉ chuyển sang lượt kế tiếp khi:

- Không còn P0/P1 trong module.
- Contract generation, typecheck, lint, test và build đều pass.
- Luồng chính có browser evidence.
- Gap còn lại đã có severity, owner và lượt xử lý.

## 5. Thứ tự thực thi

## Lượt 0 - Baseline, Git checkpoint và test topology

Mục tiêu: tạo điểm xuất phát có thể so sánh và rollback.

Việc làm:

1. Xác nhận toàn bộ file hiện có là baseline được giữ lại hay thay đổi đang làm
   dở; không tự xóa file untracked.
2. Commit/checkpoint baseline theo quyết định của owner repository.
3. Ghi version Node/npm và các environment variable cần thiết.
4. Tách rõ ba tầng test:
   - Unit/component với MSW/fetch mock.
   - Mocked browser E2E hiện có.
   - Live integration browser E2E chạy với Backend test environment.
5. Thiết kế live integration không cho FE trực tiếp truncate/seed DB sản xuất.
   Backend phải chạy với `NODE_ENV=test` và database kết thúc bằng `_test`.
6. Chụp route/module inventory và baseline bundle.

Exit gate:

- Baseline Git rõ ràng.
- Không có secrets trong repository.
- Ba tầng test có command hoặc backlog executable rõ ràng.
- Quality gate baseline vẫn pass.

## Lượt 1 - OpenAPI contract và API foundation

Mục tiêu: đóng DQ-001 trước khi sửa feature.

Việc làm:

1. Thay generator chỉ dành cho Room Calendar bằng generator toàn bộ
   `paths/components/operations` từ `docs/openapi.json`.
2. Generated output chỉ nằm trong `src/api/generated` và không sửa tay.
3. Thêm contract drift command:
   - Generate vào output xác định.
   - CI fail nếu generated file khác snapshot đã commit.
4. Chuyển success/error envelope sang generated type hoặc adapter được type từ
   generated schema.
5. Bổ sung `requestId`:
   - `ApiResult` giữ response `requestId`.
   - `ApiError` giữ error `requestId`.
   - Error UI có thể hiển thị mã tra cứu mà không dùng nó cho business logic.
6. Chuyển từng response core sang generated type:
   Auth → User/Customer → Amenity/RoomType → Room → Booking → Payment →
   Dashboard.
7. Giữ type UI/view-model riêng khi thực sự khác API DTO; đặt tên để không nhầm
   với response contract.
8. Thêm negative contract test chứng minh thay đổi field bắt buộc trong fixture
   OpenAPI làm typecheck/contract check fail.
9. Kiểm tra `204`, multipart upload, pagination meta, array query và nullable
   response.

Exit gate:

- Không còn response DTO viết tay trùng với OpenAPI core.
- `requestId` đi xuyên suốt success/error path.
- Contract drift check pass.
- Typecheck fail có chủ đích khi fixture contract bị phá.
- Toàn bộ quality gate pass.

## Lượt 2 - Auth và route authorization

Phạm vi:

- Register Customer.
- Customer login.
- Staff/Admin login.
- `/auth/me` restore.
- Logout, token hết hạn, token bị revoke, account bị lock.
- Route guard theo `customer`, `user`, `ADMIN`, `STAFF`.

Việc làm:

1. Chuyển Auth request/response sang generated contract.
2. Kiểm tra session persistence, expiry và cross-tab synchronization.
3. `401` phải clear session và đưa về đúng login route.
4. `403` không được giả thành logout; hiển thị forbidden/permission state.
5. Kiểm tra `409` register conflict và `429` login cooldown.
6. Không bổ sung refresh-token behavior khi Backend chưa có contract.
7. Thêm browser journey:
   - Register → login → restore → logout.
   - Staff không vào được Admin route.
   - Locked/revoked account mất quyền ở lần request kế tiếp.

Exit gate:

- Actor/role matrix pass ở unit, mocked browser và live integration.
- Không có route management/customer bị lộ do chỉ ẩn navigation.
- Không còn Auth response type viết tay.

## Lượt 3 - Customer và User account management

### Lượt 3A - Customer

Phạm vi:

- Profile view/update.
- Change password và token revocation.
- Admin list/filter/status.
- Management set initial password cho counter-booked Customer.

Việc làm:

1. Bổ sung API/hook/UI cho
   `/management/customers/{id}/initial-password`.
2. Chỉ hiển thị action theo role/contract; không lưu hoặc log password.
3. Sau đổi mật khẩu, xử lý session cũ theo response Backend.
4. Kiểm tra phone E.164, email nullable và field errors.
5. Live journeys:
   - Customer sửa profile.
   - Customer đổi mật khẩu và đăng nhập lại.
   - Admin lock/unlock.
   - Admin đặt initial password cho Customer đủ điều kiện.

### Lượt 3B - User

Phạm vi:

- Admin list/create/update/status cho STAFF.

Việc làm:

1. Xác nhận FE không cho tạo ADMIN qua API.
2. Kiểm tra role/actor cả ở route lẫn action.
3. Xử lý unique conflict cho email/phone.
4. Live journey Admin tạo STAFF → sửa → lock; STAFF không truy cập màn hình.

Exit gate chung:

- Customer/User contract generated.
- Ownership và authorization pass.
- Credential không xuất hiện trong log, URL hoặc persistent client state.

## Lượt 4 - Amenity

Phạm vi:

- Public active Amenity options.
- Admin list/create/update/delete/restore.

Việc làm:

1. Chuyển DTO/query sang generated contract.
2. Xác nhận delete là soft delete và restore đúng state.
3. Kiểm tra loading/empty/error/pagination/search.
4. Conflict từ tên trùng hoặc Amenity đang được sử dụng phải hiển thị rõ.
5. Live journey Admin CRUD/restore.

Exit gate:

- CRUD/restore và public option list pass.
- Không có catalog hard-code trong Room/RoomType UI.

## Lượt 5 - RoomType

Phạm vi:

- Public list/detail contract.
- Admin CRUD/delete/restore.
- Gán chính xác tập Amenity.

Việc làm:

1. Quyết định rõ public `/room-types`:
   - Nếu sản phẩm chỉ cần Room catalog, giữ redirect và bỏ page/code không dùng.
   - Nếu cần catalog RoomType, nối page hiện có và thêm navigation/test.
2. Không giữ đồng thời page chết và redirect mà không có quyết định.
3. Base price giữ dạng decimal string; không tính bằng JavaScript float.
4. Amenity assignment dùng exact set và invalidate Room/RoomType query.
5. Live journeys Admin CRUD/restore và gán Amenity.

Exit gate:

- Public product decision được ghi rõ.
- Không còn page/export không có đường truy cập ngoài chủ đích.
- RoomType/Amenity integration pass.

## Lượt 6 - Room inventory, image, availability và calendar

### Lượt 6A - Public Room

- Public list/detail chỉ hiển thị inventory Backend trả về.
- Search theo ngày, khách, RoomType, giá và `amenityIds`.
- Nhiều Amenity có ý nghĩa AND theo Backend.
- `YYYY-MM-DD` không qua UTC conversion.
- Khi availability conflict, refetch thay vì tự đoán.

### Lượt 6B - Management Room

- List/detail/create/update/status.
- ADMIN/STAFF visibility đúng contract.
- Không thay đổi route hoặc enum trong lượt refactor.

### Lượt 6C - Room Image

- Multipart upload.
- URL ảnh do Backend trả về.
- Chỉ một cover image.
- Delete/set-cover phải refetch Room detail.
- Test upload error, unsupported file, conflict và ảnh hỏng.

### Lượt 6D - Room Calendar

- Render `RESERVED` và `BLOCKED`.
- Block/unblock theo `[from, to)`.
- Unblock không được xóa reserved night.
- `409` phải reload calendar và availability.

Exit gate:

- Public visibility, search AND Amenity, management mutation, image cover và
  calendar conflict đều có test.
- Ít nhất một live journey từ search tới Room detail.
- Ít nhất một live management journey cho status/image/calendar.

## Lượt 7 - Booking

### Lượt 7A - Customer Booking

- Search Room → create booking.
- Contact mặc định từ profile.
- Chỉ gửi contact override khi đặt cho người khác.
- List/detail/cancel.
- Hiển thị `paymentExpiresAt`.

### Lượt 7B - Counter Booking

- STAFF/ADMIN tạo booking bằng `customerId` hoặc contact.
- Kiểm tra Customer được tạo từ counter flow và initial-password dependency.
- Chỉ flow Backend cho phép mới có `CONFIRMED + UNPAID`.

### Lượt 7C - Lifecycle

- Allowed transition do Backend quyết định.
- Check-in đúng ngày.
- Check-out cập nhật Room sang state vận hành Backend trả về.
- Cancel/expire/pay/refund phải invalidate booking, room availability,
  calendar và payment liên quan.

Test bắt buộc:

- Overlap conflict.
- Guest count/date validation.
- Ownership Customer.
- Staff/Admin access.
- Cancel, expiry, check-in và check-out transition.
- Live Customer booking và live counter booking.

Exit gate:

- Không duplicate booking state machine trong FE.
- UI disabled state chỉ để hỗ trợ; Backend response vẫn là quyết định cuối.
- Customer và management main journey pass.

## Lượt 8 - Payment, VNPay và refund

### Lượt 8A - Customer VNPay

- Tạo payment với stable `Idempotency-Key`.
- Không gửi amount từ FE.
- Reuse pending attempt khi Backend trả `409`.
- Redirect bằng `paymentUrl` Backend trả về.
- Return query là untrusted display input.
- Return page phải refetch booking/payment authoritative state.

### Lượt 8B - Manual Payment

- STAFF/ADMIN ghi nhận `CASH` hoặc `BANK_TRANSFER`.
- Stable idempotency key cho mỗi user action.
- Không tự set booking `PAID`.

### Lượt 8C - Refund và reconciliation

- Full refund theo quyền và thời điểm Backend cho phép.
- `REFUND_PENDING` là state bình thường; không gửi refund lần hai.
- Retry timeout dùng cùng key và chuyển sang query/reconciliation.
- Hiển thị stale refund queue/indicator từ contract mới.
- `REQUIRES_REVIEW` có action và thông tin đủ cho vận hành.

Test bắt buộc:

- Double click/idempotency.
- Pending payment conflict.
- VNPay return không tự đánh dấu success.
- Manual payment.
- Refund pending, success, failure và reconciliation.
- Staff/Admin permission.

Exit gate:

- Payment status chỉ đến từ Backend.
- Không có unverified query/provider data làm thay đổi UI business state.
- Customer, manual payment và refund/reconcile journeys pass.

## Lượt 9 - Management Dashboard

Phạm vi:

- `/management/dashboard/summary`.
- Date range.
- Booking/Room status count.
- Revenue by method, total refunded, payment metrics và occupancy.

Việc làm:

1. Tạo feature `src/features/dashboard` gồm generated type, API, query key,
   hook, formatter và test.
2. Thay dashboard link tĩnh bằng dữ liệu thật nhưng giữ quick action hữu ích.
3. Có date range mặc định và validation.
4. Phân biệt loading, empty, partial-looking zero data, error và success.
5. Money/date/time dùng shared formatter.
6. Thêm live browser E2E cho STAFF và ADMIN.

Exit gate:

- Dashboard không còn số liệu hard-code.
- Zero data không bị hiển thị như lỗi.
- Date range và summary contract pass.

## Lượt 10 - Cross-module hardening

Mục tiêu: kiểm tra hành trình xuyên module sau khi từng module đã pass độc lập.

Journeys bắt buộc:

1. Customer register → login → search → booking → VNPay initiation → return →
   authoritative status.
2. Staff login → counter booking → manual payment → check-in → check-out.
3. Admin login → Amenity → RoomType → Room → image/cover → calendar block.
4. Admin lock Customer/User → session/authorization phản ánh ở request tiếp.
5. Admin refund → pending/reconcile → booking/payment/dashboard refresh.

Kiểm tra:

- Query invalidation xuyên module.
- Global `401`, `403`, `409`, `429`, network và malformed response.
- Responsive desktop/mobile.
- Keyboard, focus, label, dialog và screen reader status.
- Error boundary và runtime error reporting.
- Bundle size, lazy route và ineffective dynamic import warning.

Exit gate:

- Tất cả critical journeys pass với mocked browser.
- Critical integration subset pass với Backend test runtime.
- Không còn P0/P1.
- Build không còn warning kiến trúc đã được chấp nhận mà không ghi lý do.

## Lượt 11 - Repository hygiene và architecture review

Chỉ thực hiện sau khi Lượt 0-10 có test bảo vệ.

Việc làm:

1. Scan import graph để tìm unreachable source.
2. Tìm page, barrel export, generated artifact, test result và debug file không
   còn dùng.
3. Kiểm tra dependency không được import.
4. Kiểm tra file lớn:
   - Tách page/component theo capability khi vượt khả năng review.
   - Giữ public hook/API ổn định.
5. Chuẩn hóa query-key owner; loại string key rải rác như `['rooms']`,
   `['bookings']`, `['payments']` khi đã có key factory.
6. Kiểm tra duplicate enum/status/formatter/schema.
7. Chỉ xóa file sau khi chứng minh:
   - Không import.
   - Không thuộc route/build/test/script.
   - Không phải generated source cần giữ.
   - Quality gate pass sau khi xóa.

Exit gate:

- Không có source unreachable ngoài allowlist có lý do.
- Không có runtime import cycle.
- Không có response contract viết tay trùng generated schema.
- Không còn artifact runtime/test bị commit ngoài chủ đích.
- Full quality gate pass.

## 6. Priority backlog

| ID | Mức | Việc | Owner/Lượt |
|---|---|---|---|
| FE-001 | P1 | Sinh full OpenAPI types và thay response type viết tay | Lượt 1 |
| FE-002 | P1 | Giữ và hiển thị `requestId` trong error support path | Lượt 1 |
| FE-003 | P1 | Thêm live Backend browser integration gate | Lượt 0-2 |
| FE-004 | P1 | Nối Management Dashboard summary | Lượt 9 |
| FE-005 | P1 | Bổ sung management initial Customer password | Lượt 3A |
| FE-006 | P2 | Kiểm chứng Booking/Payment state transition với Backend thật | Lượt 7-8 |
| FE-007 | P2 | Bổ sung browser coverage cho management modules | Lượt 3-9 |
| FE-008 | P2 | Chuẩn hóa query key/invalidation xuyên module | Lượt 10-11 |
| FE-009 | P2 | Xử lý ineffective dynamic import và bundle baseline | Lượt 10 |
| FE-010 | P3 | Dọn page/export/file chỉ sau import-graph proof | Lượt 11 |

## 7. Quality gate cuối kế hoạch

Kế hoạch chỉ hoàn tất khi:

- [ ] Full generated OpenAPI contract được commit và drift check chạy trong CI.
- [ ] Core API response không còn type viết tay trùng contract.
- [ ] `requestId` có trong success/error diagnostic path.
- [ ] Mọi route có actor/role matrix và browser authorization evidence.
- [ ] Mọi module có loading/empty/error/success.
- [ ] Booking/Payment/Room mutation có conflict/idempotency/refetch test phù hợp.
- [ ] Dashboard dùng dữ liệu Backend thật.
- [ ] Critical journeys pass trên desktop và mobile Chromium.
- [ ] Critical integration subset pass với Backend test database an toàn.
- [ ] `typecheck`, `lint`, `test`, `build`, mocked E2E và live integration pass.
- [ ] Không còn P0/P1; P2/P3 còn lại có owner và lịch xử lý.
- [ ] Repository hygiene scan có bằng chứng trước mọi thao tác xóa.

## 8. Mẫu báo cáo cho từng lượt

```md
# FE Audit - Lượt X - Module

## Scope

## Backend contract

## Actor/role/ownership matrix

## Use cases and state transitions

## Capability matrix

| Capability | Status | Evidence | Gap | Fix |
|---|---|---|---|---|

## Defects fixed

## Tests added

## Commands and results

## Architecture/hygiene observations

## Deferred dependencies

## Exit decision

PASS | BLOCKED
```

## 9. Điểm bắt đầu đề xuất

Bắt đầu bằng Lượt 0, sau đó thực hiện ngay Lượt 1. Không bắt đầu Dashboard hoặc
thêm tính năng mới trước khi full generated contract và `requestId` path hoàn
tất, vì các module còn lại đang phụ thuộc type viết tay và có nguy cơ tích hợp
theo contract cũ.

# FE Audit - Lượt 7 - Booking

Ngày kiểm chứng: 2026-07-29

## Scope

- Customer search → create → list/detail → cancel.
- STAFF/ADMIN counter booking.
- Management lifecycle transition và conflict.
- Booking/Room/Payment query invalidation liên quan.

## Backend contract

| Capability | Method/path | Actor |
|---|---|---|
| Customer create/list/detail | `POST/GET /api/v1/bookings[/{id}]` | Customer owner |
| Customer cancel | `PATCH /api/v1/bookings/{id}/cancel` | Customer owner |
| Management create/list/detail | `POST/GET /api/v1/management/bookings[/{id}]` | ADMIN, STAFF |
| Management status | `PATCH /api/v1/management/bookings/{id}/status` | ADMIN, STAFF |

Booking request/query aliases derive from generated operation data types. Backend
OpenAPI metadata của `CancelBookingDto.reason` đã được sửa từ required sang
optional để khớp runtime, sau đó OpenAPI và FE contract được regenerate.

## Runtime truth confirmed

Counter booking hiện được Backend tạo ở `PENDING_PAYMENT + UNPAID` và có
`paymentExpiresAt`, không tự động thành `CONFIRMED + UNPAID`. STAFF/ADMIN có thể
yêu cầu chuyển sang `CONFIRMED`; Backend quyết định transition hợp lệ.

FE và test đã được đồng bộ theo runtime này, thay vì sửa Backend để khớp fixture
mock cũ.

## Design and architecture decisions

1. Bỏ helper FE tự tính allowed transition từ payment, ngày và nguồn tạo
   booking. Logic đó sao chép state machine Backend và có thể drift.
2. Management chọn trạng thái đích; copy giải thích Backend kiểm tra payment,
   ngày lưu trú, quyền và Room state. `409` được hiển thị và refetch detail,
   Payment cùng Room.
3. Hủy booking vẫn cần confirmation có booking code, khách, phòng, ngày, tiền
   và lý do.
4. Customer contact override chỉ được gửi khi đặt cho người khác; mặc định
   Backend dùng profile Customer.
5. Customer cancel và management status có success feedback.
6. Create/cancel/status tiếp tục invalidate Booking, Room và Payment queries
   liên quan; `409` dùng refetch authoritative state.

## Capability matrix

| Capability | Status | Evidence |
|---|---|---|
| Customer create với profile contact | PASS | Component/API + mocked/live browser |
| Contact override validation | PASS | Schema/component tests |
| List/detail/payment deadline | PASS | Existing UI/tests + live detail |
| Customer ownership/cancel | PASS | Backend tests + mocked/live browser |
| Counter booking bằng contact | PASS | Mocked/live browser |
| Counter-created Customer dependency | PASS | Live Backend journey |
| Management transition | PASS | Component/mock/live |
| Invalid transition `409` | PASS | Mocked browser + detail refetch |
| Cancel confirmation | PASS | Component + mocked/live browser |
| Room availability release after cancel | PASS | Backend service tests + subsequent live search |
| Check-in/check-out Room transition | PASS | Backend service tests |

## Defects fixed

- OpenAPI đánh dấu cancellation reason bắt buộc dù runtime cho phép bỏ trống.
- Booking request/query types còn viết tay trùng generated contract.
- FE sao chép state machine Booking và có nguy cơ ẩn/hiện action sai khi Backend
  đổi rule.
- Counter booking mock dùng `CONFIRMED` trong khi Backend thật trả
  `PENDING_PAYMENT`.
- Customer cancel và management transition thiếu success feedback rõ.
- Thiếu mocked management journey và live customer/counter journeys.

## Tests added or expanded

- `ManagementBookingDetailPage.test.tsx`
  - Confirmation safety.
  - Gửi trạng thái đích và success feedback.
  - Hiển thị authoritative `409`.
- `e2e/customer-booking.pw.ts`
  - Search → create bằng profile → cancel.
- `e2e/booking-management.pw.ts`
  - STAFF counter create.
  - Invalid transition `409` + detail refetch.
  - Confirm và cancel.
- `e2e-live/booking-journeys.pw.ts`
  - Register Customer thật.
  - ADMIN tạo Room fixture.
  - Counter create `PENDING_PAYMENT` → confirm → cancel.
  - Customer search → create online → cancel.

## Commands and results

| Command | Result |
|---|---|
| Backend `npm run openapi:generate` | PASS |
| FE `npm run contract:generate` / `contract:check` | PASS |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run test` | PASS, 45 files / 182 tests |
| `npm run build` | PASS, 286 modules |
| `npm run test:e2e` | PASS, 39 pass / 1 skip |
| Booking live journey | PASS, 1 |

Build vẫn còn FE-009 `INEFFECTIVE_DYNAMIC_IMPORT`, owner Lượt 10.

## Deferred dependencies

- Manual payment, VNPay, refund và payment idempotency thuộc Lượt 8.
- Cross-module query-key chuẩn hóa và full journey thuộc Lượt 10.

## Exit decision

`PASS`

Customer và counter main journeys, ownership, validation, cancel, lifecycle
conflict, authoritative Backend state và cross-module refetch đều có bằng chứng.
Lượt 8 - Payment được phép bắt đầu.

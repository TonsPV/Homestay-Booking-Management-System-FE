# FE Audit - Lượt 8 Payment, VNPay và refund

Ngày kiểm tra: 2026-07-29

## Phạm vi và quyết định thiết kế

- Giữ nguyên React Query, routing, shared UI và toàn bộ endpoint hiện có.
- Backend tiếp tục là nguồn quyết định duy nhất cho số tiền, payment status,
  booking status, quyền refund và lịch phòng.
- FE chỉ khóa thao tác trùng hoặc trạng thái hiển nhiên không thể thao tác;
  không lặp lại state machine refund của Backend.
- VNPay Return chỉ hiển thị thành công sau khi đọc được payment authoritative
  từ lịch sử booking. Query Return không tự thay đổi business state.
- Theo hướng dẫn `impeccable`, thay đổi UI chỉ tập trung vào trạng thái vận
  hành, phản hồi thành công/cảnh báo và khả năng chống double-submit; không
  redesign màn hình quản lý.

## Contract và API

### Backend

- `GET /api/v1/management/payments` bổ sung additive metadata
  `meta.staleRefundCount`.
  - Giá trị được Backend đếm trên toàn bộ payment `REFUND_PENDING` quá 7 ngày.
  - Không tính từ page hiện tại ở FE.
- OpenAPI của `RefundPaymentDto.reason` được sửa thành optional đúng với
  runtime validation hiện có.
- `ApiOkEnvelope` hỗ trợ một `metaModel` riêng cho response paginated mà
  không thay đổi contract của các endpoint khác.
- OpenAPI snapshot được generate lại.

### Frontend

- Request body và query Payment dùng alias trực tiếp từ generated OpenAPI:
  VNPay create, manual create, refund và payment list.
- FE không gửi `amount` khi tạo VNPay/manual payment.
- Refund và reconcile invalidate payment, booking và room queries vì Backend
  có thể hủy booking và giải phóng `RoomCalendar`.

## Customer VNPay

- Stable `Idempotency-Key` được lưu theo booking và replay cho pending attempt.
- Pending payment không có matching key trên thiết bị sẽ khóa request mới.
- Double-click bị khóa trong cả lúc request pending và lúc chuẩn bị redirect.
- Redirect chỉ dùng `paymentUrl` Backend trả về.
- Sửa race khi React remount:
  - Không xóa VNPay attempt ngay trên Return page.
  - Không xóa attempt terminal trong khoảng đang redirect.
  - Attempt được dọn khi booking page đọc được authoritative terminal history
    hoặc hết TTL.
- Return page giữ bounded polling và chỉ dùng payment history/booking response
  để kết luận `SUCCESS`, `FAILED`, `REQUIRES_REVIEW` hoặc refund state.

## Manual payment

- STAFF/ADMIN chỉ gửi `CASH` hoặc `BANK_TRANSFER` cùng stable key.
- Loading state khóa submit trùng.
- Sau response thành công, operator nhận thông báo rõ payment ID và booking
  được refetch; FE không tự set `PAID`.
- Manual payment bị khóa khi lịch sử chưa tải được hoặc còn VNPay `PENDING`.

## Refund và reconciliation

- Refund timeout/retry dùng lại cùng key theo payment trong 24 giờ.
- Key chỉ được xóa sau authoritative `REFUNDED`; `REFUND_PENDING` giữ key.
- Không có nút refund thứ hai khi payment là `REFUND_PENDING`; Admin chỉ có
  thao tác đối soát.
- Reconcile button có loading/disabled state theo đúng payment đang xử lý.
- Thành công, pending và lỗi đều có feedback riêng.
- STAFF xem được danh sách nhưng không thấy refund/reconcile actions.
- FE đã bỏ helper tự sao chép điều kiện booking/payment refund. Dialog nhắc rõ
  Backend kiểm tra quyền và trạng thái tại thời điểm xác nhận.
- Trang quản lý hiển thị chỉ báo refund quá 7 ngày từ contract và mở nhanh
  filter `VNPAY + REFUND_PENDING`.

## Bằng chứng kiểm thử

| Gate | Kết quả |
|---|---|
| Backend lint | PASS |
| Backend OpenAPI validate | PASS |
| Backend unit/service tests | PASS, 41 files / 279 tests |
| Backend build | PASS |
| FE contract check + negative contract test | PASS |
| FE typecheck | PASS |
| FE lint | PASS |
| FE unit/component | PASS, 46 files / 184 tests |
| FE build | PASS, 286 modules |
| Mocked browser | PASS, 45 pass / 1 skip |
| Payment mocked browser | PASS, 6 desktop/mobile |
| Live Backend Booking/Payment journey | PASS, 1 |

Mocked browser đã kiểm tra:

- Customer double-click VNPay chỉ tạo một request và có idempotency key.
- Return `PENDING` chỉ chuyển sang success khi payment history trả `SUCCESS`.
- Admin stale-refund indicator, refund, reconciliation và double-submit.
- STAFF không có quyền refund/reconcile.

Live Backend đã kiểm tra:

- ADMIN tạo counter booking.
- Ghi nhận CASH thật; Backend chuyển booking sang paid/confirmed.
- Refund manual thật; Backend chuyển payment sang refunded, booking sang
  cancelled và UI refetch trạng thái.

## Kết luận và phần hoãn đúng owner

Lượt 8 đạt exit gate: Payment status chỉ đến từ Backend; FE không dùng query
Return/provider để tự đánh dấu business success; Customer VNPay mô phỏng,
manual payment và refund journey đều pass.

Build vẫn có cảnh báo đã biết `INEFFECTIVE_DYNAMIC_IMPORT` của RoomType. Đây là
FE-009, owner Lượt 10; không sửa lan man trong Lượt 8.

Không commit hoặc push.

# FE Audit lượt 13 — Client feedback và tinh gọn giao diện

Ngày hoàn tất: 2026-08-01

## Kết luận

Frontend không còn dùng raw Backend/JavaScript message làm thông báo mặc định.
`requestId`, HTTP/gateway code và các thuật ngữ vận hành nội bộ đã được giữ lại
cho diagnostics nhưng không xuất hiện trong nội dung chính dành cho khách.

Các hành trình quan trọng đã có copy theo ngữ cảnh: đăng nhập/đăng ký, hồ sơ,
đổi mật khẩu, tạo/hủy đặt phòng, thanh toán, VNPay return, lịch phòng, tiện nghi
và tài khoản nhân viên. Trạng thái thanh toán chỉ được gọi là thành công sau khi
lịch sử có thẩm quyền từ Backend xác nhận.

## Priorities đã xử lý

| Priority | Vấn đề | Kết quả |
| --- | --- | --- |
| P0 | Raw Backend message và `requestId` đi thẳng ra UI | Transport giữ diagnostics riêng; global resolver chỉ trả copy an toàn theo error kind/status |
| P0 | VNPay Return hiển thị code, ID, polling/attempt và có thể báo thành công quá sớm | Giữ nguyên verification/polling nhưng gom UI thành các trạng thái dễ hiểu; chỉ authoritative payment history được xác nhận thành công |
| P0 | Customer dùng chung payment ledger kỹ thuật với management | Tách `CustomerPaymentHistory` và dùng đúng `CustomerPaymentDto`; gateway/reconciliation chỉ còn ở management |
| P1 | Cùng `409` bị hiểu sai thành phòng hết chỗ | Booking resolver chỉ dùng room-conflict copy khi tín hiệu thực sự liên quan phòng; unknown conflict dùng fallback an toàn |
| P1 | Thông báo không nói cách khắc phục | Thêm resolver theo feature cho auth, booking, customer, payment, room calendar, amenity và user |
| P1 | Tạo đặt phòng redirect nhưng không xác nhận kết quả | Thêm flash “Đã tạo đặt phòng” và nhắc thanh toán trước hạn |
| P1 | Khách hủy booking bằng một lần submit | Đổi thành CTA gọn + confirmation dialog có phòng, ngày lưu trú, hậu quả và lý do tùy chọn |
| P2 | Màn quầy tự nhân giá cơ sở với số đêm | Bỏ phép tính FE; chỉ hiển thị giá cơ sở và chờ tổng tiền Backend xác nhận |
| P2 | Booking/payment/customer view lặp hoặc lộ dữ liệu nội bộ | Bỏ booking code/hạn thanh toán lặp, customer ID, payment ID, mã phòng lặp và tên nhân viên khỏi customer view |
| P2 | Card hành động/summary không còn tác dụng vẫn được render | Ẩn payment action khi booking không thể thanh toán; chỉ render counter summary sau khi chọn phòng |
| P2 | Error state động thiếu semantics | `ErrorState` có `role="alert"`, live region, title cụ thể và retry khi an toàn |
| P2 | FE khai báo `code/details/fieldErrors` chưa tồn tại trong OpenAPI | Xóa phantom fields; contract hiện tại tiếp tục lấy từ generated types |

## Boundary hiện tại

```text
HTTP response
  → src/api/client.ts giữ status, retryAfter, requestId, raw server message
  → src/api/errors.ts tạo fallback an toàn, không render diagnostics
  → src/features/<domain>/errors.ts chọn copy và bước khắc phục theo tác vụ
  → page/component chọn Alert, ErrorState, dialog, inline field hoặc durable state
```

Raw server message hiện chỉ được phép dùng trong compatibility resolver có
whitelist/test. View không được gọi trực tiếp boundary này.

## UI đã loại bỏ hoặc giản lược

- Customer payment: ID giao dịch, gateway reference/code, transaction status,
  idempotency/replay/attempt và hướng dẫn đối soát.
- VNPay Return: `SUCCESS`, `PENDING`, payment ID, URL Return, Backend callback và
  polling diagnostics.
- Counter: tổng tiền tự tính, dòng phòng đã chọn lặp và summary rỗng toàn dấu
  gạch ngang.
- Booking detail: booking code lặp, hạn thanh toán lặp; customer chỉ thấy kênh
  “Đặt tại quầy/Đặt trực tuyến”, không thấy tên nhân viên nội bộ.
- Public/customer: ô “Mã phòng” lặp và “Mã khách hàng #ID”.
- Navigation: thống nhất “Khám phá phòng”, “Kiểm tra phòng trống” và “Đặt phòng
  của tôi”.

## Phần chưa nên tự suy đoán ở FE

Đây không phải source thừa; chúng cần Backend contract trước khi tiếp tục tinh
gọn:

1. **P1 — Capability đặt mật khẩu ban đầu:** booking DTO chưa cho biết khách đã
   có mật khẩu hay có đủ điều kiện. FE vẫn hiển thị tác vụ cho booking tại quầy
   và để Backend quyết định. Nên bổ sung capability như
   `canSetInitialPassword` để ẩn action không dùng được.
2. **P1 — Allowed booking transitions:** Backend chưa trả
   `allowedTransitions`. FE đã vô hiệu hóa no-op hiện tại nhưng chưa thể ẩn chắc
   chắn mọi transition không hợp lệ mà không nhân đôi business rule.
3. **P1 — Stable error contract:** Backend envelope chưa có `errorCode` và
   structured `fieldErrors`. Kế hoạch additive/migration nằm trong
   `docs/CLIENT_FEEDBACK_STANDARD.md`; cho đến khi có contract, exact-message
   maps chỉ là compatibility layer có test.

Không nên xóa payment polling, signature verification, idempotency storage,
management reconciliation details, role-filtered navigation hoặc confirmation
trước thao tác phá hủy. Đây là logic an toàn/vận hành có chủ đích, không phải UI
thừa.

## Verification

- Impeccable detector trên các view đã đổi: 0 finding.
- Typecheck và lint: pass.
- Architecture check: pass, không có source unreachable/import cycle/dependency
  thừa.
- Generated OpenAPI contract check và negative contract test: pass.
- Unit/component: pass toàn bộ suite.
- Production build: pass.
- Playwright E2E: 75 pass, 1 test mobile trùng phạm vi được skip theo config.

Chuẩn nội dung, placement, security boundary, Backend contract tương lai và test
matrix được lưu tại `docs/CLIENT_FEEDBACK_STANDARD.md`.

# FE Audit - Lượt 10 Cross-module hardening

Ngày kiểm tra: 2026-07-29

## Phạm vi và quyết định thiết kế

- Giữ nguyên React, React Router, React Query, React Hook Form, Zod, Tailwind
  và toàn bộ shared UI hiện có.
- Không thêm feature, không đổi API nghiệp vụ và không tạo state management
  mới.
- Backend tiếp tục là nguồn quyết định cho authorization, booking, payment,
  refund, room availability và dashboard.
- Theo hướng dẫn `impeccable`, các thay đổi UI chỉ tập trung vào khả năng phục
  hồi, focus, semantic state và responsive behavior; không redesign các module
  đã pass.
- Không commit hoặc push.

## Query ownership và invalidation xuyên module

Mỗi domain có query-key factory riêng:

- `amenityKeys`
- `bookingKeys`
- `dashboardKeys`
- `paymentKeys`
- `roomKeys`
- `roomTypeKeys`

Ma trận invalidation đã được chuẩn hóa:

| Mutation | Cache được làm mới |
|---|---|
| Tạo/hủy booking khách hàng | customer booking, room availability, dashboard; hủy làm mới thêm payment |
| Tạo/cập nhật booking quản lý | management/customer booking, room availability, dashboard |
| Manual payment | payment, booking, room availability, dashboard |
| Refund/reconcile | payment, booking, room availability, dashboard |
| Room status/block/unblock/create/update/delete | room và dashboard |
| Room image/cover | room |
| RoomType update/delete/restore/amenity assignment | room type và room |
| Amenity mutation | amenity, room type và room |

Test component xác minh trực tiếp các key quan trọng cho counter booking,
manual payment, calendar block và amenity update.

## Global failure handling

- `401` trên request có session hiện tại sẽ xóa auth/query cache và redirect về
  màn đăng nhập đúng actor.
- `403` giữ nguyên session và hiển thị permission error rõ ràng.
- `409` giữ message cùng `requestId` để hỗ trợ tra cứu.
- `429` đọc `Retry-After`, giữ nguyên dữ liệu form, khóa submit và hiển thị
  countdown.
- Network error và JSON malformed đều được normalize thành state có retry,
  không làm crash route.
- Backend CORS expose `Retry-After` và `X-Request-Id`; đây là điều kiện cần để
  browser FE khác origin đọc được hai header.

## Error boundary và runtime reporting

- App-level error boundary có heading semantic, tự focus khi crash và hai đường
  phục hồi: reload hoặc về trang chủ.
- Runtime error reporting bao phủ React boundary, global error và unhandled
  rejection.
- Reporter ưu tiên `sendBeacon`, fallback sang `fetch` có `keepalive` và không
  được phép phát sinh lỗi thứ hai.
- URL gửi lên reporter chỉ gồm origin + pathname, không chứa query string có
  thể mang dữ liệu nhạy cảm.
- Test xác minh reporter, focus recovery, beacon/fallback và tháo global
  listeners.

## Booking deadline hardening

Phát hiện và sửa một lỗi runtime thật:

- Browser giới hạn `setTimeout` ở `2,147,483,647 ms`.
- Deadline booking xa hơn khoảng 24.8 ngày trước đây bị integer overflow và có
  thể gọi expiry callback ngay, làm nút thanh toán bị khóa dù booking chưa hết
  hạn.
- Timer mới chia thành các chặng an toàn và chỉ phát expiry khi thời điểm thực
  sự đã tới.
- Unit test khóa regression cho deadline năm 2099.

## Responsive và accessibility

- Năm critical journey chạy trên desktop Chromium và mobile Chromium.
- Navigation drawer mobile được mở theo trạng thái hiển thị thực, không dựa
  vào DOM ẩn.
- Error boundary chuyển focus tới heading.
- Form được truy cập bằng label; status/alert được truy cập bằng role và text
  nghiệp vụ.
- Dialog/drawer hiện có tiếp tục pass focus trap, Escape và focus return.
- Public shell tiếp tục pass kiểm tra horizontal overflow ở các viewport bắt
  buộc.

## Bundle và lazy route

Đã xóa nguyên nhân `INEFFECTIVE_DYNAMIC_IMPORT`:

- Router lazy-load trực tiếp `RoomTypeManagementPage`.
- Barrel `room-types/index.ts` không còn static re-export page đó.
- Build không còn warning kiến trúc.

So sánh production bundle:

| Chỉ số | Baseline | Sau Lượt 10 | Thay đổi |
|---|---:|---:|---:|
| Main chunk raw | 499.40 kB | 351.64 kB | giảm khoảng 29.6% |
| Main chunk gzip | 150.36 kB | 106.27 kB | giảm khoảng 29.3% |
| RoomType management chunk | nằm trong main graph | 9.84 kB / 3.60 kB gzip | lazy riêng |

## Critical mocked journeys

1. Customer register → login → search → booking → VNPay create một lần với
   idempotency key → normalized return → payment `SUCCESS` từ lịch sử Backend.
2. STAFF login → counter booking → manual CASH payment → `CHECKED_IN` →
   `CHECKED_OUT`.
3. ADMIN login → tạo Amenity → tạo RoomType và gán amenity → tạo Room → upload
   ảnh → đổi cover → block calendar.
4. ADMIN khóa STAFF và CUSTOMER → request kế tiếp của phiên bị ảnh hưởng nhận
   `401`, clear session và redirect đúng login.
5. ADMIN refund VNPay → `REFUND_PENDING` → reconcile `REFUNDED` → payment và
   dashboard cache được refresh.

Tất cả chạy đạt trên desktop và mobile.

## Bằng chứng kiểm thử

| Gate | Kết quả |
|---|---|
| FE typecheck | PASS |
| FE lint | PASS |
| FE unit/component | PASS, 54 files / 210 tests |
| FE build | PASS, 297 modules, không warning |
| FE contract check | PASS |
| FE negative contract test | PASS |
| Mocked browser | PASS, 73 pass / 1 skip có chủ đích |
| Backend lint | PASS |
| Backend build | PASS |
| Backend CORS focused tests | PASS, 5 tests |
| Live Backend critical integration | PASS, đủ 12 journeys qua hai batch |

Live integration dùng:

- `NODE_ENV=test`
- API `http://127.0.0.1:3001`
- database `hbms_test`
- fixture ADMIN, STAFF và counter CUSTOMER được provision riêng.

Lần chạy tuần tự 12 live journeys đầu tiên đạt 11/12; journey cuối bị `429` vì
toàn bộ suite cố ý dùng rate limiter thật và đã tích lũy login theo IP. Sau khi
restart test server để reset bucket in-memory, journey user-management còn lại
đạt độc lập. Không hạ hoặc bypass rate limit của ứng dụng.

## Kết luận

Lượt 10 đạt exit gate:

- Đủ 5 critical journey mocked trên desktop/mobile.
- Critical integration subset với Backend test runtime đạt.
- Không còn P0/P1.
- Build không còn `INEFFECTIVE_DYNAMIC_IMPORT` hoặc warning kiến trúc chưa có
  lý do.
- Query invalidation, global failures, error boundary, runtime reporting và
  deadline timer có regression coverage.

Điểm dành cho Lượt 11: repository hygiene và cách shard live auth-heavy tests
để một lệnh full-suite không tự chạm rate limit thật của Backend.


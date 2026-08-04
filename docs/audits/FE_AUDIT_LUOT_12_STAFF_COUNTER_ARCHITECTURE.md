# FE Audit lượt 12 — Staff POS và chuẩn hóa kiến trúc

Ngày cập nhật: 2026-08-02

## Kết luận

STAFF có workspace vận hành riêng tại `/staff/*`. Màn đặt phòng tại quầy nằm ở
`/staff/counter` và sử dụng `StaffLayout` dạng POS, không còn nằm trong namespace
hoặc sidebar quản trị. ADMIN tiếp tục sử dụng `/management/*`.

Các trang phòng, booking và thanh toán tái sử dụng feature component và API hook,
nhưng được mount dưới shell và URL của STAFF. Cách này tách đúng trải nghiệm mà
không nhân đôi business rule hoặc query cache.

## Route contract

- `/staff/counter`: màn POS chính sau khi STAFF đăng nhập.
- `/staff/rooms`: vận hành phòng tại quầy.
- `/staff/bookings` và `/staff/bookings/:bookingId`: danh sách và xử lý booking.
- `/staff/payments`: theo dõi thanh toán tại quầy.
- `/management/*`: workspace quản trị dành cho ADMIN.

## Quyết định kiến trúc

- `StaffLayout` dùng command bar ngang trên desktop và thanh tác vụ đáy trên mobile.
- `staff-policy.ts` sở hữu path, navigation và quyền của workspace STAFF.
- `management-policy.ts` chỉ sở hữu workspace ADMIN.
- `workspace-policy.ts` quyết định landing/return URL theo principal và chặn deep-link
  vượt namespace.
- Các page nghiệp vụ vẫn nằm đúng feature domain; route và layout không chứa business
  rule của Backend.

## Backend contract

`GET /management/rooms/available` tiếp tục là endpoint nghiệp vụ dùng chung cho
ADMIN/STAFF. Việc tách `/staff/*` là kiến trúc frontend, không tạo API trùng lặp.
Backend vẫn là nguồn sự thật cho availability, trạng thái booking và thanh toán.

## Verification

Chạy `architecture:check`, typecheck, lint, unit/component, E2E và build sau mỗi thay
đổi route để bảo vệ redirect đăng nhập, role guard, desktop/mobile shell và hành trình
đặt phòng → booking → thanh toán tại quầy.

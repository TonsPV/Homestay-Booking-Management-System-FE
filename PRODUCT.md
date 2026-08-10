# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Khách hàng đang tìm chỗ lưu trú, kiểm tra phòng còn phù hợp, tạo booking,
  thanh toán và theo dõi hành trình đặt phòng.
- Nhân viên vận hành (`STAFF`) quản lý phòng, booking và thanh toán tại quầy.
- Quản trị viên (`ADMIN`) quản lý toàn bộ vận hành, danh mục, nhân viên và khách
  hàng.

## Product Purpose

Homestay Green kết nối hành trình tìm phòng và đặt phòng của khách với hệ thống
vận hành nội bộ. Thành công nghĩa là khách có thể tìm đúng phòng đang sẵn sàng,
đặt và thanh toán rõ ràng; nhân viên có thể xử lý booking, phòng và giao dịch
trong cùng một hệ thống nhất quán với Backend.

## Positioning

Sản phẩm kết hợp giao diện booking dành cho khách với công cụ vận hành
homestay dành cho STAFF/ADMIN trên cùng nguồn dữ liệu và quy trình nghiệp vụ.
Điểm khác biệt sản phẩm ngoài cơ chế tích hợp này hiện chưa được xác nhận.

## Operating Context

- Khách sử dụng public catalog, tìm phòng theo kỳ nghỉ, xem chi tiết, đăng nhập,
  tạo booking, thanh toán VNPay và theo dõi booking.
- STAFF/ADMIN sử dụng management workspace để quản lý Room, RoomType, Amenity,
  Booking, Payment, Customer và User theo quyền.
- Backend là nguồn sự thật cho quyền truy cập, giá, availability, booking state,
  payment state và refund state.
- Giao diện và nội dung chính sử dụng tiếng Việt.

## Capabilities and Constraints

- React/Vite frontend tích hợp NestJS Backend qua versioned REST API.
- Backend OpenAPI và response runtime là contract nguồn.
- Không thay UI library hoặc state management nếu không có quyết định sản phẩm
  mới.
- RoomType tiếp tục là Backend entity phục vụ CRUD và phân loại, nhưng trên
  public frontend chủ yếu xuất hiện như filter hoặc context cho Room.
- Payment success chỉ được xác nhận bằng trạng thái Backend, không dựa riêng vào
  query trả về từ VNPay.
- Mọi module cần loading, empty, error, success, validation và browser evidence
  phù hợp trước khi được đánh dấu `PASS`.

## Brand Commitments

- Tên thương hiệu được xác nhận: **Homestay Green**.
- Không tiếp tục dùng “Homestay Booking” làm tên thương hiệu hiển thị trong các
  thay đổi UI mới.
- Chưa có logo, tagline hoặc tuyên bố tiếp thị chính thức được xác nhận.
- Public marketing surfaces follow a premium boutique-hospitality standard:
  immersive real property imagery, a clear booking action, restrained neutral
  surfaces, and familiar patterns comparable in craft to Airbnb, Booking.com,
  Apple, Stripe, Linear, Notion, and Vercel.

## Evidence on Hand

- Source code và test hiện có trong repository.
- Backend OpenAPI tại
  `../homestay-booking-management-system-api/openapi/openapi.json`.
- Execution plan tại `docs/FRONTEND_MODULE_BY_MODULE_EXECUTION_PLAN.md`.
- Chưa có testimonial, giải thưởng, đối tác, số liệu kinh doanh hoặc nội dung
  marketing được xác nhận; các bằng chứng này không được tự tạo.

## Product Principles

1. Availability và trạng thái Backend phải đáng tin hơn suy đoán phía client.
2. Khách cần đi từ tìm phòng đến booking với ít bước và ít mơ hồ.
3. Giao diện vận hành phải scan nhanh, nhất quán và tôn trọng quyền actor/role.
4. Trạng thái thanh toán, refund và booking phải giải thích được và truy vết
   được.
5. Thay đổi được thực hiện theo module, có contract và test bảo vệ.

## Accessibility & Inclusion

- Public và management flows phải dùng được trên desktop và mobile.
- Form cần label, error liên kết đúng; trạng thái động cần thông báo phù hợp cho
  assistive technology.
- Keyboard, focus, dialog, text overflow và reduced motion phải được kiểm tra
  trong các lượt UI liên quan.

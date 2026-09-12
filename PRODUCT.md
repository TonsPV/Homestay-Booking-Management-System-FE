# Sản phẩm Homi Stay

<!-- impeccable:product-schema 1 -->

## Nền tảng

Ứng dụng web.

## Người dùng

- Khách hàng tìm chỗ lưu trú, kiểm tra phòng trống, đặt phòng, thanh toán và theo dõi kỳ nghỉ.
- Nhân viên (`STAFF`) vận hành phòng, đặt phòng và thanh toán tại quầy.
- Quản trị viên (`ADMIN`) quản lý vận hành, danh mục, nhân viên và khách hàng.

## Mục đích sản phẩm

Kết nối hành trình đặt phòng của khách với vận hành nội bộ. Khách tìm đúng phòng,
đặt và thanh toán rõ ràng; nhân viên xử lý phòng, đặt phòng và giao dịch trong cùng
hệ thống nhất quán với Backend.

## Định vị

Giao diện đặt phòng và công cụ vận hành homestay dùng chung dữ liệu và quy trình.
Điểm khác biệt sản phẩm ngoài sự tích hợp này chưa được xác nhận.

## Bối cảnh sử dụng

Khách xem danh sách phòng, tìm theo kỳ nghỉ, xem chi tiết, đăng nhập, đặt phòng,
thanh toán VNPay và theo dõi đặt phòng. Nhân viên và quản trị viên có không gian
riêng theo quyền để xử lý phòng, loại phòng, tiện nghi, đặt phòng, thanh toán và tài khoản.
Giao diện và nội dung chính dùng tiếng Việt.

## Khả năng và giới hạn

- Frontend React/Vite tích hợp Backend NestJS qua REST API có phiên bản.
- OpenAPI và phản hồi thực tế của Backend là hợp đồng nguồn; Backend quyết định
  quyền, giá, phòng trống, trạng thái đặt phòng, thanh toán và hoàn tiền.
- Không thay thư viện giao diện hoặc quản lý trạng thái khi chưa có quyết định sản phẩm mới.
- Loại phòng vẫn là thực thể quản trị, nhưng phía khách chủ yếu là bộ lọc và thông tin của phòng.
- Thành công thanh toán phải được Backend xác nhận; tham số VNPay không đủ làm bằng chứng.
- Tính năng cần trạng thái tải/rỗng/lỗi/thành công, kiểm tra biểu mẫu và bằng chứng
  trình duyệt phù hợp trước khi ghi nhận đạt.

## Cam kết thương hiệu

- Tên xác nhận: **Homi Stay**; không dùng “Homestay Booking” làm tên hiển thị mới.
- Chưa xác nhận logo, khẩu hiệu hay tuyên bố tiếp thị chính thức.
- Trang giới thiệu hướng đến chất lượng lưu trú boutique: ảnh cơ sở thật, hành động
  đặt phòng rõ ràng, nền trung tính tiết chế và tương tác quen thuộc. Mức hoàn thiện
  tham khảo Airbnb, Booking.com, Apple, Stripe, Linear, Notion và Vercel.

## Bằng chứng sẵn có

- Mã nguồn, kiểm thử và OpenAPI tại repo Backend liền kề.
- [Kiến trúc hiện tại](docs/architecture/system-overview.md) và
  [kế hoạch kiểm chứng](docs/plans/implementation-plan.md).
- Chưa có lời chứng thực, giải thưởng, đối tác, số liệu kinh doanh hoặc nội dung
  tiếp thị được xác nhận; không tự tạo các bằng chứng đó.

## Nguyên tắc sản phẩm

1. Tin phòng trống và trạng thái Backend hơn suy đoán của trình duyệt.
2. Giảm bước và sự mơ hồ từ tìm phòng đến đặt phòng.
3. Giao diện vận hành dễ quét, nhất quán và tôn trọng quyền.
4. Trạng thái giao dịch phải giải thích và truy vết được.
5. Thay đổi theo tính năng, có hợp đồng và kiểm thử bảo vệ.

## Khả năng tiếp cận

Dùng được trên máy tính và di động. Biểu mẫu có nhãn, lỗi liên kết đúng trường;
trạng thái động thông báo cho công nghệ hỗ trợ. Kiểm tra bàn phím, điểm tập trung,
hộp thoại, chữ tràn và chế độ giảm chuyển động trong mỗi đợt thay đổi liên quan.

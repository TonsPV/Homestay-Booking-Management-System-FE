# Hướng dẫn tác nhân cho HBMS Frontend

Frontend React/Vite theo quy trình cục bộ lấy cảm hứng từ ECC. Giao diện quản lý
phải thực dụng và phù hợp hợp đồng Backend.

## Kiến trúc

- Mã tính năng nằm trong `src/features/<domain>`; thành phần dùng chung ở `src/shared`.
- Hành vi HTTP thuộc `src/api` và tệp `api.ts` của từng tính năng.
- Ưu tiên kiểu sinh từ OpenAPI; không nhân đôi quy tắc nghiệp vụ Backend, ngoại trừ
  kiểm tra biểu mẫu và vô hiệu hóa thao tác để hỗ trợ người dùng.
- Backend là nguồn quyết định cho xác thực, giá, trạng thái đặt phòng/thanh toán và phòng trống.

## Định hướng giao diện

- Trang quản lý cần gọn, bình tĩnh, dễ quét; không dùng bố cục trang quảng bá.
- Dùng thành phần chung sẵn có trước khi tạo thành phần mới; giữ nhất quán nút,
  bảng, biểu mẫu, hộp thoại, bộ lọc và nhãn trạng thái.
- Di động phải dùng được; chữ không tràn nút hoặc thẻ.
- Mọi thao tác phá hủy hoặc tài chính dùng `variant="danger"` cùng
  `ConfirmationDialog tone="danger"`; không dùng `window.confirm` hoặc nút dạng `ghost`.
- Màu trạng thái theo [DESIGN.md](DESIGN.md): `warning` khi cần chú ý hoặc có nguy cơ
  quá thời hạn; `danger` chỉ cho thất bại, không hợp lệ hoặc cần can thiệp ngay.
  `REFUND_PENDING` quá thời hạn dùng `warning`.
- Chữ quản lý đậm tối đa `font-bold`; `font-black` chỉ dành cho chữ thương hiệu.
- Mẫu tham chiếu: `ManagementDashboardPage` cho tổng quan và
  `ManagementPaymentsPage` cho danh sách nghiệp vụ. Tái sử dụng quy tắc của hai mẫu.
  Dashboard hiện tạm ngưng tuyến/API; giữ vai trò mẫu, không tự mở lại tuyến.
- Danh sách quản lý trên di động dùng thẻ xếp dọc ưu tiên tác vụ, không sao nguyên cột máy tính.
- Tạo/sửa/ảnh phòng có tuyến riêng: `/management/rooms/new`,
  `/management/rooms/:id/edit`, `/management/rooms/:id/images`; danh sách ưu tiên tra cứu.
- Danh sách thanh toán tối đa sáu cột; thông tin kỹ thuật và đối soát nằm tại
  `/management/payments/:id`.

## Danh sách kiểm tra tính năng

1. Xác nhận tuyến Backend, loại tài khoản, nội dung yêu cầu và phản hồi.
2. Cập nhật hoặc sinh kiểu API.
3. Thêm lược đồ kiểm tra biểu mẫu.
4. Thêm hook React Query khi tải hoặc thay đổi dữ liệu.
5. Chỉ cập nhật giao diện trước phản hồi khi đã rõ cách hoàn tác.
6. Có trạng thái đang tải, rỗng, lỗi và thành công.
7. Thêm kiểm thử đơn vị/thành phần cho kiểm tra dữ liệu, hiển thị và thao tác quan trọng.
8. Thêm Playwright E2E cho hành trình quan trọng.

## Đặt phòng và thanh toán

- Tham số trên trang quay về VNPay là đầu vào không đáng tin.
- Thành công thanh toán phải được Backend xác nhận, không chỉ dựa vào trình duyệt quay về.
- `REFUND_PENDING` bình thường khi VNPay còn chờ xử lý/xem xét.
- Làm mới phòng trống sau tạo, hủy, hết hạn, thanh toán hoặc hoàn tiền có thể ảnh hưởng
  quyết định của người dùng.

## Lệnh kiểm tra

- Kiến trúc: `npm run architecture:check`.
- Kiểu dữ liệu: `npm run typecheck`.
- Quy tắc mã: `npm run lint`.
- Đơn vị/thành phần: `npm run test`.
- Trình duyệt: `npm run test:e2e`.
- Sinh hợp đồng: `npm run contract:generate`.
- Bản dựng: `npm run build`.

## Chính sách hợp đồng và tài liệu

- Khi OpenAPI Backend đổi, chạy `npm run openapi:generate` ở Backend rồi
  `npm run contract:generate` ở Frontend.
- Khi kiểu sinh tự động đã bao phủ API, ưu tiên xóa kiểu phản hồi viết tay trùng lặp.
- Không sửa tay tệp trong `src/api/generated`.
- Tài liệu viết bằng tiếng Việt; giữ nguyên định danh kỹ thuật và lệnh.
  Tra cứu chủ đề tại [mục lục](docs/README.md); cập nhật tài liệu chủ thay vì tạo bản lặp.

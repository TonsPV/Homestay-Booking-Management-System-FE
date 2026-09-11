# Lịch sử kiểm tra Frontend

Tổng hợp ngày 2026-09-10 từ 15 báo cáo lượt 0–13 (lượt 3 tách A/B), vấn đề BE-001
và các kế hoạch cũ. Kết quả dưới đây **do báo cáo gốc ghi nhận**, không phải các lệnh
được chạy lại trong đợt dọn tài liệu. Giữ các quyết định và mốc kiểm chứng có giá trị;
bỏ danh sách tệp, lệnh lặp, trạng thái Git tạm thời và chỉ dẫn bắt đầu lượt kế tiếp.

## Các mốc và bằng chứng

| Lượt/ngày | Nội dung và kết quả gốc | Kiểm thử Frontend được ghi nhận |
| --- | --- | --- |
| 0 — 2026-07-29 | Lập mốc nền, ba tầng kiểm thử; trình chạy Backend thật yêu cầu `test`/`_test`; chưa tạo điểm lưu Git theo phạm vi lúc đó | 41 tệp/161 ca; trình duyệt mô phỏng 13 đạt, 1 bỏ qua; 1 hành trình Backend thật |
| 1 — 2026-07-29 | Sinh toàn bộ kiểu OpenAPI, kiểm tra lệch hợp đồng, kiểm thử phá trường bắt buộc `requestId`; sửa mô tả trường rỗng và kiểu literal ở Backend | 41/161; mô phỏng 13 đạt, 1 bỏ qua; 1 hành trình thật |
| 2 — 2026-07-29 | Xác thực khách/STAFF/ADMIN, khôi phục phiên, xóa phiên và bộ nhớ đệm khi `401`; giữ phiên khi `403`; đăng xuất cục bộ | 41/163; mô phỏng 21 đạt, 1 bỏ qua; 4 hành trình thật |
| 3A — 2026-07-29 | Hồ sơ, đổi mật khẩu và thu hồi phiên; ADMIN khóa/mở khách, đặt mật khẩu ban đầu; không lưu mật khẩu trong URL/bộ nhớ đệm/nhật ký | 41/165; mô phỏng 23 đạt, 1 bỏ qua; 2 hành trình khách thật |
| 3B — 2026-07-29 | ADMIN quản lý nhân viên; lọc rõ trường gửi API, không để vai trò ngoài hợp đồng lọt qua; kiểm tra tự khóa và STAFF bị từ chối | 43/170; mô phỏng 27 đạt, 1 bỏ qua; 1 hành trình thật |
| 4 — 2026-07-29 | Tiện nghi: tạo/sửa/xóa mềm/khôi phục, trùng tên và đang sử dụng; không suy ra quan hệ từ nhãn hoạt động | 43/171; mô phỏng 29 đạt, 1 bỏ qua; 1 hành trình thật |
| 5 — 2026-07-29 | Bỏ trang loại phòng công khai không dùng, giữ chuyển hướng sang phòng; giá chuỗi thập phân, gán nguyên tập tiện nghi | 44/181; mô phỏng 33 đạt, 1 bỏ qua; 1 hành trình thật |
| 6 — 2026-07-29 | Phòng: tìm theo ngày/khách/tiện nghi đồng thời, ảnh hỏng có thay thế, tải ảnh/ảnh bìa, lịch `RESERVED`/`BLOCKED`, xung đột tải lại | 45/186; mô phỏng 37 đạt, 1 bỏ qua; 1 hành trình phòng thật |
| 7 — 2026-07-29 | Đặt phòng khách và tại quầy, liên hệ thay thế, hủy/xung đột; bỏ máy trạng thái tự viết phía Frontend; lý do hủy tùy chọn khớp Backend | 45/182; mô phỏng 39 đạt, 1 bỏ qua; 1 hành trình đặt phòng thật |
| 8 — 2026-07-29 | VNPay, thu tiền tại quầy, chống xử lý lặp, hoàn tiền/đối soát; chỉ xác nhận từ Backend, chỉ báo hoàn tiền quá hạn lấy từ dữ liệu tổng hợp | 46/184; mô phỏng 45 đạt, 1 bỏ qua; 1 hành trình đặt phòng/thanh toán thật |
| 9 — 2026-07-29 | Dashboard từng tích hợp API tổng hợp, ngày báo cáo, doanh thu/công suất và hàng chờ; dữ liệu bằng 0 không là lỗi | 49/195; mô phỏng 49 đạt, 1 bỏ qua; 4 hành trình xác thực/dashboard thật |
| 10 — 2026-07-29 | Làm mới truy vấn liên tính năng, lỗi toàn cục, báo cáo lỗi, khả năng tiếp cận; sửa bộ hẹn giờ hạn xa và cảnh báo tải mô-đun động | 54/210; mô phỏng 73 đạt, 1 bỏ qua; 12 hành trình thật qua các đợt |
| 11 — 2026-07-29 | Thêm kiểm tra kiến trúc, bỏ mã không được dùng và MSW; sửa dừng tiến trình Vite trên Windows, chia kiểm thử đăng nhập để không vượt giới hạn thật | 54/210; mô phỏng 73 đạt, 1 bỏ qua; 12 hành trình thật qua các đợt |
| BE-001 — 2026-08-01 | Đã nối API phòng trống quản lý, kiểu `RoomManagementAvailableData` và bộ chọn phòng tại quầy; tránh gọi lịch từng phòng | Báo cáo ghi hoàn tất tiêu chí API/quyền/xung đột; không có tổng số kiểm thử riêng |
| 12 — 2026-08-02 | Tách `/staff/*`, `StaffLayout`, chính sách điều hướng nhân viên/quản trị; tái sử dụng tính năng/API, không nhân đôi nghiệp vụ | Báo cáo nêu lệnh cần chạy, không ghi kết quả cụ thể; không suy thành đạt |
| 13 — 2026-08-01 | Nội dung tiếng Việt an toàn, tách lịch sử thanh toán khách, xác nhận hủy, bỏ tổng tiền quầy tự tính và thông tin kỹ thuật thừa | Ghi kiểm tra kiểu/quy tắc mã/kiến trúc/hợp đồng/đơn vị/bản dựng đạt; mô phỏng 75 đạt, 1 bỏ qua |

Lượt 0–11 ghi các cổng kiểm tra kiểu dữ liệu, quy tắc mã và bản dựng đạt trong phạm
vi từng lượt. Số kiểm thử ở lượt 6 và 7 không tăng liên tục; giữ nguyên số gốc, không
suy diễn thiếu kiểm thử hay hồi quy. Ngày lượt 12/13 cũng giữ đúng nguồn, không tự sắp lại.

## Quyết định kỹ thuật cần lưu

- Bộ sinh OpenAPI thay thế kiểu phản hồi viết tay; kiểm tra âm cố ý phá trường bắt
  buộc phải phát hiện lệch. Trường mật khẩu đầu vào dùng kiểu ghi được sinh từ đặc tả.
- Khôi phục phiên qua Backend; đổi tài khoản/đăng xuất xóa bộ nhớ đệm riêng tư.
  Không tự thêm làm mới token hoặc API đăng xuất khi chưa có hợp đồng.
- Loại phòng công khai là bộ lọc/ngữ cảnh của phòng; không giữ trang chết và chuyển
  hướng song song. Giá giữ chuỗi thập phân; ngày thuần không đổi múi giờ.
- Lịch khóa dùng khoảng `[from, to)`; mở khóa không được xóa đêm đã đặt.
  Xung đột cũng phải tải lại lịch và phòng trống.
- Ở lượt 7, Backend tạo đặt phòng tại quầy ở `PENDING_PAYMENT + UNPAID` có hạn trả
  tiền, khác dữ liệu mô phỏng cũ. Luôn theo phản hồi/hợp đồng hiện tại, không ép Backend
  khớp dữ liệu mẫu lịch sử.
- Khóa chống xử lý lặp được tái sử dụng khi kết quả chưa rõ. `REFUND_PENDING` giữ
  trạng thái chờ và đường đối soát; Frontend không tự đặt `PAID` hoặc `REFUNDED`.
- Bộ hẹn giờ JavaScript có giới hạn `2,147,483,647 ms`; hạn xa chia thành chặng để
  tránh báo hết hạn ngay. Báo cáo lượt 10 ghi kiểm thử hồi quy với năm 2099.
- Báo cáo lỗi chỉ gửi địa chỉ trang không có chuỗi truy vấn nhạy cảm; lỗi của bộ báo
  cáo không được gây lỗi thứ hai. Gặp `429` giữ biểu mẫu và tôn trọng `Retry-After`.
- Lượt 10 ghi kích thước phần JavaScript chính từ 499,40 xuống 351,64 kB; nén từ
  150,36 xuống 106,27 kB. Đây là phép so sánh cũ, không phải ngân sách bản dựng hiện tại.

## Những kết luận đã được thay thế

| Ghi chú cũ | Thông tin dùng hiện nay |
| --- | --- |
| STAFF/ADMIN cùng vào `/management`; đăng nhập tách trang | Không gian STAFF riêng, `/login` chung; chính sách hiện tại trong tài liệu kiến trúc |
| ADMIN mặc định `/management/dashboard`; dashboard đang chạy | Dashboard tạm ngưng; ADMIN về `/management/bookings` |
| Hiển thị nguyên lỗi Backend và `requestId` | Chỉ hiển thị nội dung an toàn qua hàm xử lý; dữ liệu tra cứu tách riêng |
| Chưa có mã lỗi/capability, dùng bảng so khớp thông báo | Đặc tả đã có `errorCode`, `fieldErrors`, `credentialCapabilities`, `transitionCapabilities` |
| Chưa có tuyến tạo/sửa phòng và chi tiết thanh toán | Tuyến đã có; chi tiết thanh toán còn hạn chế lấy dữ liệu cần kiểm chứng |
| Cảnh báo tải mô-đun động phải chờ lượt 10 | Lượt 10 đã ghi nhận xử lý; không giữ làm việc tồn đọng |
| Ba kiểm thử nền lỗi và không được sửa | Chưa được xác nhận lại hôm nay; không phải ngoại lệ lâu dài |
| Phần lớn mã chưa được Git theo dõi | Trạng thái tạm thời của lần kiểm tra cũ; dùng `git status` khi làm việc |

Xem [kiến trúc](../architecture/system-overview.md), [việc còn lại](../plans/implementation-plan.md)
và [chuẩn phản hồi](../CLIENT_FEEDBACK_STANDARD.md) để lấy quy tắc hiện hành.
Báo cáo bảo mật được [giữ riêng](../security/FRONTEND_SECURITY_AUDIT_2026-07-30.md)
vì có phát hiện và giới hạn kiểm chứng đặc thù.

## Bằng chứng giao diện trang chủ

Giữ 16 ảnh PNG và [báo cáo JSON gốc](homepage-qa/report.json) trong `homepage-qa/`:

- Ảnh đầu/giữa/cuối tại 375×812, 640×900, 768×1024, 1024×768 và 1440×900.
- Một ảnh chế độ giảm chuyển động: [xem ảnh](homepage-qa/home-reduced-motion.png).
- JSON ghi không cuộn ngang toàn trang, không thông báo lỗi/cảnh báo console, một
  tiêu đề cấp 1 tại năm kích thước; có số đo phần tử vượt khung được cắt bởi vùng cha.
- Có dữ liệu kiểm tra biểu mẫu, tham số tìm phòng, thứ tự bàn phím và chế độ giảm
  chuyển động. Không suy từ JSON rằng mọi chỉ báo tập trung đều đạt.

Script tạo bằng chứng: `scripts/qa-homepage.mjs`, đích xuất vẫn là thư mục này.
JSON không ghi đầy đủ thời điểm và nguồn dữ liệu; ảnh/báo cáo là bằng chứng lịch sử,
không chứng nhận giao diện hiện tại. Không dịch khóa JSON hoặc chỉnh chữ trong ảnh
vì đó là dữ liệu máy và ảnh chụp gốc.

# Kiểm tra bảo mật Frontend — 2026-07-30

Đây là **báo cáo lịch sử**, biên tập gọn ngày 2026-09-10. Các kết quả, phiên bản và
lỗi công cụ dưới đây được giữ theo lần kiểm tra gốc; chưa quét bảo mật lại trong
đợt dọn tài liệu. Không dùng chúng để kết luận mức an toàn hoặc tình trạng lỗ hổng hiện tại.

## Phạm vi và phương pháp

Kiểm tra phụ thuộc, xác thực/token, HTTP, chuyển hướng, trang quay về VNPay, ảnh/tệp
tải lên, vị trí có thể thực thi mã, bí mật và cấu hình chạy. Backend quyết định
quyền, giá, đặt phòng, thanh toán và chữ ký VNPay.

Báo cáo gốc ghi đã chuẩn bị công cụ Codex Security ngoài phụ thuộc chạy ứng dụng.
Quét đầy đủ bị chặn trước phân tích trên Windows với phiên bản 0.1.3 và 0.1.4:

```text
Invalid Codex plugin directory: .../@openai/codex-security/_bundled_plugin
```

Không sửa gói bên thứ ba để bỏ kiểm tra. Bằng chứng khi đó dựa vào `npm audit`, tìm
kiếm mã tĩnh, kiểm tra hợp đồng, đơn vị/thành phần, Playwright và trình duyệt cục bộ;
không được ghi rằng Codex Security đã quét thành công.

## Phát hiện và xử lý được ghi nhận

| Mức | Phát hiện | Kết quả của lần kiểm tra gốc |
| --- | --- | --- |
| Cao | Cấu hình sai có thể gửi token hoặc dấu vết lỗi qua HTTP | Đã yêu cầu HTTPS cho API/báo cáo lỗi từ xa; HTTP chỉ cho địa chỉ máy cục bộ |
| Cao theo cảnh báo phụ thuộc | React Router RSC CSRF, `GHSA-qwww-vcr4-c8h2` | Ghi nhận nâng lên 7.18.2; ứng dụng Vite kết xuất phía trình duyệt, không dùng RSC |
| Cao/trung bình, công cụ phát triển | `js-yaml` có vấn đề từ chối dịch vụ và chuỗi nguyên mẫu trong bộ sinh OpenAPI | Ghi nhận nâng `@hey-api/openapi-ts` lên 0.97.3 và ghi đè `js-yaml` 4.3.0; đây là phiên bản lịch sử |
| Trung bình | Chuyển thẳng tới `paymentUrl` từ API | Chỉ nhận URL HTTPS tuyệt đối, không thông tin đăng nhập; HTTP chỉ máy cục bộ cho phát triển/kiểm thử |
| Trung bình, còn lại | Token lưu trong `sessionStorage`/`localStorage` | Cần phối hợp Backend nếu đổi sang cookie `Secure`, `HttpOnly`, kèm SameSite và chống CSRF |
| Trung bình, còn lại | Repo chưa quản lý tiêu đề bảo mật môi trường triển khai | Cần xác minh/cấu hình tại máy chủ trung gian hoặc CDN |
| Thấp, còn lại | URL ảnh HTTP(S) bên ngoài có thể theo dõi IP/thông tin trang giới thiệu | Ảnh từ Backend; giao diện đã chặn giao thức thực thi mã |

Ở lần kiểm tra gốc, `npm audit` còn báo hai mục mức cao của React Router dù báo cáo
cho rằng nhánh 7.18.2 đã được vá theo nhà duy trì. Đây là khác biệt được ghi nhận
lúc đó, không phải kết luận mới về cơ sở dữ liệu cảnh báo. Muốn quyết định nâng phiên
bản hôm nay phải kiểm tra lại phụ thuộc và thông báo hiện hành; không áp dụng máy móc
kết quả cũ hoặc dùng `npm audit fix --force` để ép bỏ cảnh báo.

## Bằng chứng mã nguồn của lần kiểm tra gốc

- Không tìm thấy `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function` hoặc
  `document.write` trong mã chạy ứng dụng.
- Không tìm thấy khóa riêng, khóa dịch vụ hoặc JWT thật trong mã nguồn; dữ liệu mật
  khẩu/token tìm được thuộc kiểm thử. Đây là phạm vi tìm kiếm đã ghi nhận, không phải
  bảo đảm tuyệt đối hoặc kết quả quét lại.
- `.env` và `.env.*` bị bỏ qua, ngoại trừ `.env.example`.
- Đích sau đăng nhập chỉ nhận đường dẫn cục bộ an toàn; token chỉ gắn với API gốc đã cấu hình.
- Tham số VNPay không quyết định thành công; lịch sử thanh toán Backend xác nhận.
- URL ảnh chỉ nhận HTTP(S), tệp có giới hạn loại/kích thước phía giao diện và vẫn phải
  được Backend kiểm tra.
- Báo cáo lỗi không gửi chuỗi truy vấn; kết quả quét nhạy cảm không đưa vào Git.

## Kiểm thử được báo cáo

| Hạng mục | Kết quả lịch sử |
| --- | --- |
| Kiến trúc, hợp đồng và kiểm thử hợp đồng âm | Đạt |
| Kiểm tra kiểu, quy tắc mã, bản dựng | Đạt |
| Đơn vị/thành phần | 56 tệp, 226 ca đạt |
| Trình duyệt mô phỏng | 73 đạt, 1 bỏ qua theo cấu hình |
| Trình duyệt cục bộ | Trang chủ không cuộn ngang/lỗi console; chuỗi HTML trên URL VNPay không tạo phần tử hoặc sự kiện; trang quay về không tin URL để kết luận thanh toán |

## Việc cần xác minh tiếp

1. Tiêu đề bảo mật theo địa chỉ triển khai thực tế: CSP, HSTS,
   `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
2. Chính sách token/cookie cùng Backend, bao gồm SameSite và chống CSRF nếu thay đổi.
3. Quét lại bằng công cụ hoạt động trên môi trường hiện tại, giữ nguyên bước kiểm
   tra hợp lệ của công cụ; cập nhật kết quả phụ thuộc từ bản thực cài.

Theo dõi tại [kế hoạch chung](../plans/implementation-plan.md), không tạo danh sách
việc bảo mật trùng ở tài liệu hiện trạng.

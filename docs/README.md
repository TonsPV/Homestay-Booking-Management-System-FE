# Mục lục tài liệu HBMS Frontend

Rà soát và tinh gọn ngày **2026-09-10**. Phạm vi: toàn bộ 27 tệp Markdown trong
`docs/`, 4 tài liệu gốc và bộ bằng chứng trang chủ (16 PNG, 1 JSON). Không bao gồm
mã nguồn hoặc hướng dẫn của thư viện/công cụ bên thứ ba.

Sau dọn: **6 tài liệu trong `docs/` và 4 tài liệu gốc**. Nội dung diễn giải dùng
tiếng Việt; giữ nguyên tên tệp chuẩn, đường dẫn, mã, lệnh, khóa JSON và ảnh chụp gốc.

## Đọc tài liệu nào?

| Tài liệu | Vai trò |
| --- | --- |
| [Hướng dẫn dự án](../readme.md) | Cài đặt, cấu hình, đồng bộ API và lệnh kiểm tra |
| [Hướng dẫn tác nhân](../AGENTS.md) | Quy tắc làm việc trong repo |
| [Sản phẩm](../PRODUCT.md) | Người dùng, mục đích, thương hiệu và giới hạn đã xác nhận |
| [Thiết kế](../DESIGN.md) | Quy chuẩn trình bày, tương tác, màu và khả năng tiếp cận |
| [Kiến trúc và hiện trạng](architecture/system-overview.md) | Phân lớp, đăng nhập, tuyến hiện tại và ranh giới nghiệp vụ |
| [Chuẩn phản hồi](CLIENT_FEEDBACK_STANDARD.md) | Nội dung tiếng Việt, lỗi, biểu mẫu, thông báo và trạng thái giao dịch |
| [Kế hoạch và việc còn lại](plans/implementation-plan.md) | Một danh sách việc/câu hỏi/rủi ro và quy trình kiểm chứng |
| [Lịch sử kiểm tra](audits/lich-su-kiem-tra.md) | Tổng hợp các lượt đã làm và bằng chứng cũ; không thay kết quả kiểm thử hiện tại |
| [Bảo mật ngày 2026-07-30](security/FRONTEND_SECURITY_AUDIT_2026-07-30.md) | Phát hiện bảo mật lịch sử, giới hạn công cụ và việc cần xác minh lại |

## Quyết định giữ, gộp và xóa

Các tệp ở cột đầu dưới đây là **đường dẫn cũ**, ghi để tra cứu việc di chuyển;
không phải liên kết còn tồn tại sau khi gộp.

| Tệp/nhóm ban đầu | Quyết định | Lý do và nơi lưu nội dung |
| --- | --- | --- |
| `readme.md` | Giữ, viết lại tiếng Việt | Điểm vào dự án; bổ sung cấu hình/lệnh và liên kết tài liệu |
| `AGENTS.md` | Giữ, dịch tiếng Việt | Quy tắc tác nhân cần tên tệp chuẩn; giữ yêu cầu kiến trúc và an toàn giao dịch |
| `PRODUCT.md` | Giữ, dịch và gọn | Sự thật sản phẩm khác quy chuẩn giao diện; sửa tham chiếu kế hoạch cũ |
| `DESIGN.md` | Giữ, dịch và gọn | Quy chuẩn thiết kế dùng lâu dài; giải thích dashboard là mẫu đang tạm ngưng |
| `docs/architecture/system-overview.md` + `docs/analysis/current-state.md` + `docs/analysis/business-rules.md` | Gộp vào tài liệu kiến trúc; xóa 2 bản phân tích | Cùng mô tả ứng dụng và ranh giới Backend; cập nhật theo mã/OpenAPI |
| `docs/plans/implementation-plan.md` + `docs/FRONTEND_MODULE_BY_MODULE_EXECUTION_PLAN.md` | Giữ một kế hoạch; xóa bản kế hoạch theo lượt cũ | Kế hoạch cũ yêu cầu làm lại nhiều phần đã có; chuyển mốc hoàn tất sang lịch sử |
| `docs/analysis/open-questions.md` + `docs/analysis/risks-and-technical-debt.md` | Gộp vào kế hoạch; xóa 2 tệp | Câu hỏi/rủi ro trùng hiện trạng; loại việc đã giải quyết, giữ việc chưa xác minh |
| `docs/progress.md` | Xóa | Chỉ ghi tiến độ khảo sát tạm thời và nhắc tạo kế hoạch đã tồn tại; theo dõi tiếp trong kế hoạch chung |
| `docs/audits/FE_AUDIT_LUOT_*.md` — 15 tệp | Gộp vào lịch sử kiểm tra; xóa bản rời | Lặp phạm vi, lệnh và điều kiện qua lượt; giữ ngày, kết quả gốc, quyết định và giới hạn |
| `docs/issues/BE-001-room-availability-api.md` | Gộp vào kiến trúc và lịch sử; xóa bản vấn đề | Đã giải quyết; ví dụ đề xuất dùng số ID/trạng thái cũ dễ nhầm thành hợp đồng hiện tại |
| `docs/CLIENT_FEEDBACK_STANDARD.md` | Giữ, rút gọn | Quy chuẩn riêng; bỏ lặp giai đoạn hoàn tất, danh mục enum sao chép và nhiều danh sách kiểm tra tương đương |
| `docs/security/FRONTEND_SECURITY_AUDIT_2026-07-30.md` | Giữ riêng, biên tập tiếng Việt | Có phát hiện và giới hạn kiểm chứng đặc thù; đánh dấu rõ báo cáo lịch sử |
| `docs/socket-io-realtime-rollout.md` | Xóa theo quyết định của chủ dự án | Không có kế hoạch triển khai; đã bỏ đề xuất và các mục việc liên quan |
| `docs/audits/homepage-qa/` — 16 PNG và `report.json` | Giữ nguyên | Bằng chứng gốc có script tạo `scripts/qa-homepage.mjs`; không sửa dữ liệu đo/ảnh để dịch |

23 tệp Markdown cũ được xóa: 22 bản sau khi chuyển nội dung hữu ích và một đề xuất
không triển khai; tạo hai tệp là mục lục này và bản lịch sử tổng hợp.
Không tạo thư mục lưu trữ sao chép toàn bộ tài liệu cũ,
vì sẽ giữ nguyên sự trùng lặp. Bản cũ đã theo dõi vẫn tra cứu được qua lịch sử Git.

## Những chỗ lỗi thời đã sửa

- Dashboard không còn tuyến/API tổng hợp; ADMIN hiện vào `/management/bookings`.
- Trang tạo/sửa/ảnh phòng và chi tiết thanh toán đã có mã. Riêng lấy chi tiết thanh
  toán còn giới hạn bộ nhớ đệm/trang đầu, được ghi vào việc cần xử lý.
- Mã lỗi có cấu trúc và khả năng thao tác đã có trong hợp đồng; không tiếp tục yêu
  cầu thêm như tính năng chưa làm hoặc hướng dẫn so khớp thông báo Backend.
- Bỏ mô tả MSW là phụ thuộc hiện tại; bỏ trạng thái Git và lỗi kiểm thử tạm thời bị
  ghi như sự thật lâu dài.
- Kết quả đạt của lượt cũ được ghi rõ là lịch sử, không chứng nhận bản làm việc hôm nay.

## Cách duy trì

Mỗi chủ đề có một tài liệu chủ trong bảng trên. Thay đổi API/tuyến cập nhật kiến trúc;
thay đổi quy chuẩn cập nhật thiết kế hoặc phản hồi; việc chưa làm cập nhật kế hoạch.
Chỉ thêm báo cáo riêng khi có bằng chứng hoặc phạm vi độc lập cần giữ. Ghi ngày,
nguồn kiểm chứng và phân biệt đề xuất, mã hiện có, kiểm thử mô phỏng và Backend thật.

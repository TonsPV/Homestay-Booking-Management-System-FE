# Homestay Green — giao diện đặt phòng và quản lý

Ứng dụng React/Vite phục vụ khách đặt phòng, nhân viên tại quầy và quản trị viên.
Backend quyết định quyền truy cập, giá, phòng trống và trạng thái giao dịch.

## Chạy tại máy phát triển

```bash
npm ci
npm run dev
```

Sao chép `.env.example` thành `.env.local` (hoặc `.env`) rồi chỉnh khi cần:

| Biến | Mục đích |
| --- | --- |
| `VITE_API_ORIGIN` | Địa chỉ gốc Backend, không kèm `/api/v1`; dùng cho build/preview production |
| `VITE_DEV_API_PROXY_TARGET` | Đích chuyển tiếp `/api/v1` và `/media` của Vite khi phát triển; đặt cùng Backend Render để chạy local với dữ liệu đã deploy |
| `VITE_ERROR_REPORTING_ENDPOINT` | Địa chỉ nhận báo cáo lỗi giao diện, không bắt buộc |
| `VITE_APP_RELEASE` | Mã phiên bản triển khai, không bắt buộc |

Mẫu hiện tại đã trỏ cả hai biến kết nối tới Backend Render:
`https://homestay-booking-management-system.onrender.com`. Khi chạy `npm run dev`,
trình duyệt gọi URL local của Vite và Vite chuyển tiếp API/media tới địa chỉ này.
Môi trường triển khai dùng HTTPS; HTTP chỉ dành cho địa chỉ máy cục bộ.
Không lưu bí mật trong biến `VITE_*` vì chúng được đưa vào mã chạy trên trình duyệt.

## Backend và đồng bộ API

Địa chỉ Backend Render được cấu hình trong bản làm việc:
`https://homestay-booking-management-system.onrender.com`, tiền tố API `/api/v1`,
tài liệu lúc chạy `/api/docs`. Đợt dọn tài liệu chưa kiểm tra dịch vụ từ xa.

Nguồn OpenAPI cục bộ:
`../homestay-booking-management-system-api/openapi/openapi.json`.
Khi Backend đổi đặc tả, chạy `npm run openapi:generate` tại repo Backend, sau đó:

```bash
npm run contract:generate
npm run contract:check
npm run contract:test
```

Không sửa tay `src/api/generated`. Khi Backend chạy cục bộ, tài liệu API nằm tại
`http://localhost:3000/api/docs`.

## Kiểm tra chất lượng

```bash
npm run architecture:check
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
```

`test:e2e` dùng phản hồi API mô phỏng. `test:e2e:live` chạy với Backend thật dành
cho kiểm thử; cần `HBMS_LIVE_API_ORIGIN`, `HBMS_LIVE_BACKEND_NODE_ENV=test` và
`HBMS_LIVE_BACKEND_DB` kết thúc bằng `_test`. Chuẩn bị tài khoản kiểm thử theo
cấu hình trong `e2e-live`; không dùng dữ liệu sản xuất. Trình chạy chỉ kiểm tra
khai báo môi trường, không tự xác minh cơ sở dữ liệu ở máy chủ từ xa.

## Tích hợp và triển khai tự động

Bản làm việc có các cấu hình sau; sự hiện diện của tệp không chứng minh quy trình
đã chạy thành công:

- `.github/workflows/ci.yml`: kiểm tra chất lượng, hợp đồng và trình duyệt mô phỏng
  khi mở đề nghị hợp nhất hoặc đẩy lên `main`.
- `.github/workflows/deploy.yml`: quy trình dự kiến kiểm tra chất lượng → dựng bản
  với `VITE_API_ORIGIN` trỏ Render → triển khai Vercel → kiểm tra nhanh trang đã triển khai.
  Cần cấu hình bí mật kho mã `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- `vercel.json`: cấu hình chuyển đường dẫn ứng dụng về `/index.html`, bộ nhớ đệm
  lâu dài cho `/assets/*` và một số tiêu đề bảo mật.

## Tài liệu và luồng tiện nghi

ADMIN quản lý danh mục ở `/management/amenities`, gán nguyên tập tiện nghi tại
`/management/room-types`. Tìm phòng gửi lặp tham số `amenityIds`; thẻ và chi tiết
phòng đọc tiện nghi từ `roomType` Backend trả về, không dùng danh mục cố định ở Frontend.

- [Mục lục và quyết định giữ/gộp/xóa](docs/README.md).
- [Sản phẩm](PRODUCT.md), [quy chuẩn thiết kế](DESIGN.md), [hướng dẫn tác nhân](AGENTS.md).
- [Kiến trúc và hiện trạng](docs/architecture/system-overview.md).
- [Kế hoạch và việc còn lại](docs/plans/implementation-plan.md).

Nội dung tài liệu dùng tiếng Việt; tên API, trường dữ liệu, mã trạng thái, lệnh
và định danh công cụ giữ nguyên để tra cứu chính xác.

# FE Audit - Lượt 9 Management Dashboard

Ngày kiểm tra: 2026-07-29

## Phạm vi và quyết định thiết kế

- Giữ nguyên React Query, React Hook Form, Zod, router, shared UI và endpoint
  hiện có.
- Backend tiếp tục là nguồn quyết định duy nhất cho booking status, room status,
  doanh thu, hoàn tiền, payment metrics và occupancy.
- Khoảng báo cáo mặc định là ngày đầu tháng hiện tại đến hôm nay theo timezone
  `Asia/Ho_Chi_Minh`; giới hạn tối đa 366 ngày giống Backend.
- Không thêm biểu đồ giả hoặc tự suy diễn số liệu khi contract chỉ cung cấp một
  summary tại thời điểm hiện tại.
- Theo hướng dẫn `impeccable`, dashboard được giữ theo phong cách management:
  dày thông tin vừa phải, dễ quét, dùng hierarchy và màu semantic thay vì
  decorative cards, gradient hoặc animation không phục vụ nghiệp vụ.
- Quick action chỉ trỏ tới các chức năng STAFF và ADMIN đều được phép dùng.

## Contract và API

### Backend

- Dùng `GET /api/v1/management/dashboard/summary?from=...&to=...`.
- Endpoint được bảo vệ cho `ADMIN` và `STAFF`.
- OpenAPI bổ sung response `400 ErrorEnvelopeDto` cho khoảng ngày không hợp lệ.
- OpenAPI snapshot đã generate lại và FE generated types đã đồng bộ.
- Date range là ISO `YYYY-MM-DD`, `from <= to`, tối đa 366 ngày tính inclusive.

### Frontend

- Tạo feature `src/features/dashboard`:
  - Alias trực tiếp `DashboardSummaryResponse` và
    `DashboardGetSummaryData['query']` từ generated OpenAPI.
  - API client gửi đúng endpoint, query `from`/`to`, bearer token và abort
    signal.
  - Query key chứa đầy đủ khoảng ngày.
  - Schema kiểm tra ngày thực, thứ tự ngày và giới hạn 366 ngày.
  - Formatter tiền, phần trăm và khoảng ngày tái sử dụng shared formatter.
- Không tạo response type viết tay trùng với Backend.

## Dashboard UX

- Thay toàn bộ số liệu/link tĩnh bằng summary thật.
- Header có một primary action: `Tạo booking tại quầy`.
- Form khoảng báo cáo luôn hiển thị trước số liệu, có label, required state,
  validation inline và loading khi refetch.
- Nhóm chỉ số chính:
  - Doanh thu đã ghi nhận.
  - Công suất phòng.
  - Tổng booking tạo trong kỳ.
  - Tổng payment cần đối soát hoặc chờ hoàn tiền.
- Các vùng nghiệp vụ:
  - Booking theo trạng thái với deep link tới filter được hỗ trợ.
  - Trạng thái phòng hiện tại.
  - Doanh thu VNPay, manual và tổng đã hoàn tiền.
  - Occupancy bằng progress bar có ARIA value.
  - Hàng đợi `REQUIRES_REVIEW` và `REFUND_PENDING`.
  - Timestamp cho biết thời điểm Backend tổng hợp.
- Giữ các quick action quản lý Booking, Room và Payment ở cuối trang.

## UI states và edge cases

- Loading: hiển thị trạng thái tổng hợp dữ liệu.
- Error: hiển thị message từ API và nút retry.
- Zero data: hiển thị thông báo giải thích số 0 là dữ liệu hợp lệ; trạng thái
  phòng hiện tại vẫn được giữ.
- Success: không còn số liệu hard-code.
- Occupancy bị clamp trong phần trình bày progress bar từ 0 đến 100 nhưng giá trị
  nghiệp vụ hiển thị vẫn lấy từ Backend.
- Layout đã pass mocked browser trên desktop và mobile cho cả STAFF/ADMIN.

## Bằng chứng kiểm thử

| Gate | Kết quả |
|---|---|
| Backend lint | PASS |
| Backend OpenAPI validate | PASS, 4 tests |
| Backend unit/service tests | PASS, 41 files / 279 tests |
| Backend build | PASS |
| FE contract check + negative contract test | PASS |
| FE typecheck | PASS |
| FE lint | PASS |
| FE unit/component | PASS, 49 files / 195 tests |
| FE build | PASS, 291 modules |
| Mocked browser | PASS, 49 pass / 1 skip |
| Dashboard mocked browser | PASS, 4 desktop/mobile journeys |
| Live Backend management auth + dashboard | PASS, 4 journeys |

Unit/component test đã kiểm tra:

- API URL, query và bearer token.
- Default timezone range, ngày không tồn tại, đảo ngày và giới hạn 366 ngày.
- Money/percentage/date formatting.
- Summary success, zero data, loading, error/retry và validation trước khi đổi
  query.

Mocked và live browser đã kiểm tra:

- STAFF và ADMIN đều mở được dashboard.
- Summary thật được render và queue link đúng filter.
- Đổi khoảng ngày tạo request mới đúng `from`/`to`.
- Desktop và mobile không làm hỏng hành trình dashboard.
- Live Backend chấp nhận đúng contract cho cả hai role.

## Kết luận và phần hoãn đúng owner

Lượt 9 đạt exit gate:

- Dashboard không còn số liệu hard-code.
- Zero data không bị xem như lỗi.
- Date range và summary contract pass.
- STAFF/ADMIN mocked và live journeys đều pass.

Build vẫn có cảnh báo đã biết `INEFFECTIVE_DYNAMIC_IMPORT` của RoomType. Đây là
FE-009, owner Lượt 10; không sửa lan man trong Lượt 9.

Không commit hoặc push.

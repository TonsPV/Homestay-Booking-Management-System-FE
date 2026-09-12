# Hệ thống thiết kế Homi Stay

## Định hướng chung

Trang dành cho khách gợi cảm giác đến nơi nghỉ: ảnh phòng thật, điều khiển đặt phòng
chính xác và nhịp đọc thư thái. Trang vận hành dày thông tin hơn, dùng chung màu ngữ
nghĩa và hành vi điều khiển nhưng có quy tắc bố cục riêng.

## Trang dành cho khách

- Nền trung tính dịu, thẻ trắng; vùng đầu/cuối trang có thể dùng màu đá phiến đậm.
- Xanh dương cho điều hướng chính và đặt phòng; xanh lá biểu thị phòng thực sự sẵn
  sàng; vàng cảnh báo, đỏ lỗi. Chiều sâu bằng bóng mềm và lớp ảnh, tránh hiệu ứng kính.
- Tiêu đề dùng bộ chữ hệ thống giàu tính người, khoảng chữ gọn và dòng ngắn; nội dung
  dùng bộ chữ không chân hiện có. Cỡ tiêu đề máy tính 64/48/36/28, di động 44/36/28/24;
  nội dung 16–18 px, giãn dòng dễ đọc.
- Trang chủ đi từ cảm hứng → tìm phòng → thông tin tạo tin cậy đã xác minh → chọn
  phòng → trải nghiệm → bằng chứng hình ảnh → hành động cuối.
- Ảnh có vùng hiển thị lớn liền mạch; điều khiển gần ảnh hoặc quyết định liên quan.
  Thẻ bo góc 12–16 px; thay đổi nhịp giữa vùng ảnh, nội dung và vùng lựa chọn.
- Nút chính xanh dương, cao tối thiểu 44 px, nhãn nêu bước tiếp theo.
  Tìm phòng ưu tiên ngày và số khách; bộ lọc bổ sung đặt ở trang kết quả.
- Khung chờ khớp bố cục; trạng thái lỗi/rỗng giữ hành động hữu ích tiếp theo.
- Điểm tập trung bàn phím luôn rõ; kết quả động thông báo nhẹ qua vùng thông báo hỗ trợ.
- Ưu tiên ảnh cơ sở được duyệt từ Backend. Ảnh tiếp thị thay thế phải ghi rõ minh họa;
  không bịa khách, giải thưởng, đánh giá, lượng đặt phòng, diện tích hoặc phòng trống.
- Chuyển động chậm, tiết chế ở ảnh đầu và khi phần nội dung xuất hiện. Phóng ảnh/bóng
  khi rê chuột nhẹ; tắt chuyển động khi người dùng yêu cầu giảm chuyển động.
- Ảnh dưới màn hình đầu tải trì hoãn; có mô tả thay thế có nghĩa hoặc rỗng nếu trang trí.

## Quy tắc trang quản lý — phiên bản 3

Ưu tiên mật độ, phân cấp và khả năng quét. `ManagementDashboardPage` là mẫu tổng quan,
`ManagementPaymentsPage` là mẫu danh sách. Dashboard hiện tạm ngưng tuyến/API nhưng
vẫn được giữ làm tham chiếu thiết kế; xem [hiện trạng](docs/architecture/system-overview.md).

### Bố cục và chữ

- Vùng quản lý dùng `max-w-management` (110rem), căn giữa và lề chuẩn; trang khách
  dùng `max-w-app` (80rem).
- Nhịp trang `page-stack` (`gap-6`), nhịp phần `section-stack` (`gap-4`). Rà soát màn
  được sửa; chữ trình bày cỡ lớn mang phong cách biên tập chỉ dành cho trang công khai.

| Vai trò | Đặc tả | Nơi dùng |
| --- | --- | --- |
| `page-title` | `text-2xl sm:text-3xl font-bold tracking-tight text-ink` | `PageHeader.title`, một lần mỗi trang |
| `section-title` | `text-lg font-bold text-ink` | Tiêu đề thẻ/phần |
| `kpi` | `text-3xl font-bold tracking-tight tabular-nums` | Chỉ số chính; chỉ dùng màu trạng thái khi có ý nghĩa nghiệp vụ |
| `kpi-label` | `text-sm font-semibold text-muted` | Nhãn chỉ số và ghi chú |
| `body` | `text-sm text-ink leading-6` | Nội dung mặc định |
| `label` | `text-sm font-semibold text-ink` | Nhãn biểu mẫu, tiêu đề cột |
| `meta` | `text-xs text-muted` | Thời gian, mã, hướng dẫn phụ |
| `eyebrow` | `text-xs font-bold uppercase tracking-eyebrow text-brand` | Nhãn nhóm trong `PageHeader` |
| `link-inline` | `text-sm font-semibold text-brand-strong hover:underline` | Liên kết trong nội dung |

`font-black` chỉ dành cho chữ thương hiệu. Nội dung quản lý đậm tối đa `font-bold`,
nhãn và nút dùng `font-semibold`; không dùng `font-medium` thay cho phân cấp.
Doanh thu và số tiền đã hoàn dùng màu trung tính; không tô xanh/đỏ chỉ để nhấn mạnh.

### Bề mặt và độ nổi

- Ưu tiên đường viền trước bóng. `Card`: `rounded-panel border-line bg-surface shadow-card` (mức 2).
- Thanh lọc là thẻ có `p-4`. Bảng nằm trong `Card` với `p-0 overflow-hidden` và vùng
  cuộn ngang `overflow-x-auto` riêng.
- Ngăn trượt/lớp phủ mức 3, hộp thoại mức 4, thanh đầu cố định mức 1.
- `shadow-sm/md/lg` còn là tên tương đương; màn mới dùng `shadow-elevation-*`.

### Màu trạng thái

| Tông | Ý nghĩa |
| --- | --- |
| `neutral` | Thông tin tĩnh/trung tính |
| `info` | Đang hoạt động/xử lý |
| `success` | Hoàn tất/bình thường |
| `warning` | Cần chú ý hoặc nguy cơ quá thời hạn xử lý |
| `danger` | Thất bại, không hợp lệ, phá hủy hoặc cần can thiệp ngay |

`REFUND_PENDING` quá thời hạn dùng `warning`. Nhãn trạng thái theo cùng bảng;
`violet` không phải tông quản lý. Nội dung và vị trí thông báo theo
[chuẩn phản hồi](docs/CLIENT_FEEDBACK_STANDARD.md); `Alert` dùng tên `error` cho lỗi.

### Hành động, bảng và di động

- Tối đa một hành động chính trên mỗi vùng/hàng; phụ dùng viền, thứ yếu dùng chữ hoặc `ghost`.
- Mọi thao tác phá hủy hoặc tài chính dùng `variant="danger"` cùng
  `ConfirmationDialog tone="danger"`; không dùng nút `ghost` cho thao tác phá hủy.
- Phòng có tuyến tạo/sửa/ảnh riêng. Thanh toán tối đa sáu cột; thông tin kỹ thuật
  nằm ở `/management/payments/:id`.
- Đầu bảng: `bg-surface-muted text-xs uppercase tracking-wide text-muted`;
  ô: `px-4 py-3`; hàng: `hover:bg-surface-muted align-top`.
- Mỗi trang 10–12 hàng; tiền và mã dùng chữ đơn cách hoặc `tabular-nums`.
- Dưới `lg`: thẻ xếp dọc ưu tiên tác vụ. Từ `lg`: bảng. `TableCards` giữ trong tính
  năng đến khi hai tính năng thực sự dùng chung cấu trúc thẻ.
- Thanh lọc xếp dọc trên di động, từ `sm` dùng `flex items-end gap-3`.

### Trạng thái và khả năng tiếp cận

Thành phần tương tác có đủ mặc định, rê chuột, nhấn, tập trung bàn phím, được chọn,
bị khóa và đang xử lý. Khung chờ khớp bố cục, có `aria-hidden`; kết quả bất đồng bộ
thông báo nhẹ, tránh gián đoạn người dùng.

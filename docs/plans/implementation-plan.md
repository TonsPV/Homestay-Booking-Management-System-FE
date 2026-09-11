# Kế hoạch kiểm chứng và việc còn lại

Cập nhật ngày 2026-09-10; gộp hai kế hoạch cũ cùng ghi chú tiến độ, câu hỏi và rủi ro.
Các lượt tích hợp trước đây nằm trong [lịch sử kiểm tra](../audits/lich-su-kiem-tra.md).
Không bắt đầu lại từ lượt 0 hoặc coi mọi ô chưa đánh dấu trong kế hoạch cũ là việc tồn đọng.

## Danh sách cần xử lý

| Mã | Việc | Hiện trạng và điều kiện hoàn tất | Phụ trách |
| --- | --- | --- | --- |
| ROOM-DISCOVERY | Gộp khám phá và tìm phòng trống vào `/rooms` | Đã triển khai ngày 2026-09-10. Một màn client, hai trạng thái dữ liệu; `/rooms/search` là tuyến chuyển hướng tương thích | Frontend |
| ROOM-DETAIL | Nâng cấp chi tiết phòng CLIENT sau nút “Xem chi tiết” ở “Khám phá phòng” | Đích bắt buộc: `/rooms/:roomId` → `PublicRoomDetailPage.tsx`; xem chỉ dẫn triển khai bên dưới | Frontend + Backend + nội dung |
| DOC-01 | Chi tiết thanh toán khi mở trực tiếp | Trang đã có; hook chỉ tìm trong bộ nhớ đệm/trang đầu 50 giao dịch. Chốt cách lấy theo ID, kiểm thử giao dịch ngoài trang đầu, tải mới, quyền và lỗi thật | Frontend + Backend |
| DOC-02 | Khả năng khôi phục dashboard | Tuyến và API tổng hợp hiện không còn trong cấu hình. Chỉ mở lại khi có hợp đồng Backend, dữ liệu thật và kiểm thử | Sản phẩm + Backend + Frontend |
| DOC-03 | Kiểm chứng tuyến phòng và thanh toán mới | Có mã và kiểm thử trong bản làm việc; cần chạy kiểm tra URL trực tiếp, quay lại danh sách, quyền và bố cục di động | Frontend |
| DOC-04 | Đăng nhập chung ở Backend | Frontend thử hai API theo `401`. Chỉ đổi khi có quyết định/hợp đồng API chung; không tự thêm `/auth/login` | Backend + Frontend |
| DOC-05 | Môi trường kiểm thử tích hợp | Xác nhận Backend `test`, cơ sở dữ liệu `_test`, tài khoản mẫu, địa chỉ chạy và cấu hình triển khai; không ghi mật khẩu vào tài liệu | Vận hành + Backend |
| DOC-06 | Kết quả kiểm thử hiện tại | Chạy bộ kiểm tra cho đợt thay đổi tính năng; ghi chữ ký lỗi thực tế. Ghi chú cũ về ba kiểm thử lỗi không chứng minh tình trạng hôm nay và không cấm sửa lỗi | Frontend |
| DOC-07 | Bảo mật triển khai | Xác minh tiêu đề bảo mật, chính sách lưu token và quét bảo mật hiện tại | Vận hành + Backend; xem [báo cáo](../security/FRONTEND_SECURITY_AUDIT_2026-07-30.md) |

Danh sách khách hàng, nhân viên và đặt phòng cần tiếp tục đối chiếu quy chuẩn khi
có thay đổi: bảng dễ đọc trên máy tính, thẻ ưu tiên tác vụ trên di động, bộ lọc nhất
quán và xác nhận thao tác nguy hiểm. Đây là tiêu chí kiểm tra, chưa phải kết luận
rằng mọi trang đang có lỗi.

## Kế hoạch gộp khám phá và tìm phòng trống dành cho khách

Ngày lập: 2026-09-10. Trạng thái: **đã triển khai trong mã nguồn và kiểm thử mô phỏng**.
Đích triển khai: `/rooms` → `PublicRoomsRoute` → `PublicRoomsPage.tsx`.
Gộp chức năng của `RoomSearchPage.tsx` vào màn này. Không tạo hai tab giả lập hai
trang cũ, không nhúng nguyên hai trang nối tiếp nhau. Đây là màn khách tìm và chọn
phòng, dùng được trước đăng nhập; không triển khai vào `/management/*` hoặc `/staff/*`.

Phần này là chỉ dẫn mới nhất về tuyến danh sách/tìm kiếm. Sau khi triển khai,
mọi tham chiếu `/rooms/search` như đích giao diện trong kế hoạch chi tiết phòng
bên dưới phải chuyển sang `/rooms`; API Backend `/rooms/search` vẫn giữ nguyên.

### Căn cứ và hướng bố cục

Đã đối chiếu hai ảnh người dùng gửi, `PublicRoomsPage`, `RoomSearchPage`,
`SearchRoomCard`, `api.ts`, tuyến công khai, liên kết trang chủ và `DESIGN.md`.
Ảnh hiện tại cho thấy hai mục menu trùng mục đích; `/rooms/search` còn đánh dấu
cả hai mục đang hoạt động. Tiêu đề tìm kiếm lớn và khối hướng dẫn chiếm phần đầu,
trong khi chưa chọn ngày thì không có phòng để khám phá. Màn danh sách lại yêu cầu
chuyển trang để kiểm tra ngày. Một số ảnh phòng đang lỗi tải; cần kiểm tra URL và
nguồn ảnh khi triển khai, không kết luận lỗi Backend chỉ từ ảnh chụp.

Giữ nền trung tính, bề mặt trắng, nút xanh dương và ảnh thật của Homestay Green.
Ưu tiên thao tác tìm phòng và so sánh; không thêm hero quảng bá lớn ở màn này.

```text
Header: Trang chủ | Khám phá phòng | Đặt phòng của tôi | Tài khoản

Khám phá phòng
Chọn không gian bạn thích hoặc nhập ngày để tìm phòng còn trống.

[Nhận phòng] [Trả phòng] [Số khách] [Tìm phòng trống]
Tóm tắt kỳ lưu trú đã áp dụng · Đổi ngày / Xóa ngày

[Bộ lọc, 240–280px]   [Tiêu đề kết quả + số lượng]       [Sắp xếp]
 Loại phòng           [Bộ lọc đã áp dụng, có thể xóa]
 Các lọc phù hợp      [Ảnh thật | Tên, giường, tiện nghi | Giá, CTA]
 trạng thái           [Ảnh thật | Tên, giường, tiện nghi | Giá, CTA]
 [Áp dụng bộ lọc]      [Phân trang]
```

- Khung nội dung tối đa theo `max-w-app`; tiêu đề desktop khoảng 32–36px,
  mobile 26–30px, mô tả ngắn một đoạn. Khoảng cách phần 20–28px, giảm khoảng trống
  đầu trang. Ở desktop 1280×800 phải thấy ảnh và tên phòng đầu tiên ngay khi tải xong.
- Thanh ngày nằm ngay dưới tiêu đề, bốn cột trên desktop; tablet hai cột, mobile
  xếp ngày thành hai ô nếu đủ rộng, số khách và nút xuống hàng. 320px chuyển một
  cột khi cần; không co nhãn/nút hoặc buộc cuộn ngang.
- Bộ lọc bên trái trên desktop; mobile là khối thu gọn “Bộ lọc (N)” mở ngay trên
  kết quả, có nút áp dụng rõ ràng. Thanh ngày không cố định trên mobile để tránh
  chiếm màn hình khi bàn phím mở. Sidebar chỉ sticky khi chiều cao cho phép.
- Một danh sách thẻ ngang thống nhất cho cả hai trạng thái; desktop ảnh chiếm
  khoảng 32–38%, nội dung và giá/hành động bên cạnh; mobile ảnh trên, thông tin
  dưới. Không đổi từ lưới ba cột sang danh sách ngang chỉ vì khách nhập ngày.
- Không giữ khối minh họa “Chọn ngày lưu trú…” thay cho phòng. Khi chưa có ngày,
  hiển thị phòng thật và một dòng hướng dẫn nhỏ cạnh thanh tìm kiếm.

### Hai trạng thái trên cùng một màn

| Trạng thái đã áp dụng | Nguồn dữ liệu và trình bày | Hành động |
| --- | --- | --- |
| Chưa chọn kỳ lưu trú | `GET /rooms`; tiêu đề “Khám phá các phòng”; chỉ nói số phòng khi có tổng phân trang, nếu không ghi số đang hiển thị | “Xem chi tiết”; chưa gắn nhãn còn trống |
| Đủ ngày hợp lệ và số khách | `GET /rooms/search`; kết quả gắn với chính kỳ lưu trú đã áp dụng | “Xem chi tiết” giữ ngày/số khách; “Tiếp tục đặt phòng” đi biểu mẫu hiện có |
| Đang sửa lựa chọn | Giữ kết quả của lần áp dụng trước cùng tóm tắt đúng lần đó; hiện “Bạn đã thay đổi lựa chọn. Tìm lại để cập nhật kết quả.” | Không gắn bản nháp vào các phòng của kết quả cũ; vô hiệu hóa CTA đặt từ kết quả cũ đến khi tìm lại hoặc hoàn tác |
| Đang tải kỳ mới | Khung chờ theo thẻ; bỏ nhãn xác nhận phòng trống và hành động đặt của kỳ cũ | Chống gửi lặp; phản hồi cũ không ghi đè kết quả mới |
| Không có kết quả | Giữ thanh ngày và bộ lọc; giải thích theo tiêu chí đang áp dụng | “Xóa bộ lọc” giữ ngày, “Đổi ngày” chuyển tập trung tới ngày; “Xem tất cả phòng” về danh mục và ghi rõ chưa kiểm tra ngày |
| Lỗi API | Báo không tải/kiểm tra được, giữ đầu vào để thử lại | Không hiển thị “0 phòng còn trống” hoặc kết quả danh mục như thay thế cho kiểm tra thất bại |

Gộp màn không đồng nghĩa gộp API. Không dùng API quản lý để lấy phòng trống.
Gọi hook theo quy tắc React và dùng `enabled` hoặc thành phần vùng kết quả để
chỉ kích hoạt nguồn dữ liệu phù hợp; không tải đồng thời cả danh mục và kết quả
tìm kiếm rồi trộn danh sách. Backend vẫn kiểm tra lại khi khách gửi yêu cầu đặt.

### Bộ lọc theo đúng hợp đồng hiện có

| Tiêu chí | Danh mục `GET /rooms` | Theo kỳ `GET /rooms/search` |
| --- | --- | --- |
| Loại phòng | Có `roomTypeId` | Có `roomTypeId` |
| Từ khóa | Có `search`; nhãn “Tên hoặc mô tả phòng”, bỏ gợi ý tìm số phòng nội bộ | Chưa có tham số `search`; không hiển thị ô tìm từ khóa trong trạng thái này |
| Giá, tiện nghi | Chưa được wrapper API danh mục hỗ trợ | Có `minPrice`, `maxPrice`, `amenityIds` |
| Sắp xếp | Chưa có tham số được wrapper danh mục hỗ trợ | Dùng các giá trị `SearchRoomsSort` đã có, không tự tạo tiêu chí |
| Phân trang | `page`, `limit` | `page`, `limit` |

Chốt bản FE đầu: loại phòng luôn dùng được. Tiện nghi tải động từ `GET /amenities`
và khách có thể chọn trước; các lựa chọn này chỉ được Backend áp dụng khi khách nhập
kỳ hợp lệ rồi gọi `GET /rooms/search`. Giá và sắp xếp chỉ xuất hiện khi đã áp dụng kỳ.
Không lọc cục bộ một trang rồi gọi đó là toàn bộ kết quả phù hợp.
Khi chuyển từ danh mục có từ khóa sang tìm theo kỳ, bỏ từ khóa khỏi URL đã áp dụng
và giải thích ngắn “Đã bỏ từ khóa; kết quả được tìm theo kỳ lưu trú”. Khi xóa ngày,
bỏ giá/tiện nghi/sắp xếp không còn hỗ trợ, giữ loại phòng; không khôi phục từ khóa
cũ một cách ngầm định. Nếu muốn tất cả tiêu chí dùng được mọi lúc, đó là đợt mở
rộng Backend riêng, cần cập nhật OpenAPI trước.

Mỗi nhóm có thao tác rõ: “Tìm phòng trống” áp dụng ngày/số khách cùng bộ lọc hợp lệ;
“Áp dụng bộ lọc” áp dụng bản nháp bộ lọc cho kỳ đã áp dụng. Nếu ngày đang sửa, yêu
cầu dùng “Tìm phòng trống” trước; không âm thầm áp dụng ngày mới khi bấm lọc/sắp xếp.
Chip thể hiện bộ lọc đã áp dụng; xóa chip cập nhật ngay URL và kết quả. Xóa bộ lọc
không xóa kỳ lưu trú; xóa ngày là hành động riêng. Mọi lần đổi tiêu chí về trang 1.

### Thẻ phòng và hình ảnh

- Một thành phần thẻ công khai hỗ trợ cả danh mục và kết quả theo kỳ; tái sử dụng
  phần tốt của `RoomCard`/`SearchRoomCard`, tránh hai bản thông tin phòng lệch nhau.
- Hiển thị ảnh bìa, tên, loại phòng, sức chứa, cấu hình giường có dữ liệu, mô tả
  ngắn và tối đa 3–4 tiện nghi thật kèm số còn lại. Tên dài xuống dòng, giá không tràn.
- Giá luôn ghi “Giá cơ sở / đêm”; không nhân số đêm thành tổng thanh toán. Chỉ dùng
  báo giá theo kỳ khi Backend thật sự cung cấp hợp đồng đó.
- `SearchRoomCard` hiện gắn cứng “Còn phòng”; khi hợp nhất phải chuyển thành trạng
  thái có điều kiện, chỉ hiển thị sau tìm kiếm thành công cho tiêu chí hiện hành.
  Dòng cạnh tổng kết quả giải thích “Kết quả theo kỳ đã chọn; chưa giữ chỗ”.
- Danh mục dùng “Xem chi tiết” làm CTA chính. Kết quả theo kỳ dùng “Tiếp tục đặt
  phòng” làm CTA chính, “Xem chi tiết” phụ; đều giữ đúng phòng và kỳ đã áp dụng.
- Rà URL qua `resolveRoomImageUrl`, ảnh bìa và cấu hình nguồn media công khai;
  không ghi token vào URL hoặc đổi `.env` theo phỏng đoán. Ảnh lỗi/thiếu dùng
  fallback giữ tỷ lệ, không thay bằng ảnh tiếp thị rồi gọi là ảnh phòng thật.
- Ảnh không có padding lớn bao quanh như ảnh chụp danh sách cũ; dùng vùng ảnh
  liền thẻ, cùng tỷ lệ, tải trì hoãn dưới màn hình đầu để giảm xê dịch bố cục.

### URL, điều hướng và dữ liệu đã áp dụng

- URL chuẩn: `/rooms`; ví dụ `/rooms?checkIn=2099-04-10&checkOut=2099-04-12&guests=2&roomTypeId=5&page=1`.
  Danh mục dùng `search`, `roomTypeId`, `page`; theo kỳ thêm các khóa API hỗ trợ,
  `amenityIds` dạng lặp như hiện có. Loại khóa lạ, kiểm tra ngày thật, thứ tự ngày,
  số khách, giá và trang bằng lược đồ hiện có; không tự đặt giới hạn nghiệp vụ mới.
- URL giữ trạng thái đã áp dụng; biểu mẫu giữ bản nháp. Mở trực tiếp/tải lại và
  Back/Forward phải đồng bộ cả dữ liệu lẫn biểu mẫu; không dùng chỉ `location.state`.
  Submit tạo lịch sử, chuẩn hóa tham số lỗi dùng replace. URL thiếu ngày không
  gọi tìm phòng trống; giữ đầu vào có thể sửa và giải thích, hiển thị danh mục với
  nhãn chưa kiểm tra. URL đủ kỳ hợp lệ tự tìm, không bắt bấm lần nữa.
- `/rooms/search` là tuyến tương thích chuyển bằng replace sang `/rooms`, giữ
  query hợp lệ; không render `RoomSearchPage`. Khai báo rõ tuyến này trước khi
  xác minh `/rooms/:roomId`, tránh hiểu `search` là ID phòng.
- Menu desktop/mobile chỉ còn “Khám phá phòng”; footer có một liên kết khám phá.
  CTA “Tìm phòng trống” ở trang chủ vẫn có thể giữ nhãn nhưng trỏ `/rooms` hoặc
  `/rooms?...` khi có ngày. Chỉ một mục menu active ở cả danh sách và chi tiết.
- Cập nhật “Tìm phòng khác”, liên kết loại phòng và mọi CTA public có đích cũ.
  Quay lại từ chi tiết phục hồi bộ lọc/trang và vị trí cuộn khi đi từ danh sách;
  mở trực tiếp chi tiết dùng fallback `/rooms` với kỳ hợp lệ nếu có. Chỉ chấp nhận
  đích quay lại nội bộ `/rooms`, không nhận URL ngoài tùy ý.
- Chọn một cách phân trang: dùng `PaginationControls` hiện có cho cả hai trạng
  thái; mỗi URL `page=N` là trang N, bỏ logic nối “Xem thêm” cũ để reload/Back có
  nghĩa nhất quán. Không lấy mọi trang trước để dựng lại một URL.

### Thứ tự và tệp triển khai cho GLM

1. Đọc Git, hợp đồng mới nhất và các thành phần đã có. Chuẩn hóa bộ đọc/ghi URL,
   trạng thái danh mục/theo kỳ và hook có điều kiện trong tính năng phòng; tái sử
   dụng `schemas.ts`, `hooks.ts`, `query-keys.ts`, không sửa tay kiểu sinh tự động.
2. Nâng cấp `src/features/rooms/pages/PublicRoomsPage.tsx`: thanh kỳ lưu trú,
   bộ lọc, tổng kết quả, danh sách dùng chung, phân trang và trạng thái lỗi/rỗng.
   Chuyển tương tác hữu ích từ `RoomSearchPage.tsx` thành thành phần tính năng,
   không giữ một trang thứ hai dưới tên mới.
3. Hợp nhất phần trình bày `components/RoomCard.tsx` và `SearchRoomCard.tsx` sau
   khi tìm mọi nơi sử dụng. Chỉ xóa thành phần hết tham chiếu; giữ API quản lý riêng.
4. Nối `RoomRouteAdapters.tsx`, `public-routes.tsx`, `route-titles.ts`; cập nhật
   `PublicLayout.tsx`, `HomeSearchPanel.tsx`, `FeaturedRoomsSection.tsx`,
   `homeContent.ts` và các liên kết public còn tìm thấy bằng `rg '/rooms/search' src`.
   Không thay chuỗi endpoint API Backend bằng tuyến giao diện.
5. Khi chuyển xong, xóa `RoomSearchPage.tsx` và chuyển các test hữu ích vào bộ test
   màn hợp nhất; bỏ export/import không dùng. Cập nhật tài liệu kiến trúc và mục
   plan liên quan theo kết quả thật, không giữ hai tài liệu hướng dẫn trái nhau.

### Kết quả triển khai ngày 2026-09-10

- `/rooms` hiển thị danh mục công khai khi chưa có kỳ lưu trú và chỉ gọi
  `GET /rooms`. Khi URL có ngày hợp lệ cùng số khách, màn này gọi
  `GET /rooms/search`, giữ tiêu chí trong URL, thêm nhãn “Còn phòng” và cho phép
  tiếp tục đặt phòng.
- Thanh ngày, bộ lọc theo hợp đồng, phân trang, trạng thái tải/rỗng/lỗi, thẻ phòng
  dùng chung và bộ lọc gọn trên di động đã nằm trong `PublicRoomsPage.tsx`.
  `RoomSearchPage.tsx` và thẻ danh sách cũ đã được bỏ.
- `/rooms/search?...` chuyển hướng thay thế sang `/rooms?...`; điều hướng trang chủ,
  menu, chân trang, liên kết loại phòng và luồng chi tiết/đặt phòng đều dùng `/rooms`.
- Cập nhật bố cục ngày 2026-09-11: phần ngữ cảnh, bộ lọc và kết quả cùng nằm trong
  một khung; bỏ đường kẻ dài. Sidebar hiển thị tiện ích động, lưu lựa chọn trước khi
  tìm và gửi `amenityIds` vào truy vấn kiểm tra phòng trống.
- Đã chạy `typecheck`, `architecture:check`, `lint`, `build`, 546 kiểm thử Vitest và
  23 kiểm thử Playwright mô phỏng trên desktop/mobile. Cần kiểm tra riêng với dữ liệu
  và Backend triển khai thật trước khi nghiệm thu môi trường sản xuất.

### Nghiệm thu

- [ ] `/rooms` chưa có ngày hiển thị phòng thật, không có nhãn xác nhận còn phòng.
- [ ] Nhập ngày/số khách tìm ngay trên `/rooms`; chỉ gọi API phù hợp. Loại phòng,
  giá, tiện nghi, sắp xếp, reset và phân trang gửi đúng tham số được hỗ trợ.
- [ ] Đổi nhanh kỳ/bộ lọc, mạng chậm và lỗi không làm lẫn kết quả hoặc cho đặt với
  bản nháp. Xóa ngày về danh mục; xóa bộ lọc giữ ngày; số kết quả đúng phân trang.
- [ ] Mở `/rooms/search?...` cũ chuyển đúng `/rooms?...`; reload/Back/Forward,
  trang 2 và quay từ chi tiết khôi phục tiêu chí đúng. Chỉ một mục menu active.
- [ ] Trang chủ → khám phá/tìm → chi tiết → đăng nhập khi cần → đặt phòng vẫn giữ
  đúng ID/ngày/số khách. Đăng nhập trực tiếp vẫn về trang chủ như đã triển khai.
- [ ] Ảnh thật hoặc fallback có chủ đích; kiểm tra 0/1/nhiều phòng, tên dài, nhiều
  tiện nghi và lỗi tải ảnh. Có ảnh nghiệm thu ở 375, 768, 1280, 1440px; kiểm tra
  320px, zoom 200%, bàn phím, nhãn biểu mẫu, focus và thông báo kết quả bất đồng bộ.
- [ ] Chuyển/cập nhật unit/component test của hai trang, route adapters, homepage
  và layout; E2E `auth-flow`, `room-flows`, `cross-module-customer`,
  `homepage-search-accessibility` cùng các test tìm kiếm hiện có. Phân biệt test
  liên kết mới với test tuyến cũ chuyển hướng, không thay mọi chuỗi mù quáng.
- [ ] Chạy `architecture:check`, `typecheck`, `lint`, test liên quan, `build` và
  E2E hành trình trên desktop/mobile; ghi rõ mô phỏng hay Backend thật.

Không thêm đánh giá giả, giảm giá, yêu thích, bản đồ chưa có dữ liệu hoặc Socket.IO
để lấp nội dung. Kết quả cần là một màn khám phá có ảnh và thông tin hữu ích ngay
khi vào, kiểm tra kỳ lưu trú ngay tại chỗ và dẫn khách đến đúng bước đặt phòng.

## Kế hoạch nâng cấp chi tiết phòng dành cho khách

Ngày lập: 2026-09-10. Phạm vi đã xác nhận: `/rooms/:roomId`, nơi khách xem phòng
trước khi đặt. Tài liệu này hướng dẫn GLM nâng cấp tiếp bản client đã có thay đổi;
lượt cập nhật kế hoạch không sửa giao diện hoặc nghiệm thu bằng trình duyệt.
Không thay màn quản lý ADMIN/STAFF trong đợt này.

### Chỉ dẫn đúng màn hình cho GLM 5.3 Flash

**Đích cần triển khai là màn chi tiết phòng CLIENT mà khách mở bằng nút “Xem chi
tiết” trong “Khám phá phòng”.** Bắt đầu từ đường đi hiện có sau:

```text
Khám phá phòng: /rooms
  → PublicRoomsPage
  → RoomCard: nút “Xem chi tiết”, gọi onView(room.id)
  → PublicRoomsRoute: onViewRoom điều hướng tới /rooms/<roomId>
  → publicRoutes: path 'rooms/:roomId'
  → PublicRoomDetailRoute
  → PublicRoomDetailPage  ← TRIỂN KHAI NÂNG CẤP TẠI ĐÂY
```

| Vai trò | Tệp và phạm vi thao tác |
| --- | --- |
| Trang client phải được nâng cấp | `src/features/rooms/pages/PublicRoomDetailPage.tsx` |
| Kiểm thử trang client | `src/features/rooms/pages/PublicRoomDetailPage.test.tsx` |
| Nút mở trang cần kiểm chứng | `src/features/rooms/components/RoomCard.tsx` và `src/features/rooms/pages/PublicRoomsPage.tsx`; chỉ sửa nếu luồng client cần thay đổi |
| Nối tuyến và giữ ngày/số khách | `src/routes/RoomRouteAdapters.tsx`: phần `PublicRoomsRoute`, `RoomSearchRoute`, `PublicRoomDetailRoute` và hàm hỗ trợ liên quan; giữ nguyên các hàm quản lý trong cùng tệp |
| Khai báo tuyến công khai | `src/routes/public-routes.tsx`: kiểm tra `rooms/:roomId` vẫn dùng `PublicRoomDetailRoute`; không tạo tuyến mới thay thế để né màn hiện có |
| Thành phần phụ/API/hook | Đặt trong `src/features/rooms`, được trang client thật sự sử dụng; dùng `PublicRoomDto` và API công khai |

Phạm vi loại trừ cụ thể: `ManagementRoomDetailPage.tsx`, `ManagementRoomsPage.tsx`,
`CreateRoomPage.tsx`, `EditRoomPage.tsx`, `RoomImageManagementPage.tsx`,
`src/routes/management-routes.tsx` và các màn `/management/*`, `/staff/*`.
Không dùng tiến độ hoặc ảnh chụp của các màn đó để báo hoàn thành kế hoạch client.
Không đưa số phòng nội bộ, trạng thái vận hành, lịch quản lý hoặc nút sửa/xóa lên
trang khách. Thành phần dùng chung nếu cần đổi phải kiểm tra hồi quy nơi đang dùng.

Kết quả rà soát cập nhật: trang client hiện đã thay đổi, có `RoomGalleryViewer`,
`RoomAmenityList`, `RoomStayPicker`, chia sẻ và thanh hành động di động. Tên phòng
vẫn nằm trong cột bên; ảnh chính và ảnh nhỏ chưa tạo bố cục nhiều góc nhìn như tham
khảo, các phần nội dung chủ yếu là thẻ xếp dọc. Cần nâng cấp tiếp cách trình bày,
giữ các tương tác đã làm và kiểm chứng lại; có mã chưa đồng nghĩa đã nghiệm thu.
Khi bắt đầu, đọc lại Git và mã mới nhất, bảo toàn thay đổi đang làm.

Thứ tự thực hiện: hoàn thành đợt 1–2 dưới đây ngay trên trang client; đợt 3–4 chỉ
triển khai sau khi đã có hợp đồng Backend/nội dung tương ứng. Nếu thiếu dữ liệu,
ghi rõ phần phụ thuộc; không chuyển sang sửa admin để thay thế đầu ra client.

Điều kiện nghiệm thu đúng đích:

- [ ] Mở `/rooms` bằng phiên khách hoặc chưa đăng nhập, bấm đúng nút “Xem chi tiết”.
- [ ] URL đích là `/rooms/<roomId>` và hiển thị phiên bản nâng cấp của `PublicRoomDetailPage`.
- [ ] Những phần mới của đợt đã làm xuất hiện trên chính trang này; chỉ tạo thành phần chưa nối vào trang không được tính hoàn thành.
- [ ] Mở trực tiếp URL trên và tải lại vẫn hoạt động; ngày/số khách được giữ theo thiết kế của đợt 2.
- [ ] Có kiểm thử hành trình từ danh sách tới chi tiết client, không chỉ kiểm thử tuyến quản lý.
- [ ] Có ảnh kiểm chứng máy tính và di động của `/rooms/<roomId>`, kèm URL, nguồn dữ liệu và kết quả kiểm thử thực chạy.
- [ ] Báo cáo bàn giao ghi từng đợt đã làm/chưa làm, tệp client đã đổi và phần đang chờ Backend/nội dung.

### Mục tiêu và căn cứ

Khách phải trả lời được: phòng có phù hợp số người và nhu cầu ngủ không, có tiện
nghi gì, hình ảnh ra sao, có thể đặt vào ngày muốn đi không, giá nào đã xác nhận và
cần biết điều gì trước khi tiếp tục. Hành động chính là chọn kỳ lưu trú và tiếp tục
đặt đúng phòng; việc mở trang hoặc nhấn nút không tự giữ chỗ.

**Yêu cầu bổ sung của chủ dự án:** nâng cấp cả khả năng tương tác của khách,
không nghiệm thu chỉ bằng đổi màu, thêm thẻ hoặc kéo dài mô tả. Khách phải thao tác
được từ xem ảnh, tìm thông tin đến chọn kỳ lưu trú và tiếp tục đặt phòng. Các chức
năng bắt buộc và phạm vi thông tin công khai dưới đây là tiêu chí cho GLM triển khai.

Đã đọc `PublicRoomDetailPage.tsx`, `PublicRoomDetailPage.test.tsx`,
`RoomRouteAdapters.tsx`, API/hook/lược đồ của phòng, `CreateBookingPage.tsx`, kiểu
sinh tự động và OpenAPI Backend cục bộ. Quy chuẩn hình ảnh theo `DESIGN.md`,
thông báo theo `CLIENT_FEEDBACK_STANDARD.md`. Chưa chạy đánh giá trực quan trên trang thật.

Các ghi nhận nền dưới đây mô tả vấn đề lúc lập kế hoạch ban đầu; một số tương tác
đã có mã triển khai sau đó. Dùng kết quả rà soát cập nhật phía trên và kiểm tra mã
mới nhất để xác định phần còn thiếu, không xây lại chức năng đã hoạt động.

| Ghi nhận nền lúc lập kế hoạch | Ảnh hưởng | Hướng xử lý |
| --- | --- | --- |
| Trang có ảnh chính/ảnh nhỏ, mô tả, nhãn tiện nghi, loại phòng, giường, sức chứa và giá cơ sở | Có dữ liệu nền nhưng ít hỗ trợ khách cân nhắc kỳ nghỉ cụ thể | Tổ chức thành các nhóm thông tin rõ ràng; bổ sung nội dung có nguồn |
| Tên phòng và nút chọn ở cột sau ảnh/mô tả; di động xếp cột đó xuống dưới | Khách biết phòng nào và bắt đầu đặt khá muộn | Đưa tên và thông tin cốt lõi lên đầu; đặt lựa chọn ngày gần phần đầu, hành động dễ tiếp cận |
| Ngày/số khách từ tìm kiếm nằm trong `location.state`, không được truyền vào phần hiển thị chi tiết | Khách không thấy rõ kỳ lưu trú đang chọn; liên kết chia sẻ không mang ngữ cảnh | Đưa ngày/số khách hợp lệ vào URL chi tiết, hiển thị và giữ qua đăng nhập/đặt phòng |
| Nút “Chọn phòng này” chuyển sang biểu mẫu; trang không kiểm tra phòng trống | Dễ nhầm một phòng có trong danh mục là có thể đặt cho mọi ngày | Phân biệt rõ chưa kiểm tra, đang kiểm tra và kết quả cho đúng kỳ lưu trú |
| Giá hiển thị là `roomType.basePrice` | Chưa phải báo giá cho số đêm/ngày cụ thể | Ghi “Giá cơ sở / đêm”; chỉ hiển thị tổng và phụ phí khi Backend cung cấp |
| Tiện nghi chỉ có tên dạng nhãn; mô tả phòng thay thế hoàn toàn mô tả loại phòng | Bỏ phí mô tả tiện nghi và ngữ cảnh loại phòng | Hiển thị tên kèm mô tả hữu ích; tránh lặp nội dung giữa hai loại mô tả |
| Quay lại dùng `navigate(-1)` | Mở trực tiếp có thể không quay về danh sách mong đợi | Quay về kết quả tìm kiếm đã giữ hoặc `/rooms` khi không có nguồn quay lại an toàn |
| Kiểm thử trực tiếp hiện tập trung vào tên/loại/sức chứa và không lộ số phòng | Chưa bảo vệ đầy đủ các hành vi mới | Bổ sung kiểm thử dữ liệu thiếu, ảnh, ngày/số khách, API và chuyển tiếp đặt phòng |

### Khách được xem gì và được làm gì?

Trang này là thông tin phòng công khai, dùng được khi chưa đăng nhập. Đăng nhập
khách hàng chỉ cần ở bước tạo đặt phòng theo bộ bảo vệ tuyến hiện có; không ép
đăng nhập để xem ảnh, tiện nghi, chọn ngày, tìm phòng hay chia sẻ liên kết.

| Nhóm | Được hiển thị/thực hiện trên chi tiết phòng client | Giới hạn nghiệp vụ |
| --- | --- | --- |
| Phòng và loại phòng | Tên, mô tả công khai, ảnh, loại giường/số lượng, sức chứa, tiện nghi | Chỉ dùng DTO công khai; ID tài nguyên có thể dùng để định tuyến, không cần trình bày như thông tin nổi bật |
| Kỳ lưu trú | Nhập/sửa ngày nhận–trả, số khách, xem số đêm, kiểm tra theo khả năng API | Chọn ngày không đặt chỗ; bộ chọn ngày không được tô ngày trống/bận từ dữ liệu suy đoán |
| Tình trạng có thể đặt | Kết quả phù hợp/còn trống cho chính kỳ lưu trú đã chọn nếu Backend công khai hỗ trợ | Không công khai người đang ở, mã đặt phòng khác, lý do khóa, lịch nội bộ hoặc nguyên nhân vận hành chi tiết |
| Giá và điều kiện | Giá cơ sở hiện có; giá theo kỳ, khoản thu và chính sách có nguồn khi được hỗ trợ | Không hiện doanh thu, giá vốn, dữ liệu thu tiền/hoàn tiền của khách khác; không suy tổng giá hoặc tuyên bố miễn phí |
| Đặt phòng | Chuyển đúng phòng/ngày/số khách sang biểu mẫu đặt phòng của khách; tiếp tục sau đăng nhập | Không gọi API đặt tại quầy, không tự chuyển trạng thái, không tạo giao dịch chỉ khi bấm chọn phòng |
| Hỗ trợ lựa chọn | Xem ảnh lớn, đọc thêm, tìm tiện nghi, chia sẻ liên kết và tìm phòng khác | Chỉ chia sẻ nội dung/URL công khai; không gửi token, thông tin liên hệ của khách hoặc dữ liệu phiên |
| Nội dung cơ sở | Địa chỉ công khai, liên hệ hỗ trợ, giờ nhận/trả, nội quy đã duyệt | Không tự lấy thông tin riêng của nhân viên làm thông tin liên hệ; không tự tạo nút hỗ trợ khi chưa có kênh thật |

Không dùng `ManagementRoomDto`, `RoomDto` nội bộ hoặc API `/management/*` để làm
nguồn cho trang này. Cụ thể, `RoomAvailabilitySummary` đang đọc `calendarSummary`
và hiển thị mã đặt phòng/lý do khóa; `RoomCalendarManager` có thao tác quản lý lịch.
**Không import hai thành phần này vào màn client**, kể cả khi ẩn một vài nút.
Nếu cần lịch chọn ngày công khai, dùng thành phần riêng với dữ liệu công khai đúng quyền.

Phần xem/hủy đặt phòng của chính khách và thanh toán/tra cứu giao dịch thuộc các
tuyến đặt phòng đã xác thực. Không nhúng bảng đặt phòng hay sổ giao dịch vào trang
phòng để tăng số chức năng. Quyền API do Backend kiểm tra, không chỉ ẩn thông tin bằng CSS.

### Các tương tác bắt buộc cho bản nâng cấp client

| Mã | Tính năng khách sử dụng | Hành vi cụ thể và kết quả mong đợi | Phạm vi triển khai |
| --- | --- | --- | --- |
| CLIENT-01 | Xem toàn bộ ảnh | Bấm ảnh chính hoặc “Xem tất cả N ảnh” mở bộ xem; chọn ảnh nhỏ, trước/sau, phím mũi tên, Escape; hiển thị ảnh thứ mấy; phóng to/thu nhỏ ảnh lớn, dùng được trên cảm ứng; đóng trả tập trung về nút mở | Đợt 1, ảnh hiện có |
| CLIENT-02 | Đi nhanh đến thông tin | Liên kết “Tổng quan”, “Chỗ ngủ”, “Tiện nghi”, “Chọn ngày”; chỉ thêm “Chính sách”/“Vị trí” khi có nội dung; bấm cuộn đến đúng vùng, không che tiêu đề dưới thanh cố định | Đợt 1, không cần API mới |
| CLIENT-03 | Đọc mô tả và tra tiện nghi | Mô tả dài có xem thêm/thu gọn; tiện nghi có tên và mô tả, xem toàn bộ; với danh sách dài cho tìm theo tên, xóa từ tìm và thông báo không khớp; danh sách ngắn hiển thị trực tiếp | Đợt 1, dùng dữ liệu hiện có; không cần nút tìm nếu danh sách đã ngắn |
| CLIENT-04 | Chọn và sửa kỳ lưu trú | Bộ chọn ngày có nhãn rõ, nhập bằng bàn phím; số khách có nút tăng/giảm và nhập trực tiếp, không vượt sức chứa đã công bố; hiển thị số đêm theo ngày thuần; có đổi ngày/xóa lựa chọn | Đợt 2; chỉ chọn tổng số khách, chưa thêm phân loại người lớn/trẻ em khi hợp đồng chưa hỗ trợ |
| CLIENT-05 | Tiếp tục đặt đúng phòng | Một nút chính theo trạng thái; giữ phòng/ngày/số khách sang biểu mẫu và sau đăng nhập; giải thích chưa giữ chỗ, không thu tiền tại trang chi tiết | Đợt 2; luồng cụ thể ở bảng hành động bên dưới |
| CLIENT-06 | Chia sẻ phòng | Nút “Chia sẻ” mở khả năng chia sẻ của thiết bị nếu có; dự phòng sao chép URL, báo “Đã sao chép liên kết” đúng kết quả; nếu sao chép thất bại cho chọn/copy thủ công | Đợt 2; URL chỉ gồm nguồn/trang phòng và ngày/số khách hợp lệ nếu đang chọn; loại tham số lạ và dữ liệu riêng tư; hủy chia sẻ không báo lỗi |
| CLIENT-07 | Quay lại hoặc tìm phòng khác | Quay về danh sách/kết quả đúng ngữ cảnh; “Tìm phòng khác” giữ ngày/số khách, bỏ điều kiện loại phòng nếu khách muốn mở rộng; không mất dữ liệu khi quay lại | Đợt 2; không suy phòng khác còn trống nếu chưa có kết quả tìm theo kỳ |
| CLIENT-08 | Đặt phòng thuận tiện trên di động | Thanh dưới tóm tắt giá cơ sở hoặc giá đã xác nhận và hành động hiện tại; mở/chuyển tập trung tới cùng khối chọn ngày; ẩn khi bàn phím/hộp xem ảnh làm che nội dung | Đợt 2; cùng một nguồn trạng thái với biểu mẫu chính, không gửi yêu cầu hai lần |

Những tiện ích làm được bằng dữ liệu công khai không cần chờ API báo giá. Không
đặt các nút giả, nút không phản hồi hoặc nút chỉ thông báo “sắp ra mắt” để đủ bảng.
Số đêm là thông tin khoảng ngày, không phải phép tính giá; tính theo ngày lưu trú,
không theo số giờ thực tế hoặc múi giờ trình duyệt.

Chưa đưa vào đợt này: yêu thích đồng bộ tài khoản, viết đánh giá, chat, mã giảm giá,
đặt nhiều phòng, chọn dịch vụ thêm hoặc chọn một phòng vật lý khác trong loại phòng.
Các luồng đó cần hợp đồng và quy tắc riêng. Ưu tiên làm đủ tám tương tác gắn với
hành trình hiện tại trước khi đề xuất mở rộng.

### Hành động chính theo trạng thái của khách

Chốt một luồng mặc định cho GLM, không để tự chọn giữa các phương án mâu thuẫn:

| Trạng thái | Nút chính | Kết quả |
| --- | --- | --- |
| Chưa đủ ngày/số khách | “Chọn ngày lưu trú” | Chuyển tập trung tới trường còn thiếu; không gọi API và không chuyển trang |
| Đầu vào không hợp lệ | “Tiếp tục đặt phòng” hoặc “Kiểm tra phòng trống” theo giai đoạn | Kiểm tra biểu mẫu, chỉ rõ lỗi cạnh trường; không gửi yêu cầu |
| Đầu vào hợp lệ, API hiện tại chưa kiểm tra trực tiếp theo phòng | “Tiếp tục đặt phòng” | Giữ đúng phòng sang biểu mẫu hiện có; dòng hỗ trợ: “Phòng sẽ được kiểm tra lại khi bạn gửi yêu cầu đặt.”; “Tìm phòng khác” là liên kết phụ, không bắt khách tìm lại để chọn đúng phòng vừa xem |
| Đầu vào hợp lệ, đã có API kiểm tra theo phòng | “Kiểm tra phòng trống” | Đọc kết quả công khai cho đúng phòng/ngày/số khách; không tạo đặt phòng |
| Đang kiểm tra | “Đang kiểm tra…” | Khóa gửi lặp, vẫn cho khách sửa lựa chọn và hủy kết quả cũ |
| Backend xác nhận còn trống cho lựa chọn hiện tại | “Tiếp tục đặt phòng” | Sang biểu mẫu; nhắc “Chưa giữ chỗ”; Backend vẫn kiểm tra lại khi tạo đặt phòng |
| Backend xác nhận không còn trống | “Đổi ngày” | Mở lại phần ngày; liên kết phụ “Tìm phòng khác” giữ kỳ lưu trú |
| Không đọc được kết quả | “Thử lại” | Giữ lựa chọn, hiển thị lỗi cục bộ; không chuyển thành hết phòng |
| Kết quả cũ sau đổi ngày/số khách | “Kiểm tra phòng trống” khi API đã hỗ trợ | Loại nhãn còn trống/giá cũ; không dùng phản hồi của lựa chọn trước |

Khi khách chưa đăng nhập bấm tiếp tục với dữ liệu hợp lệ, dùng luồng đăng nhập
hiện có và trở lại đúng biểu mẫu đặt phòng. Không hỏi khách chọn vai trò, không
đổi quyền của STAFF/ADMIN và không tự tạo tài khoản. Xem phòng luôn công khai.

### Định hướng hình ảnh theo tham khảo của chủ dự án

**Yêu cầu mới nhất: trang phải giàu hình ảnh, có bối cảnh lưu trú và đủ thông tin
để khách muốn tìm hiểu rồi đặt phòng.** Không nghiệm thu chỉ vì đã thêm đủ nút.
Tham khảo ảnh chủ dự án gửi: tên và thông tin nhận diện phía trên, nhiều góc ảnh
cùng xuất hiện, tiện nghi dễ quét, mô tả có chiều sâu, vùng chọn kỳ nghỉ rõ ràng.
Giữ màu, chữ, thành phần và `max-w-app` của Homestay Green trong `DESIGN.md`.
Không thu nhỏ chữ theo mật độ của ảnh chụp tham khảo.

| Mẫu trong ảnh tham khảo | Cách áp dụng đúng cho HBMS |
| --- | --- |
| Thanh điều hướng các phần | Thanh liên kết ngang có trạng thái phần đang xem: Tổng quan, Hình ảnh, Chỗ ngủ, Tiện nghi, Chọn kỳ lưu trú; chỉ thêm Chính sách/Vị trí khi có nội dung thật |
| Tên cơ sở và thông tin ngay đầu | Đưa `room.name` thành H1 trên toàn chiều rộng trước ảnh; dòng phụ là loại phòng, tối đa bao nhiêu khách, cấu hình giường; chia sẻ và nút chọn ngày bên phải |
| Ảnh lớn phối ảnh phụ và hàng ảnh nhỏ | Cụm ảnh bất đối xứng, một ảnh chủ đạo và hai góc chụp phụ nhìn thấy đồng thời; hàng ảnh xem trước có giới hạn và nút xem tất cả |
| Cột đánh giá và bản đồ cạnh ảnh | Dùng cột tóm tắt phòng thật: loại phòng, sức chứa, chỗ ngủ, giá cơ sở, nút chọn ngày; không thay bằng điểm đánh giá hoặc bản đồ giả |
| Tiện nghi nổi bật và mô tả dài | Dải tiện nghi có biểu tượng, phần giới thiệu dùng mô tả phòng và loại phòng không trùng, danh sách tiện nghi đầy đủ có mô tả và tìm kiếm |
| Bảng phòng trống và nhiều mức giá | Chuyển thành vùng chọn kỳ lưu trú cho **một phòng đang xem**, ngày/số khách và tóm tắt lựa chọn; API hiện tại không có nhiều gói giá hay chọn số lượng phòng |
| Ưu đãi thành viên, đánh giá, cam kết giá | Chưa có hợp đồng/dữ liệu thì không triển khai; không dùng banner đăng nhập giảm giá, giá gạch ngang, lời chứng thực hoặc khan hiếm giả để lấp chỗ |

### Bố cục bắt buộc cho đợt nâng cấp hình ảnh

Sơ đồ máy tính, từ rộng 1024 px; khi không đủ chỗ cho cột bên tối thiểu khoảng
300 px thì chuyển bố cục xếp dọc. Khung trang tối đa 1280 px theo hệ hiện tại.

```text
Quay về kết quả khám phá phòng
TÊN PHÒNG                                      Chia sẻ   Chọn ngày
Loại phòng · Tối đa N khách · Cấu hình giường
Tổng quan | Hình ảnh | Chỗ ngủ | Tiện nghi | Chọn kỳ lưu trú

┌───────────────────────────────┬─────────────┬────────────────────┐
│                               │ Ảnh phụ 1   │ Tóm tắt căn phòng  │
│       ẢNH CHỦ ĐẠO             ├─────────────┤ Chỗ ngủ / sức chứa │
│                               │ Ảnh phụ 2   │ Giá cơ sở / đêm    │
│                               │             │ Chọn ngày lưu trú  │
└───────────────────────────────┴─────────────┴────────────────────┘
  Hàng ảnh xem trước trong chiều rộng vùng ảnh · Xem tất cả N ảnh
  Dải tiện nghi nổi bật có biểu tượng, trải theo chiều ngang

┌────────────────────────────────────────────┬────────────────────┐
│ Về căn phòng này                           │ Tóm tắt lựa chọn   │
│ Mô tả dễ đọc, khai thác nội dung đã có      │ Ngày / khách / đêm │
│ Không gian và chỗ ngủ                      │ Giá cơ sở / đêm    │
│ Tiện nghi đầy đủ + mô tả + tìm kiếm        │ Sửa ngày / tiếp tục│
│ Điều cần biết / vị trí (khi có nguồn)      │                    │
└────────────────────────────────────────────┴────────────────────┘
CHỌN KỲ LƯU TRÚ — toàn chiều rộng, vùng quyết định nổi bật
Ngày nhận phòng | Ngày trả phòng | Số khách
Tên phòng · Chỗ ngủ · Số đêm       Giá cơ sở / đêm   Tiếp tục đặt phòng
Tìm phòng khác (giữ kỳ lưu trú hợp lệ)
```

Cột tóm tắt cạnh ảnh và cột tóm tắt lựa chọn là **cùng một thành phần bám khi
cuộn**, không dựng hai thẻ đặt phòng nối tiếp nhau. Bố trí bằng lưới hoặc vùng
bám phù hợp; thanh điều hướng nằm dưới đầu trang và không che tiêu đề khi nhảy
đến phần. Các nút đầu trang/cột bên cuộn tới bộ chọn ngày; khi dữ liệu hợp lệ,
hành động tiếp tục dùng chung xử lý hiện có. Chỉ có một bộ chọn ngày chính.

#### Ảnh phải tạo được cảm giác về không gian

- Máy tính: vùng ảnh chiếm khoảng 3/4 chiều rộng, cột tóm tắt khoảng 1/4; trong
  vùng ảnh, ảnh chủ đạo chiếm 2/3, hai ảnh phụ xếp dọc chiếm 1/3. Chiều cao cụm
  khoảng 380–460 px tùy chiều rộng; khoảng cách ảnh 6–8 px, bo góc ngoài 12–16 px.
- Sắp ảnh bìa đầu tiên, phần còn lại theo `sortOrder` ổn định. Với ít nhất ba ảnh,
  hiển thị ba ảnh khác nhau trong cụm. Với hai ảnh, dùng hai khung cạnh nhau; một
  ảnh dùng một khung rộng; không ảnh thì khung thay thế gọn, vẫn thấy thông tin đặt.
- Hàng xem trước tối đa sáu ảnh; nếu còn ảnh, ô cuối mở bộ xem với nhãn số lượng
  chính xác. Không render toàn bộ ảnh thành nhiều hàng đẩy nội dung xuống xa.
- Bấm từng ô mở đúng ảnh trong `RoomGalleryViewer`; giữ phím trước/sau, Escape,
  bộ đếm và trả điểm tập trung. Trong bộ xem, ưu tiên xem trọn ảnh bằng `contain`;
  ảnh lưới có thể cắt bằng `cover`, không làm méo ảnh.
- Dùng ảnh thật của chính phòng từ Backend. Không tự thêm ảnh stock, không suy
  ảnh phòng tắm/ban công thành tiện nghi được bảo đảm khi dữ liệu chưa xác nhận.
- Trên điện thoại: tên và thông tin chính trước ảnh, ảnh lớn tỷ lệ 4:3 và hàng
  xem trước cuộn ngang, bộ đếm luôn dễ thấy; không ép ba cột nhỏ từ máy tính xuống.

#### Nội dung đầy đặn từ dữ liệu project

| Vùng | Nội dung cần khai thác | Trình bày và tương tác |
| --- | --- | --- |
| Nhận diện | `name`, `roomType.name`, `maxGuests`, cấu hình `beds` | H1 khoảng 28–36 px trên máy tính, 24–28 px trên di động; không để tên phòng sau ảnh/mô tả hoặc chỉ trong cột bên |
| Tiện nghi nổi bật | Tối đa sáu tiện nghi thực tế đầu danh sách theo thứ tự ổn định; ưu tiên biên tập chỉ khi có nguồn | Dải ô gọn có biểu tượng và tên, không cắt tên; liên kết “Xem tất cả N tiện nghi”; không tự gắn nhãn “được yêu thích nhất” |
| Về căn phòng này | `room.description`, sau đó `roomType.description` nếu có nội dung bổ sung | Giữ đoạn và xuống dòng, chuẩn hóa khoảng trắng để tránh lặp; hiển thị khoảng 2–3 đoạn đầu trước “Đọc thêm”, có “Thu gọn”; không viết thêm lời hứa về yên tĩnh, riêng tư hay vị trí |
| Không gian và chỗ ngủ | Loại/số lượng giường có cấu trúc, tổng sức chứa | Mỗi cấu hình giường có biểu tượng và số lượng dễ đọc, một dòng sức chứa; không lặp nguyên mô tả loại phòng đã trình bày phía trên |
| Tiện nghi đầy đủ | Tên và `description` từng tiện nghi | Hai cột trên máy tính, một cột trên điện thoại, tên rõ và mô tả dễ đọc; tìm kiếm khi danh sách dài, thông báo không khớp và xóa tìm; phân nhóm chỉ khi dữ liệu có danh mục |
| Kỳ lưu trú | `RoomStayPicker`, số đêm hợp lệ, tên phòng, giá cơ sở | Biểu mẫu nổi bật, nhãn trường rõ, tóm tắt lựa chọn sát nút tiếp tục; giữ nguyên nhập liệu qua URL/đăng nhập; chưa có báo giá thì không hiện tổng tiền tự tính |
| Nội dung mở rộng | Chính sách, vị trí, hỗ trợ từ nguồn công khai được duyệt | Hiển thị thành phần riêng khi có dữ liệu; không dựng nhiều hộp “đang cập nhật” để kéo dài trang |

Biểu tượng dùng thư viện/thành phần project đang có. Chỉ dùng biểu tượng chuyên
biệt khi ánh xạ tiện nghi đáng tin cậy; trường hợp chưa biết dùng biểu tượng trung
tính, không đoán tiện nghi từ từ khóa để tạo nhóm nghiệp vụ mới.

Chữ hướng tới khách: “Tiện nghi dành cho kỳ nghỉ”, “Không gian và chỗ ngủ”, “Chọn
kỳ lưu trú”. Bỏ câu kỹ thuật như “Tiện nghi thuộc cấu hình loại phòng…”. Giá luôn
ghi “Giá cơ sở / đêm”; giải thích ngắn cạnh lựa chọn rằng phòng được kiểm tra lại
khi gửi yêu cầu đặt. Không rải cùng một giải thích ở mọi khối.

Nội dung chính cỡ 16–18 px, giãn dòng 1.6–1.75; độ dài dòng mô tả khoảng 60–75 ký
tự. Dùng tiêu đề, đường phân cách và khoảng cách 24–40 px giữa các phần; giữ thẻ
nổi bật cho tóm tắt đặt phòng và bộ chọn kỳ lưu trú. Không bọc mọi đoạn trong các
thẻ bo góc có bóng giống nhau. Nhấn bằng ảnh và phân cấp chữ; không dùng `font-black`
cho hàng loạt tiêu đề, nhãn và giá.

Di động: tên → ảnh → giá cơ sở và lối tới bộ chọn ngày → tiện nghi nổi bật → mô tả/
chỗ ngủ/tiện nghi → bộ chọn kỳ lưu trú. Ở 768 px có thể dùng cụm ảnh hai cột nhưng
phần nội dung vẫn xếp dọc nếu cột đặt phòng quá hẹp. Thanh hành động dưới dùng cùng
trạng thái, chỉ hiện khi nút chính ngoài vùng nhìn; ẩn khi mở ảnh hoặc bàn phím
che biểu mẫu, chừa vùng an toàn và khoảng cuối trang. Không che lỗi hay nút footer.

#### Thứ tự giao việc cho GLM và nghiệm thu hình ảnh

1. Đọc bản client mới nhất, giữ `RoomGalleryViewer`, `RoomAmenityList`,
   `RoomStayPicker`, `room-stay.ts` và luồng URL/đăng nhập đã có; sửa các phần thiếu
   thay vì tạo bản song song. Kiểm tra thực tế “Đọc thêm”: mã hiện có nhánh
   `roomDescription` trả cùng một giá trị ở cả hai nhánh, chưa tạo tương tác thu gọn.
2. Thực hiện H1 trước ảnh, lưới ảnh phối nhiều góc, hàng ảnh giới hạn và cột tóm
   tắt theo sơ đồ; đây là thay đổi thị giác bắt buộc của đợt 1, không chờ API mới.
3. Khai thác mô tả/giường/tiện nghi có sẵn, đổi nhịp các phần và câu chữ cho khách;
   nối lại bộ chọn kỳ lưu trú cùng các tương tác CLIENT-01–08, không đổi nghiệp vụ.
4. Chụp màn client trước/sau cùng phòng, cùng kích thước; kiểm tra cả phần đầu
   trang và toàn trang ở 375, 768, 1280, 1440 px, kiểm tra tràn tại 320 px. Ảnh
   nghiệm thu phải từ `/rooms/<roomId>` mở qua “Khám phá phòng → Xem chi tiết”.
5. Chạy kiểm tra phù hợp phía dưới. Ghi riêng phần đã làm, phần thiếu dữ liệu và
   lỗi còn lại; không kết luận đạt chất lượng hình ảnh chỉ vì build thành công.

- [ ] Vùng đầu trang thấy tên, loại phòng, ảnh nhiều góc khi có ảnh, giá cơ sở và bước tiếp theo; không còn tên phòng bị đẩy xuống sau nội dung trên điện thoại.
- [ ] Với phòng có nhiều ảnh, bố cục thể hiện rõ ảnh chủ đạo và ảnh phụ; 0/1/2/3/7/20 ảnh không tạo ô giả, trùng ảnh hoặc hàng ảnh kéo dài vô hạn.
- [ ] Mô tả phòng, nội dung bổ sung của loại phòng, giường và mô tả tiện nghi được khai thác mà không lặp nguyên văn hoặc bịa thông tin.
- [ ] Trang có nhịp ảnh → thông tin dễ quét → mô tả chi tiết → quyết định lưu trú; không còn một chuỗi thẻ đồng dạng hoặc cột trắng dài vô ích.
- [ ] Tên dài, mô tả dài và nhiều tiện nghi không phá bố cục; nút, bộ chọn ngày và nội dung còn dùng được khi phóng to 200%.
- [ ] Chọn ngày, số khách, xem ảnh, tìm tiện nghi, chia sẻ và tiếp tục đặt vẫn hoạt động; thanh bám không che nội dung.
- [ ] Không có điểm đánh giá, ưu đãi, vị trí, chính sách, diện tích, gói giá hay trạng thái phòng trống giả từ ảnh tham khảo.

Nếu dữ liệu thật quá ít, vẫn hoàn thành bố cục thích ứng và các tương tác hiện có,
đồng thời bàn giao danh sách nội dung cần người quản lý bổ sung: ảnh nhiều góc của
chính phòng, mô tả phòng cụ thể, mô tả loại phòng không trùng và mô tả tiện nghi.
Không tự sửa dữ liệu production. Dữ liệu phong phú dùng kiểm thử phải được ghi rõ
là dữ liệu mô phỏng; không dùng ảnh kiểm thử để tuyên bố nội dung thật đã đầy đủ.

### Dữ liệu hiện có và phần cần bổ sung

| Nhóm | Nguồn hiện tại | Quyết định |
| --- | --- | --- |
| Tên/mô tả phòng | `PublicRoomDto.name`, `description` | Dùng ngay; chuỗi rỗng được xử lý như thiếu, không chỉ kiểm tra `null` |
| Loại phòng và mô tả | `roomType.name`, `description` | Dùng ngay, phân biệt rõ với thông tin riêng phòng |
| Chỗ ngủ/sức chứa | `roomType.beds`, `maxGuests`; `bedType` cũ | Ưu tiên cấu hình giường có cấu trúc qua bộ định dạng hiện có; chỉ dùng trường cũ làm dự phòng |
| Tiện nghi | `roomType.amenities[].name/description` | Dùng ngay; không suy ra tiện nghi riêng từng phòng ngoài hợp đồng loại phòng |
| Ảnh | `images[].imageUrl/isCover/sortOrder` | Dùng ngay; chốt thứ tự hiển thị ổn định, ảnh bìa làm ảnh đầu; không suy ảnh thành loại giường/diện tích |
| Giá | `roomType.basePrice` dạng chuỗi thập phân | Dùng nhãn giá cơ sở; chưa tự nhân số đêm thành tổng tiền phải trả |
| Phòng trống | `GET /api/v1/rooms/search` theo ngày/số khách, kết quả phân trang; chưa có lọc `roomId` | Chưa đủ cho kiểm tra trực tiếp một phòng hiệu quả; cần hợp đồng riêng hoặc mở rộng API hiện có |
| Báo giá theo kỳ lưu trú | Chưa có trong phản hồi chi tiết phòng đang đọc | Đề xuất Backend trả kết quả tính giá, tiền tệ, các khoản thu và điều kiện hiệu lực; chưa đặt tên endpoint thành hợp đồng chính thức |
| Diện tích, phòng tắm, tầm nhìn, tầng, khả năng tiếp cận | Chưa có trường tương ứng trong `PublicRoomDto`/loại phòng | Backend và người quản lý nội dung chốt trường thuộc phòng hay loại phòng, đơn vị, giá trị rỗng và đường nhập/sửa |
| Nội quy, giờ nhận/trả, chính sách hủy/thanh toán/hoàn tiền | Chưa có nội dung công khai có cấu trúc trong API phòng | Chốt nguồn chính sách cấp cơ sở/loại phòng/kỳ đặt, phiên bản và phạm vi áp dụng; không tự hứa miễn phí hủy/hoàn |
| Vị trí và hỗ trợ | Chưa có trong API phòng | Cần nội dung cơ sở được xác nhận; không tự tạo địa chỉ, số điện thoại hoặc khoảng cách |

Không bổ sung trường giao diện nếu không có người nhập và cách bảo trì dữ liệu.
Nội dung mới phải được quản lý từ Backend hoặc nguồn nội dung do sản phẩm xác nhận;
không tạo dữ liệu mẫu thành sự thật trong bản triển khai. Chưa có đánh giá, số lượt
đặt, giảm giá, “chỉ còn một phòng”, bữa sáng miễn phí hay chính sách trẻ em/thú cưng
thì không hiển thị các tuyên bố đó.

### Quy tắc kiểm tra phòng và chuyển tiếp đặt phòng

1. Mở từ tìm kiếm: URL chi tiết chứa `checkIn`, `checkOut`, `guests` hợp lệ. Mở
   trực tiếp: chưa có ngày thì yêu cầu chọn, không tự tuyên bố phòng trống.
2. Kiểm tra ngày có thật, thứ tự ngày, số khách nguyên dương và sức chứa đã biết;
   tái sử dụng lược đồ/hàm ngày hiện có. Quy tắc nghiệp vụ giới hạn đặt trước, số
   đêm, ngày quá khứ theo Backend; không rải hằng số riêng trong trang.
3. Khi chưa có API kiểm tra theo phòng, giữ nút chính “Tiếp tục đặt phòng” theo
   bảng hành động: đầu vào hợp lệ chuyển đúng phòng sang biểu mẫu, không gắn nhãn
   còn trống. “Tìm phòng khác” là liên kết phụ giữ ngày/số khách, không thay nút chính.
4. Khi Backend hỗ trợ: yêu cầu kiểm tra gắn với `roomId + checkIn + checkOut + guests`.
   Đổi bất kỳ giá trị nào làm kết quả cũ không còn được dùng; hủy/bỏ phản hồi đến
   muộn, không cho kết quả ngày cũ ghi đè ngày mới.
5. Không dùng thiếu ID trong một trang kết quả tìm kiếm để kết luận hết phòng.
   Không gọi lịch quản lý từ trang khách, không suy phòng trống từ trạng thái vận hành.
6. Kết quả kiểm tra là tại thời điểm đọc, không phải giữ phòng. Khi tiếp tục, truyền
   đúng phòng/ngày/số khách sang `/bookings/new/:roomId`; giữ ngữ cảnh sau đăng nhập,
   không tạo đặt phòng chỉ bằng hành động xem hoặc chọn.
7. Backend kiểm tra lại khi tạo đặt phòng. Gặp xung đột: giữ lựa chọn, giải thích,
   làm mới dữ liệu liên quan và cho tìm phương án khác; không báo lỗi kỹ thuật thô.
8. Nếu bổ sung báo giá, Backend sở hữu phép tính và thời hạn hiệu lực nếu có.
   Thay đổi lựa chọn làm hết hiệu lực báo giá cũ; kiểm tra lại ở bước xác nhận, không
   gửi tổng tiền tự tính hoặc coi báo giá là kết quả thanh toán.

### Trạng thái và trường hợp biên

| Tình huống | Hành vi cần đạt |
| --- | --- |
| Đang tải chi tiết | Khung chờ khớp bố cục, giữ vị trí và khả năng quay lại |
| Không tìm thấy/không còn được công khai | Giải thích ngắn, về danh sách/tìm phòng; không thử API nội bộ để lấy dữ liệu |
| Lỗi tải chi tiết | Thử lại an toàn; khác với phòng không còn trống theo ngày |
| 0, 1 hoặc nhiều ảnh; ảnh lỗi | Bố cục ổn định, không nhân ảnh; ảnh lỗi có thay thế, bộ xem ảnh vẫn đóng được |
| Thiếu mô tả/giường/tiện nghi | Không suy “không có” từ dữ liệu chưa nhập; thông báo gọn ở phần cần thiết, bỏ vùng tùy chọn trống |
| Chưa có ngày hoặc ngày sai | Lỗi cạnh trường và hướng chọn; chưa gửi yêu cầu kiểm tra |
| Đang kiểm tra hoặc báo giá | Khóa gửi lặp; không hiển thị kết quả cũ như còn hiệu lực |
| Còn trống/hết chỗ/không phù hợp | Nội dung đúng kết quả Backend, có bước tiếp; không dùng màu là tín hiệu duy nhất |
| API kiểm tra lỗi/`429` | Không kết luận hết phòng; giữ dữ liệu, thử lại theo thời gian chờ |
| Chưa đăng nhập hoặc phiên hết hạn | Xem thông tin công khai bình thường; khi cần xác thực giữ URL an toàn và ngữ cảnh đặt |
| Đang đăng nhập STAFF/ADMIN | Theo chính sách tài khoản hiện có; không tự tạo đặt phòng khách bằng phiên nhân viên |
| URL bị sửa, đổi phòng, đổi ngày nhanh | Kiểm tra đầu vào, đặt lại ảnh/kết quả đúng phòng, bỏ phản hồi cũ |

### Các đợt triển khai và đầu ra

| Đợt | Phạm vi | Điều kiện hoàn tất |
| --- | --- | --- |
| 1 — FE với dữ liệu có sẵn | Sắp lại thông tin và thực hiện CLIENT-01–03: bộ xem ảnh tương tác, liên kết đến từng phần, đọc thêm/tìm tiện nghi; cấu hình giường và giá cơ sở đúng nghĩa | Dùng đúng `PublicRoomDto`; tương tác chạy được bằng chuột/bàn phím/cảm ứng; không chỉ thay bố cục |
| 2 — Tiện ích và ngữ cảnh đặt phòng | CLIENT-04–08: ngày/số khách trên trang và URL, tiếp tục đúng phòng qua đăng nhập, chia sẻ, quay về kết quả/tìm phòng khác và thanh thao tác di động | Tám tương tác client hoàn chỉnh theo điều kiện áp dụng; không mất lựa chọn, không tạo xác nhận phòng trống/tổng tiền giả |
| 3 — Backend hỗ trợ quyết định | Chốt API kiểm tra theo phòng và báo giá; đặc tả quyền công khai, yêu cầu/phản hồi, lỗi, tiền/ngày, tính hiệu lực; sinh OpenAPI rồi nối hook và giao diện | Kiểm thử ngày đổi nhanh, hết phòng, lỗi, giá đổi, xung đột khi tạo đặt phòng; dữ liệu đúng Backend |
| 4 — Nội dung nghiệp vụ mở rộng | Thông số phòng, chính sách, vị trí/liên hệ; chốt chủ sở hữu dữ liệu và công cụ nhập/sửa, sau đó mở từng vùng | Mọi nội dung có nguồn, đúng phòng/kỳ đặt và có thể bảo trì; thiếu dữ liệu không tạo tuyên bố sai |
| 5 — Nghiệm thu hành trình | Kiểm thử xuyên tìm kiếm → chi tiết → đăng nhập → tạo đặt phòng → xử lý kết quả, ảnh và khả năng tiếp cận | Các cổng kiểm tra phù hợp đạt; bằng chứng mô phỏng và Backend thật ghi riêng |

Đợt 1–2 có thể làm trên hợp đồng hiện tại. Đợt 3–4 phụ thuộc Backend và nội dung;
không ghi toàn bộ kế hoạch hoàn tất nếu mới đổi bố cục. Không đưa cập nhật thời gian
thực hoặc chức năng quản lý phòng vào phạm vi.

### Vị trí mã dự kiến và kiểm thử

- Trang điều phối: `src/features/rooms/pages/PublicRoomDetailPage.tsx`; các phần
  thư viện ảnh, tổng quan, tiện nghi và chọn kỳ lưu trú đặt trong tính năng phòng
  khi đủ phức tạp, không tạo lớp thành phần chung chỉ để giảm số dòng.
- Ngữ cảnh tuyến: `src/routes/RoomRouteAdapters.tsx`; tái sử dụng quy tắc đích an
  toàn và biểu mẫu đặt phòng hiện có. API/hook/khóa truy vấn/lược đồ nằm trong
  `src/features/rooms`; kiểu hợp đồng chỉ sinh qua công cụ.
- Dùng `Button`, `Card`, `Field`, `Input`, `Alert`, `ErrorState`, `Skeleton`,
  `RoomImage` và hàm định dạng hiện có. Bộ xem ảnh tái sử dụng cơ chế quản lý tập
  trung/hộp thoại đã có nếu phù hợp; không dùng hộp thoại xác nhận như bộ ảnh.
- Đơn vị/thành phần: chọn ảnh/đóng/mở, mô tả rỗng, tên dài, giường mới/cũ, tiện nghi,
  giá cơ sở, ngày/sức chứa, phản hồi lỗi và dữ liệu kiểm tra hết hiệu lực.
- Bổ sung kiểm thử tám tương tác: phóng ảnh/phím mũi tên/đóng trả tập trung, liên kết
  đến phần, tìm tiện nghi không khớp và xóa tìm, tăng/giảm/nhập số khách, số đêm,
  chia sẻ thành công/hủy/thất bại/dự phòng, dữ liệu một nguồn cho thanh di động.
- Kiểm thử ranh giới client: trang xem được khi chưa đăng nhập; không gửi yêu cầu
  `/management/*`, không dùng `calendarSummary` hoặc lộ mã đặt phòng/lý do khóa;
  chia sẻ không có token/thông tin khách. Tiếp tục không tự POST đặt phòng/thanh toán
  trước khi người dùng gửi biểu mẫu của luồng tương ứng.
- Tuyến/E2E: mở trực tiếp, URL sửa, chia sẻ, quay lại, đổi ngày, phiên khách/nhân
  viên, đăng nhập giữ ngữ cảnh, thao tác lặp, hết phòng và lỗi mạng khi tiếp tục.
- Kiểm tra ở rộng 375, 768, 1280, 1440 px và kiểm tra tràn tại 320 px; phóng to 200%,
  bàn phím, Escape, trả điểm tập trung và chế độ giảm chuyển động. Thử tên 120 ký tự,
  mô tả dài, 0/1/nhiều ảnh, nhiều tiện nghi; không tạo giới hạn nghiệp vụ mới từ số mẫu.
- Ảnh đầu ưu tiên tải; ảnh ngoài màn hình tải trì hoãn, giữ tỷ lệ để tránh xê dịch.
  Chỉ tải kiểm tra phòng/báo giá khi đầu vào hợp lệ; không tải sẵn mọi ngày hoặc mọi
  phòng. Đo yêu cầu mạng để phát hiện gọi lặp.
- Chạy kiểm tra kiến trúc, kiểu, quy tắc mã, đơn vị/thành phần, bản dựng và E2E liên
  quan; chạy kiểm tra hợp đồng khi thay API. Ghi kết quả thực tế trước nghiệm thu.

Các quyết định cần chốt trong đợt phụ thuộc: API kiểm tra/báo giá dùng mới hay mở
rộng API hiện có; thông số thuộc phòng hay loại phòng; nguồn và người duyệt chính
sách; cách duy trì nội dung cơ sở. Không cần chốt các mục đó để bắt đầu đợt 1–2.

## Quy trình cho một đợt thay đổi

1. Chốt tính năng và luồng liên quan; đọc trạng thái Git để bảo toàn việc đang làm.
2. Đối chiếu API, loại tài khoản/vai trò, yêu cầu và phản hồi bằng OpenAPI; kiểm tra
   Backend thực tế khi hành vi phụ thuộc dữ liệu hoặc chuyển trạng thái.
3. Dùng kiểu sinh tự động; kiểm tra trường bắt buộc/tùy chọn, giá trị rỗng, mã trạng
   thái, tiền, ngày và phân trang. Chỉ sinh lại khi hợp đồng thay đổi.
4. Kiểm tra tải dữ liệu, rỗng, lỗi, thành công, biểu mẫu, quyền, xung đột, thử lại,
   chống gửi lặp và làm mới bộ nhớ đệm. Không nhân đôi quy tắc Backend.
5. Kiểm thử hành vi thay đổi; bổ sung hành trình trình duyệt cho luồng quan trọng.
   Đối chiếu [thiết kế](../../DESIGN.md) và [phản hồi](../CLIENT_FEEDBACK_STANDARD.md)
   trên máy tính, di động, bàn phím và phóng to văn bản.
6. Chạy lệnh phù hợp trong [hướng dẫn dự án](../../readme.md), ghi kết quả thực chạy,
   lỗi cũ/mới và giới hạn môi trường. Không dùng kết quả lịch sử thay thế.
7. Rà soát bản khác biệt và cập nhật mục việc liên quan tại đây; không tạo tệp tiến độ
   riêng lặp lại bảng này.

## Những hành trình cần bảo vệ

- Khách đăng ký → đăng nhập → tìm phòng → đặt phòng → khởi tạo VNPay một lần →
  quay về → xác nhận kết quả từ Backend.
- Nhân viên đăng nhập → chọn phòng trống tại quầy → đặt phòng → thu tiền → nhận/trả phòng.
- Quản trị viên tạo tiện nghi → loại phòng → phòng → ảnh/ảnh bìa → khóa/mở lịch.
- Khóa tài khoản khách hoặc nhân viên → yêu cầu tiếp theo phản ánh quyền hiện tại.
- Hoàn tiền → chờ xử lý/đối soát → tải lại đặt phòng, thanh toán và phòng trống.

Kiểm thử mô phỏng và kiểm thử với Backend thật phải ghi riêng. Nhiều lần đăng nhập
có thể gặp `429`; chia đợt trên môi trường kiểm thử, không hạ giới hạn tần suất
của ứng dụng để làm kiểm thử đạt.

## Rủi ro cần theo dõi

| Rủi ro | Cách kiểm soát |
| --- | --- |
| OpenAPI ở repo khác, có thể lệch với Frontend | Sinh hợp đồng và chạy `contract:check`, `contract:test` sau thay đổi Backend |
| Điều hướng sai không gian tài khoản | Kiểm thử khách/STAFF/ADMIN, đổi tài khoản, khôi phục phiên và `returnTo` |
| Nhiều thay đổi đồng thời trong bản làm việc | Ghi phạm vi và kết quả tại thời điểm thực hiện; không quy mọi lỗi cho đợt mới |
| Giao dịch chưa rõ kết quả bị gửi lại | Giữ khóa chống lặp, xác nhận, truy vấn trạng thái và đối soát theo Backend |
| Ảnh dữ liệu mẫu bị hiểu thành bằng chứng thực tế | Ghi nguồn dữ liệu, kích thước màn hình, thời điểm và giới hạn phép kiểm tra |

## Mẫu ghi kết quả

```text
Ngày và phạm vi:
Hợp đồng/API đã đối chiếu:
Thay đổi chính:
Lệnh và kết quả thực chạy:
Bằng chứng trình duyệt: mô phỏng / Backend kiểm thử thật / chưa chạy
Lỗi còn lại và ảnh hưởng:
Việc tiếp theo, người phụ trách, điều kiện hoàn tất:
```

Chỉ ghi “đạt” khi có bằng chứng phù hợp; “đã có mã” không đồng nghĩa đã tích hợp
hoặc nghiệm thu. Không lặp điều kiện xin duyệt theo từng đợt cũ như quy định chung
cho mọi công việc mới.

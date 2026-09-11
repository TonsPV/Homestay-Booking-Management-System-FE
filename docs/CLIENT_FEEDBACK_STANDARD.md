# Chuẩn phản hồi trên giao diện

Áp dụng từ 2026-08-01; biên tập gọn ngày 2026-09-10. Đây là tài liệu chủ về nội dung,
vị trí và vòng đời phản hồi cho khách hàng, nhân viên và quản trị viên.
Tên mã, trường API và thành phần được giữ nguyên để đối chiếu mã nguồn.

## Nguyên tắc bắt buộc

Một phản hồi giúp người dùng hiểu: điều vừa xảy ra, ảnh hưởng tới tác vụ và bước
có thể làm tiếp. Phản hồi không phải bản sao nguyên văn của Backend.

- Một sự kiện có một phản hồi chính; không lặp cùng kết quả ở thông báo nổi, biểu
  ngữ và lỗi dưới trường nếu không có nhu cầu riêng.
- Nội dung tiếng Việt có dấu, ngắn, trực tiếp, không đổ lỗi. Ưu tiên “Thông tin chưa
  hợp lệ” và yêu cầu cần sửa; không mở đầu bằng mã HTTP hoặc thuật ngữ nội bộ.
- Backend quyết định trạng thái nghiệp vụ. Không hứa kết quả đặt phòng/thanh toán/
  hoàn tiền khi chưa được xác nhận; dùng “đang kiểm tra” nếu chưa rõ kết quả.
- Màu và biểu tượng luôn đi cùng chữ, vai trò ngữ nghĩa và tên truy cập phù hợp.
- Thông báo thường một đến hai câu: kết quả → tác động cần biết → hành động tiếp.
  Không lặp tiêu đề trong phần nội dung; nhãn nút không có dấu chấm cuối.
- Giữ câu hoàn chỉnh để dịch; giá trị động dùng tham số có tên, không ghép mảnh câu
  hoặc lấy số bằng cách phân tích thông báo máy chủ.

## Loại phản hồi và vị trí

| Loại | Khi dùng | Vị trí/hành vi |
| --- | --- | --- |
| Thành công | Backend xác nhận tác vụ hoàn tất | Xác nhận gần tác vụ; chỉ nêu bước sau nếu cần |
| Thông tin | Tiến trình bình thường | Giải thích điều đang diễn ra |
| Cảnh báo | Cần chú ý, đang chờ hoặc có nguy cơ thao tác lặp | Giữ gần dữ liệu liên quan tới khi được giải quyết |
| Lỗi | Tác vụ thất bại hoặc dữ liệu không tải được | Nêu tác vụ và cách khôi phục an toàn |
| Kiểm tra biểu mẫu | Trường cần sửa | Ngay dưới trường, liên kết `aria-describedby`; tập trung trường lỗi đầu |
| Rỗng | Yêu cầu thành công nhưng không có dữ liệu | Phân biệt chưa có dữ liệu với bộ lọc không khớp |
| Đang tải | Tác vụ đang xử lý | Gọi đúng tên tác vụ, không giả phần trăm |

Lỗi thao tác nằm trong biểu mẫu/hộp thoại hoặc cạnh cụm nút. Lỗi vùng con chỉ thay
vùng đó; lỗi dữ liệu chính dùng `ErrorState`, có “Thử lại” khi an toàn. Trạng thái
kéo dài như hạn thanh toán hoặc chờ hoàn tiền dùng thông báo cố định. Sau chuyển
trang, xác nhận một lần tại trang đích. Mất phiên xử lý ở lớp xác thực toàn cục.

`Alert tone="error"` dùng `role="alert"`; tông khác dùng `role="status"`.
`ErrorState` có ngữ nghĩa thông báo lỗi. Màu quản lý theo [DESIGN.md](../DESIGN.md):
`warning` khi cần chú ý, `danger` cho lỗi/can thiệp ngay; không đổi ý nghĩa chỉ để đẹp.

Chưa có thành phần thông báo nổi dùng chung. Không tạo riêng theo từng tính năng.
Nếu bổ sung, chỉ dùng cho kết quả ngắn không còn vị trí tự nhiên; phải hỗ trợ bàn
phím, trình đọc màn hình, không biến mất khi được tập trung/rê chuột và không chứa
hành động khôi phục duy nhất. Không dùng cho lỗi biểu mẫu hoặc trạng thái giao dịch kéo dài.

## Vòng đời và biểu mẫu

- Giữ dữ liệu đã nhập sau lỗi. Nút gửi bị khóa khi đang xử lý, nhãn nêu đúng tác vụ.
- Thành công xóa lỗi cũ; bắt đầu thao tác mới xóa kết quả cũ. Không thông báo lại chỉ
  vì React Query tải lại cùng trạng thái.
- Cảnh báo/lỗi quan trọng không tự biến mất khi nguyên nhân còn tồn tại. Xác nhận
  thành công phải tồn tại đủ lâu để công nghệ hỗ trợ đọc được.
- Lỗi tổng chỉ dùng cho vấn đề không thuộc một trường hoặc để dẫn đến nhiều trường;
  không sao nguyên lỗi trường vào biểu ngữ.
- `409` do dữ liệu cũ: yêu cầu tải lại/chọn lại, không âm thầm ghi đè. Không coi mọi
  `409` là hết phòng; chỉ dùng nội dung đó khi mã nghiệp vụ xác nhận.
- `429`: giữ biểu mẫu, tôn trọng `Retry-After`, khóa thao tác trong thời gian chờ và
  hiển thị thời gian hợp lệ; không để số âm hoặc `NaN`.

## Nội dung mẫu

| Tình huống | Nội dung phù hợp |
| --- | --- |
| Phòng vừa hết chỗ | Phòng vừa được khách khác đặt. Vui lòng chọn phòng khác cho khoảng ngày này. |
| Phiên hết hạn | Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục. |
| Chưa xác định kết quả thanh toán | Đang xác nhận thanh toán. Bạn chưa cần thanh toán lại. |
| Dữ liệu ngày sai | Ngày trả phòng phải sau ngày nhận phòng. |
| Lưu hồ sơ | Đã lưu thay đổi hồ sơ. |
| Mất kết nối | Không thể kết nối đến hệ thống. Vui lòng kiểm tra kết nối và thử lại. |

Khách thấy “đặt phòng”, “thanh toán”, “hoàn tiền”, “ngày nhận phòng/ngày trả phòng”.
Trang vận hành có thể dùng VNPay, đối soát hoặc thuật ngữ đã thống nhất; không dùng
mã trạng thái thô, mã cổng thanh toán hoặc mã HTTP làm thông điệp chính.

## Thanh toán và riêng tư

- Mọi tham số VNPay, kể cả `validSignature`, `paymentId`, `bookingId`, `paymentStatus`,
  `responseCode`, `transactionStatus`, đều là đầu vào không đáng tin. Chỉ xác nhận
  thành công sau khi đọc giao dịch tương ứng từ Backend bằng phiên hợp lệ.
- `PENDING`: giải thích đang xử lý, không khuyến khích thanh toán lần nữa.
  `REQUIRES_REVIEW`: đang kiểm tra; `REFUND_PENDING`: đang chờ hoàn tiền, không gửi
  yêu cầu hoàn lần hai; dùng đối soát theo quyền. Quá thời hạn dùng cảnh báo.
- Backend/lịch sử tạm lỗi không chứng minh giao dịch thất bại. Giữ trạng thái chưa rõ
  và cách kiểm tra lại; không bỏ truy vấn định kỳ, kiểm tra chữ ký phía Backend hoặc
  khóa chống xử lý lặp để đơn giản hóa nội dung.
- Không đưa token, mật khẩu, thông tin cơ sở dữ liệu, dấu vết lỗi, phản hồi nhà cung
  cấp hoặc nguyên văn lỗi JavaScript/Backend vào nội dung người dùng.
- `requestId` là dữ liệu tra cứu, không quyết định nội dung hay nghiệp vụ. Chỉ cho
  xem như “mã hỗ trợ” trong phần chi tiết hỗ trợ khi thực sự cần; không nối tự động.
- Lỗi đăng nhập dùng thông điệp chung để không lộ tài khoản có tồn tại/bị khóa/chưa
  có mật khẩu. `403` không tiết lộ quyền cần thêm; `404` có thể nói không tìm thấy
  hoặc không có quyền xem; `5xx` không đoán nguyên nhân nội bộ.

## Phân lớp xử lý lỗi

| Lớp | Trách nhiệm |
| --- | --- |
| `src/api/client.ts` | Đọc phản hồi/tiêu đề, tạo `ApiError` từ HTTP; giữ `status`, `Retry-After`, `requestId`, `errorCode`, `fieldErrors`, `details` và dữ liệu chẩn đoán |
| `src/api/errors.ts` | Nội dung dự phòng an toàn theo loại lỗi/mã chung/trạng thái HTTP; ghi nhận mã lạ, không đưa chẩn đoán vào thông báo |
| `src/features/<domain>/errors.ts`, `src/auth/errors.ts` | Ánh xạ mã nghiệp vụ sang nội dung và cách khôi phục theo tác vụ/tài khoản |
| Trang/thành phần | Chọn vị trí, tiêu đề, tông, nút và điểm tập trung; chỉ gọi hàm xử lý lỗi phù hợp |

Không đọc trực tiếp `error.message`, `serverMessage`, phản hồi thô, `requestId` hoặc
mã cổng thanh toán trong thành phần để làm nội dung. Không dùng biểu thức chính quy
hoặc so khớp thông báo Backend để suy luận nghiệp vụ. Thông báo thành công thuộc
luồng thao tác Frontend, không lấy nguyên `message` thành công từ API.

Thứ tự xử lý:

1. Kiểm tra trường phía Frontend.
2. `fieldErrors` từ Backend theo trường.
3. Mã `errorCode` của tính năng.
4. Mã `errorCode` dùng chung.
5. Nội dung theo HTTP của tính năng chỉ khi phản hồi không có mã.
6. Nội dung chung theo loại lỗi/HTTP.
7. Nội dung an toàn cho lỗi chưa biết, kèm ghi nhận chẩn đoán.

Mã chưa biết không được rơi về nguyên văn `message`. Ghi nhận mã lạ có giới hạn lặp,
kèm trạng thái và `requestId` để bổ sung danh mục.

## Hợp đồng Backend

`ApiFailure` dựa trực tiếp trên kiểu sinh tự động. Các trường `errorCode`,
`fieldErrors`, `details` hiện đã có trong đặc tả; đây không còn là đề xuất tương lai.
Danh mục chính xác ở `src/api/generated/types.gen.ts`, không sao chép toàn bộ enum
vào tài liệu để tránh lệch phiên bản.

- `errorCode`: mã ổn định dạng `<DOMAIN>_<CONDITION>`, không chứa mã HTTP hay nội dung
  hiển thị. Đổi ý nghĩa phải tạo mã mới; Backend/Swagger/Frontend dùng chung hợp đồng.
- `fieldErrors`: ánh xạ tên trường sang danh sách lỗi có mã ổn định và thông báo dự phòng.
- `details`: dữ liệu an toàn có lược đồ, chỉ phục vụ khôi phục/nội suy; không có SQL,
  token, dấu vết lỗi hoặc phản hồi thô của bên thứ ba.
- `message`: nội dung dự phòng cho bên dùng API, không phải nguồn ngôn ngữ giao diện.
  `error` chỉ phục vụ tương thích. `requestId` phục vụ truy vết.
- Backend sở hữu quy tắc, quyền, trạng thái, mã lỗi và chuyển lỗi nhà cung cấp thành
  mã sản phẩm. Frontend sở hữu tiếng Việt, vị trí, tông, nút, tập trung, chờ và thử lại.
- Khả năng đặt mật khẩu ban đầu và chuyển trạng thái lấy từ `credentialCapabilities`
  và `transitionCapabilities`; thiếu dữ liệu cho phép không được tự cấp thao tác.

Ví dụ mã: `COMMON_VALIDATION_FAILED`, `BOOKING_ROOM_UNAVAILABLE`,
`CUSTOMER_INITIAL_PASSWORD_ALREADY_CONFIGURED`, `PAYMENT_REFUND_OUTCOME_UNKNOWN`.
Mã VNPay như `00`, `24`, `94` không thay thế mã nghiệp vụ.

## Ma trận kiểm thử và điều kiện nghiệm thu

| Nhóm | Tình huống phải kiểm tra |
| --- | --- |
| Lớp API | Thông báo kỹ thuật/tiếng Anh và `requestId` không xuất hiện trong nội dung chính; lỗi mạng, phản hồi hỏng, hủy chủ động và lỗi lạ được xử lý an toàn |
| HTTP | `400/422`, `401`, `403`, `404`, `409`, `413`, `415`, `429`, `5xx` có hướng khôi phục phù hợp; `401` xóa phiên, `403` giữ phiên |
| Mã lỗi | Mã đã biết ưu tiên hơn HTTP; mã lạ có nội dung an toàn và ghi nhận giới hạn lặp |
| Biểu mẫu | Lỗi đúng trường, tập trung trường đầu, giữ dữ liệu sau lỗi, chống gửi lặp, xóa kết quả cũ |
| Tải dữ liệu | Lỗi vùng con không phá cả trang; có thử lại khi an toàn; trạng thái tải/rỗng/thành công rõ ràng |
| Khả năng tiếp cận | Vai trò `alert/status`, bàn phím, trình đọc màn hình; không chỉ dùng màu; chữ dài, phóng to 200%, rộng 320–375 px không tràn |
| Đặt phòng | Xung đột phòng đúng mã, lỗi ngày/sức chứa đúng trường, tải lại phòng trống |
| Thanh toán | Sửa tham số quay về không tạo thành công giả; chờ/xem xét/thất bại đúng nội dung; lỗi lịch sử không kết luận sai |
| Hợp đồng | Mã lỗi, lỗi trường, dữ liệu chi tiết và `requestId` khớp OpenAPI; dữ liệu kỹ thuật nhạy cảm không ra phản hồi công khai |

Không nghiệm thu nếu còn thông báo kỹ thuật thô, suy luận từ thông báo Backend,
thành công thanh toán từ URL, lỗi thiếu đường khôi phục an toàn, phản hồi lặp,
biểu mẫu không liên kết lỗi hoặc hợp đồng sinh tự động lệch thực tế.
Kiểm thử trình duyệt xác nhận nội dung/ngữ nghĩa người dùng thấy, không ràng buộc
vào câu chữ thô Backend. Lịch sử triển khai đã gộp tại [báo cáo](audits/lich-su-kiem-tra.md).

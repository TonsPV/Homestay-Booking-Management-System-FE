# Chuẩn thống nhất phản hồi trên giao diện client

Trạng thái: chuẩn áp dụng cho các thay đổi mới từ ngày 2026-08-01.

Trạng thái triển khai: error envelope, stable `errorCode`, structured
`fieldErrors`, safe `details`, capability-driven actions, code-first resolver
và unknown-code telemetry đã được áp dụng cho các luồng critical hiện tại.
Các lỗi chưa có domain code riêng vẫn dùng `COMMON_*` và copy an toàn; FE không
đọc raw Backend message để suy luận nghiệp vụ.

| Phase triển khai | Phạm vi                                                                                                                    | Trạng thái |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1                | Cancellation contract, error envelope, initial-password/transition errors, OpenAPI và tests                                | Hoàn tất   |
| 2                | Credential policy/capability dùng chung cho query và mutation; FE bỏ suy luận từ người tạo booking                         | Hoàn tất   |
| 3                | Booking transition table/evaluator/capabilities dùng chung; FE bỏ state machine cục bộ                                     | Hoàn tất   |
| 4                | Xóa message whitelist và permission inference; giữ fallback fail-closed cho rollout lệch phiên bản; telemetry unknown code | Hoàn tất   |

Phạm vi: public client dành cho khách hàng và management workspace dành cho
`STAFF`/`ADMIN`. Các quy tắc bảo mật, thanh toán và không hiển thị dữ liệu kỹ
thuật là bắt buộc trên cả hai bề mặt; copy có thể khác nhau theo actor và ngữ
cảnh thao tác.

## 1. Mục tiêu

Mỗi phản hồi trên giao diện phải giúp người dùng hiểu được ba điều, theo đúng
thứ tự:

1. Điều gì vừa xảy ra?
2. Kết quả đó ảnh hưởng gì đến tác vụ hiện tại?
3. Người dùng có thể làm gì tiếp theo?

Thông báo không phải bản sao của response Backend. Response Backend là dữ liệu
đầu vào; frontend chịu trách nhiệm chuyển dữ liệu đó thành nội dung rõ ràng,
đúng ngữ cảnh và an toàn để hiển thị.

Chuẩn này ngăn các tình trạng sau:

- hiển thị `400`, `409`, `ROOM_CALENDAR_CONFLICT`, `responseCode=24` hoặc mã
  tương tự như nội dung chính;
- đưa nguyên văn lỗi tiếng Anh, lỗi không dấu hoặc thuật ngữ nội bộ lên màn
  hình;
- hiển thị cùng một kết quả ở nhiều banner/toast/đoạn text;
- báo thành công thanh toán chỉ dựa trên query params trả về từ VNPay;
- thông báo có nội dung nhưng không có cách khắc phục;
- lỗi của một trường form lại xuất hiện như lỗi chung của cả trang.

Các từ khóa **PHẢI**, **KHÔNG ĐƯỢC**, **NÊN** và **CÓ THỂ** trong tài liệu này
mang tính quy chuẩn.

## 2. Nguyên tắc nền tảng

1. **Một sự kiện, một phản hồi chính.** Không đồng thời hiển thị toast, banner
   và lỗi inline cho cùng một kết quả.
2. **Phản hồi nằm gần nơi gây ra hoặc chịu ảnh hưởng bởi sự kiện.** Lỗi trường
   nằm cạnh trường; lỗi lưu form nằm trong form; lỗi tải trang thay thế vùng dữ
   liệu của trang.
3. **Nội dung ưu tiên kết quả và hành động.** Không mở đầu bằng “Lỗi 409”,
   “Request failed” hoặc “Có lỗi xảy ra” nếu có thể nói chính xác tác vụ nào
   chưa hoàn tất.
4. **Backend là nguồn sự thật cho business state.** FE không tự suy luận thành
   công của booking, payment, refund hoặc availability từ URL/local state.
5. **Dữ liệu kỹ thuật không phải UX copy.** `error`, `statusCode`, `errorCode`,
   enum, stack, URL API và gateway code không được đưa nguyên văn vào nội dung
   chính.
6. **Copy tiếng Việt có dấu, ngắn và trực tiếp.** Không trộn tiếng Anh nếu có
   thuật ngữ tiếng Việt quen thuộc.
7. **Không đổ lỗi cho người dùng.** Nói “Thông tin chưa hợp lệ” thay vì “Bạn đã
   nhập sai”.
8. **Không hứa điều hệ thống chưa biết.** Dùng “đang kiểm tra” hoặc “chưa xác
   định” khi kết quả chưa có tính quyết định.
9. **Không dùng màu hoặc icon làm tín hiệu duy nhất.** Tone phải đi cùng text,
   semantic role và accessible name phù hợp.
10. **Copy phải hoàn chỉnh để dịch.** Không ghép các mảnh câu động theo thứ tự
    cố định; giá trị động phải được truyền dưới dạng tham số có tên.

## 3. Taxonomy phản hồi

### 3.1. Taxonomy theo trạng thái giao diện

| Loại         | Khi sử dụng                                                                | Tone                     | Hành vi mặc định                                              |
| ------------ | -------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------- |
| `success`    | Tác vụ đã hoàn tất và Backend đã xác nhận                                  | Bình tĩnh, ngắn          | Xác nhận kết quả; chỉ nêu bước sau nếu có ảnh hưởng           |
| `info`       | Trạng thái trung tính hoặc tiến trình đang diễn ra bình thường             | Trung tính               | Giải thích điều đang diễn ra và kỳ vọng tiếp theo             |
| `warning`    | Tác vụ chưa thất bại nhưng cần chú ý, chờ xử lý hoặc có rủi ro nếu lặp lại | Cẩn trọng                | Nêu điều chưa chắc chắn và việc không nên làm                 |
| `error`      | Tác vụ thất bại hoặc dữ liệu quan trọng không tải được                     | Rõ ràng, không gây hoảng | Nêu tác vụ thất bại và cách thử lại/thay thế                  |
| `validation` | Một hoặc nhiều input cần sửa trước khi gửi                                 | Hướng dẫn                | Gắn với field; nói yêu cầu cần đáp ứng                        |
| `empty`      | Request thành công nhưng không có dữ liệu phù hợp                          | Trung tính               | Phân biệt dữ liệu trống, bộ lọc không khớp và chưa có dữ liệu |
| `loading`    | Hệ thống đang thực hiện tác vụ có thời gian chờ đáng kể                    | Trung tính               | Gọi đúng tên tác vụ; không giả lập phần trăm                  |

`warning` không được dùng thay cho `error` để làm giao diện “nhẹ” hơn. Chọn tone
theo trạng thái thực tế, không theo màu mong muốn.

### 3.2. Taxonomy lỗi dùng trong FE resolver

| Nhóm                         | Tín hiệu tạm thời              | Nội dung mặc định                                           | Hành động mặc định                               |
| ---------------------------- | ------------------------------ | ----------------------------------------------------------- | ------------------------------------------------ |
| Validation                   | HTTP `400`/`422`, field errors | “Thông tin chưa hợp lệ.”                                    | Kiểm tra và sửa trường liên quan                 |
| Chưa đăng nhập/phiên hết hạn | HTTP `401`                     | “Bạn cần đăng nhập lại để tiếp tục.”                        | Đăng nhập lại, giữ return path an toàn           |
| Không có quyền               | HTTP `403`                     | “Bạn không có quyền thực hiện thao tác này.”                | Quay lại vùng được phép; không gợi ý nâng quyền  |
| Không tìm thấy               | HTTP `404`                     | “Không tìm thấy thông tin bạn cần.”                         | Quay lại danh sách hoặc tải lại                  |
| Xung đột trạng thái          | HTTP `409`                     | Copy theo feature nếu biết; nếu không dùng fallback an toàn | Tải lại trạng thái hoặc chọn phương án khác      |
| Tệp quá lớn                  | HTTP `413`                     | “Tệp tải lên quá lớn.”                                      | Chọn tệp nhỏ hơn                                 |
| Định dạng tệp                | HTTP `415`                     | “Định dạng tệp chưa được hỗ trợ.”                           | Chọn định dạng được hỗ trợ                       |
| Giới hạn tần suất            | HTTP `429`, `Retry-After`      | Nêu thời gian có thể thử lại                                | Khóa nút trong cooldown, tự cập nhật thời gian   |
| Mạng                         | fetch/network failure          | “Không thể kết nối đến hệ thống.”                           | Kiểm tra kết nối và thử lại                      |
| Response không đọc được      | parse/envelope failure         | “Không thể đọc dữ liệu từ hệ thống.”                        | Thử lại; ghi nhận diagnostics nội bộ             |
| Dịch vụ gián đoạn            | HTTP `5xx`                     | “Hệ thống đang tạm thời gián đoạn.”                         | Thử lại sau; không nêu nguyên nhân chưa xác minh |
| Không xác định               | không khớp nhóm trên           | “Không thể hoàn tất thao tác.”                              | Thử lại hoặc quay về trạng thái an toàn          |

HTTP status chỉ là fallback trong giai đoạn Backend chưa có stable
`errorCode`. Khi có `errorCode`, code theo nghiệp vụ luôn được ưu tiên hơn suy
đoán từ status.

## 4. Anatomy của một thông báo

Một phản hồi hoàn chỉnh có tối đa bốn phần:

1. **Tiêu đề/kết quả:** điều vừa xảy ra, tối đa một dòng.
2. **Tác động hoặc nguyên nhân hữu ích:** chỉ thêm khi nó thay đổi quyết định
   của người dùng.
3. **Bước tiếp theo:** hành động cụ thể để tiếp tục hoặc khôi phục.
4. **Thông tin hỗ trợ:** chỉ hiển thị theo progressive disclosure khi thực sự
   cần liên hệ hỗ trợ.

Mẫu ưu tiên:

> **[Tác vụ/Kết quả].** [Tác động hoặc nguyên nhân an toàn]. [Bước tiếp theo].

Ví dụ:

| Không dùng                   | Dùng                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| `409 ROOM_CALENDAR_CONFLICT` | **Phòng vừa được khách khác đặt.** Vui lòng chọn phòng khác cho khoảng ngày này.                   |
| `Invalid access token.`      | **Phiên đăng nhập đã hết hạn.** Vui lòng đăng nhập lại để tiếp tục.                                |
| `responseCode: 24`           | **Thanh toán chưa thành công.** Hãy kiểm tra trạng thái đặt phòng trước khi thử lại.               |
| `Payment PENDING`            | **Giao dịch đang được xử lý.** Bạn chưa cần thanh toán lại; hệ thống sẽ tiếp tục kiểm tra kết quả. |
| `Bad Request`                | **Thông tin chưa hợp lệ.** Vui lòng kiểm tra các trường được đánh dấu.                             |
| `Không thể submit`           | **Chưa thể tạo đặt phòng.** Vui lòng kiểm tra thông tin khách và thử lại.                          |

### 4.1. Quy tắc viết

- Tiêu đề dùng động từ/kết quả cụ thể: “Chưa thể tạo đặt phòng”, “Đã lưu thay
  đổi”, “Giao dịch đang được kiểm tra”.
- Không dùng tiêu đề chung chung như “Thông báo”, “Thành công”, “Lỗi”.
- Một thông báo thường dài một đến hai câu. Chỉ dùng câu thứ ba nếu có bước
  khắc phục quan trọng.
- Không lặp lại cùng nội dung trong tiêu đề và body.
- Không đặt dấu chấm sau button label.
- Không dùng toàn bộ chữ hoa để tạo mức độ khẩn cấp.
- Với giới hạn động, dùng tham số có tên như `maxNights`, `retryAfterSeconds`;
  không parse số từ server message.
- Lỗi form nói điều kiện cần đạt: “Ngày trả phòng phải sau ngày nhận phòng.”
- Success chỉ xác nhận điều đã hoàn tất: “Đã lưu thay đổi hồ sơ.” Không thêm
  “thành công” vào mọi câu nếu kết quả đã rõ.

### 4.2. Thuật ngữ hiển thị

| Thuật ngữ kỹ thuật                                | Copy dành cho khách                                            |
| ------------------------------------------------- | -------------------------------------------------------------- |
| booking                                           | đặt phòng                                                      |
| payment                                           | thanh toán/khoản thanh toán                                    |
| refund                                            | hoàn tiền                                                      |
| check-in/check-out date                           | ngày nhận phòng/ngày trả phòng                                 |
| customer                                          | khách hàng/bạn, tùy câu                                        |
| room calendar conflict                            | phòng đã được đặt hoặc tạm khóa trong khoảng ngày              |
| `PENDING`, `SUCCESS`, `FAILED`, `REQUIRES_REVIEW` | đang xử lý, đã thanh toán, chưa thành công, đang được kiểm tra |
| request ID                                        | mã hỗ trợ                                                      |

Trong management workspace có thể dùng “VNPay”, “đối soát”, “check-in” nếu đó
là thuật ngữ vận hành đã được thống nhất, nhưng vẫn không hiển thị raw enum,
HTTP reason phrase hoặc gateway code làm thông điệp chính.

## 5. Placement và vòng đời

### 5.1. Quy tắc chọn vị trí

Áp dụng theo thứ tự sau:

1. **Lỗi thuộc một field:** hiển thị ngay dưới field, liên kết bằng
   `aria-describedby` và đưa focus tới field lỗi đầu tiên sau submit.
2. **Lỗi của một form/action:** hiển thị `Alert` bên trong form hoặc ngay cạnh
   cụm nút thực hiện action.
3. **Một vùng dữ liệu con tải thất bại:** thay vùng đó bằng error state cục bộ;
   không làm hỏng toàn bộ trang.
4. **Dữ liệu chính của trang tải thất bại:** dùng `ErrorState` tại vị trí nội
   dung chính, có nút “Thử lại” khi retry an toàn.
5. **Trạng thái nghiệp vụ kéo dài:** dùng `Alert` cố định gần dữ liệu liên quan,
   ví dụ hạn thanh toán, refund pending hoặc phòng tạm khóa.
6. **Kết quả sau điều hướng:** hiển thị một lần trên trang đích, gần tiêu đề/tác
   vụ vừa hoàn tất.
7. **Mất phiên toàn cục:** xử lý ở auth/session boundary, sau đó đưa về trang
   đăng nhập với thông báo một lần.

### 5.2. Alert, error state và toast

- `Alert` hiện là primitive chuẩn cho phản hồi inline. `tone="error"` dùng
  `role="alert"`; các tone còn lại dùng `role="status"`.
- `ErrorState` dành cho lỗi tải một vùng/trang và phải có retry nếu thao tác có
  thể lặp lại an toàn.
- Repository hiện chưa có notification/toast primitive dùng chung. Không tạo
  toast cục bộ theo từng feature.
- Nếu bổ sung toast sau này, toast chỉ dùng cho kết quả ngắn không còn vị trí
  tự nhiên sau khi action hoàn tất. Không dùng toast cho lỗi form, payment
  pending/review, cảnh báo mất dữ liệu hoặc nội dung cần người dùng đọc kỹ.
- Toast phải có live region, hỗ trợ keyboard/screen reader, không biến mất khi
  focus/hover và không chứa hành động duy nhất để khôi phục.

### 5.3. Thời gian và dismiss

- Error/warning quan trọng không tự biến mất khi nguyên nhân chưa được giải
  quyết.
- Success inline có thể biến mất khi người dùng bắt đầu tác vụ tiếp theo hoặc
  điều hướng, nhưng không được biến mất trước khi assistive technology thông
  báo xong.
- Không hiển thị lại cùng một error sau mỗi lần React Query refetch nếu trạng
  thái và nội dung không đổi.
- Sau một mutation thành công, xóa error cũ của mutation đó.
- Không giữ success message cũ khi người dùng đã sửa dữ liệu và submit lần mới.

## 6. Quy tắc riêng cho form

1. Client validation xử lý format và hướng dẫn sớm; Backend vẫn là nguồn sự
   thật cho business validation.
2. Field error phải nói cách sửa, không chỉ nói “Không hợp lệ”.
3. Summary error chỉ dùng khi có lỗi không thuộc một field hoặc khi cần hướng
   người dùng tới nhiều field; không lặp nguyên từng field error trong summary.
4. Input giữ lại dữ liệu hợp lệ sau khi request thất bại.
5. Nút submit hiển thị trạng thái đang xử lý và bị vô hiệu hóa để ngăn gửi lặp;
   không đổi label thành từ mơ hồ như “Đang tải”.
6. Với `409` do dữ liệu cũ, nói rõ cần tải lại hoặc chọn lại; không âm thầm ghi
   đè.
7. Với `429`, giữ dữ liệu form, vô hiệu hóa action trong thời gian
   `Retry-After` và cập nhật countdown bằng text.

## 7. Thanh toán và VNPay

Đây là boundary bắt buộc, không được nới lỏng bằng copy hoặc UI convenience.

- Query params từ VNPay, gồm `validSignature`, `paymentId`, `bookingId`,
  `paymentStatus`, `responseCode` và `transactionStatus`, là dữ liệu không đáng
  tin để hiển thị hoặc kết luận kết quả.
- FE không hiển thị `responseCode`/`transactionStatus` cho khách.
- FE chỉ báo “Thanh toán thành công” sau khi đọc được payment state tương ứng
  từ Backend bằng phiên khách hàng hợp lệ.
- Khi chỉ có tín hiệu return nhưng chưa có trạng thái có thẩm quyền, dùng
  `info`/`warning`: “Đang xác nhận thanh toán”; không dùng `success`.
- Trạng thái `PENDING`: giải thích người dùng chưa cần thanh toán lại.
- Trạng thái `REQUIRES_REVIEW`: nói giao dịch đang được kiểm tra, không hứa thời
  điểm hoặc kết quả.
- Trạng thái `FAILED`: hướng người dùng kiểm tra chi tiết đặt phòng trước khi
  thử lại.
- Trạng thái `REFUND_PENDING`: đây là trạng thái bình thường trong quá trình
  chờ VNPay/đối soát, không gọi là lỗi.
- Raw gateway message chỉ được log/persist phía Backend; không nối vào nội dung
  trả về cho UI.

## 8. Security và dữ liệu kỹ thuật

### 8.1. Nội dung không được hiển thị trực tiếp

- `statusCode`, trường `error` và HTTP reason phrase;
- `errorCode` hoặc code nội bộ;
- `path`, URL API, method, stack trace;
- database constraint/table/column names;
- raw `Error.message` từ JavaScript, parser hoặc network library;
- raw Backend `message` chưa qua resolver;
- VNPay/gateway response code, transaction status và raw gateway message;
- token, Authorization header, idempotency key, chữ ký hoặc secret;
- actor/user/customer ID nếu không cần thiết cho tác vụ hiện tại.

React escaping không biến nội dung kỹ thuật thành copy an toàn. Không dùng
`dangerouslySetInnerHTML` để render server/gateway message.

### 8.2. `requestId`

`requestId` là correlation ID để tra log, không phải nội dung lỗi và không phải
bằng chứng về nguyên nhân.

- Không nối `requestId` vào `getErrorMessage()` hoặc body thông báo chính.
- Chỉ hiển thị dưới nhãn “Mã hỗ trợ” khi có một support flow thực tế.
- Đặt trong phần chi tiết có thể mở/đóng và cung cấp nút sao chép.
- Không yêu cầu khách đọc hoặc nhập lại mã dài nếu có thể gửi tự động qua error
  reporting.
- Không dùng `requestId` để phân nhánh UX.

### 8.3. Auth và privacy

- Login failure phải giữ thông điệp chung, không phân biệt tài khoản không tồn
  tại, bị khóa, chưa có mật khẩu hay sai mật khẩu nếu việc phân biệt làm lộ sự
  tồn tại của tài khoản.
- `403` không được tiết lộ role/quyền mà tài khoản cần có.
- `404` trên tài nguyên thuộc người dùng có thể dùng thông điệp chung “không
  tìm thấy hoặc bạn không có quyền xem”.
- `5xx` không nêu database, service nội bộ hoặc dependency cụ thể.

## 9. Boundary resolver hiện tại ở Frontend

Đây là boundary code-first đang được áp dụng. HTTP status chỉ là fallback khi
đang rollout lệch phiên bản và response chưa có `errorCode`.

```text
Backend/Network response
        |
        v
src/api/client.ts
  - parse envelope/header
  - tạo ApiError
  - lưu diagnostics, không quyết định copy theo feature
        |
        v
src/api/errors.ts
  - resolver an toàn toàn cục theo kind/status/Retry-After
  - không hiển thị requestId/raw Error/raw server message
        |
        v
src/<feature>/errors.ts
  - copy và recovery theo ngữ cảnh nghiệp vụ
  - map stable errorCode theo actor và tác vụ
        |
        v
Page/Component
  - chọn placement, title, tone, CTA và focus
```

### 9.1. Trách nhiệm từng lớp

`src/api/client.ts`:

- nhận `status`, `Retry-After`, `requestId` và payload;
- tạo `ApiError` có `kind`, `status`, `retryAfterSeconds`, `requestId`,
  `errorCode`, `fieldErrors`, `details` và diagnostics nội bộ;
- không đưa raw payload vào `Error.message` dùng để hiển thị;
- xử lý `401` và session invalidation tại auth boundary.

`src/api/errors.ts`:

- `getErrorMessage()` là fallback hiển thị an toàn;
- `messageFromFailure()` ưu tiên common `errorCode`, rồi mới fallback theo HTTP
  status khi response không có code;
- lỗi network/parse/unknown phải dùng copy do FE kiểm soát;
- unknown code được ghi nhận một lần kèm `requestId`/status để bổ sung catalog,
  nhưng không xuất hiện trên giao diện.

`src/<feature>/errors.ts`:

- ưu tiên stable code khi có;
- không map exact Backend message và không dùng regex/message inspection làm
  contract;
- phải có fallback về `getErrorMessage()`;
- không được trả raw server message khi code chưa được nhận diện.

Page/component:

- không đọc trực tiếp `error.message`, `serverMessage`, payload, `statusCode`,
  `error`, `requestId` hoặc gateway code;
- chỉ gọi generic/feature resolver;
- chịu trách nhiệm placement và CTA vì transport layer không biết người dùng
  đang làm tác vụ nào.

### 9.2. Quy tắc import

- View được import `getErrorMessage()` hoặc resolver của feature.
- Chỉ `src/api/client.ts` được tạo `ApiError` từ response HTTP.
- Feature error catalog chỉ map `errorCode`, không rải status/message branching
  trong JSX.
- Success copy nằm gần mutation/flow vì FE đã biết action vừa hoàn tất; không
  phụ thuộc vào Backend success `message` làm copy chính.

## 10. Contract Backend hiện tại

### 10.1. Error envelope chuẩn

Backend phát hành error envelope sau:

```json
{
  "success": false,
  "statusCode": 409,
  "errorCode": "BOOKING_ROOM_UNAVAILABLE",
  "message": "Phòng không còn trống trong khoảng ngày đã chọn.",
  "fieldErrors": {
    "roomId": [
      {
        "errorCode": "BOOKING_ROOM_UNAVAILABLE",
        "message": "Phòng không còn trống trong khoảng ngày đã chọn."
      }
    ]
  },
  "details": {
    "retryable": true
  },
  "error": "Conflict",
  "path": "/api/v1/bookings",
  "timestamp": "2026-08-01T12:00:00.000Z",
  "requestId": "8e5e1d48-557f-44dd-a00e-9d7d789cde84"
}
```

Quy tắc:

- `errorCode` là bắt buộc cho mọi error response và là enum dùng chung trong
  runtime, Swagger và generated FE types.
- Format: `<DOMAIN>_<CONDITION>`, `UPPER_SNAKE_CASE`.
- Code mô tả điều kiện nghiệp vụ, không chứa HTTP status hoặc copy hiển thị.
- Ý nghĩa code không thay đổi sau khi phát hành; nếu cần thay đổi semantics,
  tạo code mới.
- `message` là fallback an toàn cho non-browser client, không chứa raw
  dependency text và không phải nguồn localization chính của FE.
- `fieldErrors` chỉ xuất hiện khi lỗi gắn được với field. Mỗi entry có stable
  field `errorCode`; `message` là fallback.
- `details` chỉ chứa dữ liệu an toàn, có schema và cần để khắc phục/interpolate;
  không chứa SQL, token, stack hoặc raw third-party response.
- `error` được giữ tạm thời để tương thích nhưng không được FE dùng làm copy.
- `requestId` vẫn bắt buộc để tracing.

`ApiFailure` tham chiếu trực tiếp generated error contract. `serverMessage` chỉ
được giữ bên trong transport diagnostics; component và feature resolver không
được dùng nó làm copy.

### 10.2. Taxonomy `errorCode` tối thiểu

Common:

- `COMMON_VALIDATION_FAILED`
- `COMMON_NOT_FOUND`
- `COMMON_CONFLICT`
- `COMMON_RATE_LIMITED`
- `COMMON_SERVICE_UNAVAILABLE`
- `COMMON_INTERNAL_ERROR`

Auth/account:

- `COMMON_UNAUTHORIZED`
- `COMMON_FORBIDDEN`

Customer/profile:

- `CUSTOMER_EMAIL_IN_USE`
- `CUSTOMER_PHONE_IN_USE`
- `CUSTOMER_CURRENT_PASSWORD_INVALID`
- `CUSTOMER_PASSWORD_REUSE_NOT_ALLOWED`
- `CUSTOMER_INITIAL_PASSWORD_ALREADY_CONFIGURED`

Booking/room availability:

- `BOOKING_ROOM_UNAVAILABLE`
- `BOOKING_DATE_RANGE_INVALID`
- `BOOKING_CHECKIN_IN_PAST`
- `BOOKING_GUEST_CAPACITY_EXCEEDED`
- `BOOKING_ACTIVE_UNPAID_LIMIT_REACHED`
- `BOOKING_HELD_NIGHTS_LIMIT_REACHED`
- `BOOKING_TRANSITION_NOT_ALLOWED`
- `BOOKING_CONFIRMATION_REQUIRES_PAYMENT`
- `BOOKING_CHECKIN_REQUIRES_PAYMENT`
- `BOOKING_CANCELLATION_NOT_ALLOWED`
- `BOOKING_ROOM_NOT_READY`

Payment/refund:

- `PAYMENT_REFUND_NOT_ALLOWED`
- `PAYMENT_IDEMPOTENCY_KEY_CONFLICT`
- `PAYMENT_REFUND_REJECTED`
- `PAYMENT_REFUND_OUTCOME_UNKNOWN`

Gateway codes như `00`, `24`, `94`, `98`, `99` không được đưa vào taxonomy sản
phẩm. Backend phải dịch chúng thành product code hoặc business state.

### 10.3. Boundary Backend–Frontend

Backend sở hữu:

- business invariant và stable `errorCode`;
- HTTP status;
- field code và safe structured details;
- dịch dependency/gateway result thành product code;
- trạng thái booking/payment/refund có thẩm quyền;
- logging, diagnostics và `requestId`.

Frontend sở hữu:

- tiếng Việt có dấu và localization;
- copy theo actor, task và placement;
- title, tone, CTA, focus, cooldown và retry behavior;
- success feedback của action do FE khởi tạo;
- fallback an toàn cho unknown code;
- quyết định chi tiết kỹ thuật nào có thể xuất hiện trong support disclosure.

Backend không nên cố quyết định toast/banner/inline placement. FE không được tái
triển khai business invariant hoặc suy luận trạng thái thanh toán.

## 11. Thứ tự resolve khi có lỗi

FE phải resolve theo thứ tự xác định, không tùy từng component:

1. Client-side field validation.
2. Backend `fieldErrors` theo field.
3. Feature map theo stable `errorCode`.
4. Global map theo stable `errorCode`.
5. Feature fallback theo HTTP status chỉ khi response không có code.
6. Global fallback theo `kind`/HTTP status.
7. Unknown safe fallback và telemetry.

Không được bỏ qua một code chưa biết để hiển thị raw `message`. Unknown code phải
rơi về safe fallback và được ghi nhận diagnostics để bổ sung mapping sau.

## 12. Rollout phases và trạng thái

### Phase P0 — Chặn rò rỉ kỹ thuật trên client — Hoàn tất

- Generic HTTP resolver không trả raw Backend/JavaScript message.
- Không tự động nối `requestId` vào thông báo.
- View không đọc raw response fields.
- VNPay return không hiển thị raw code và chỉ xác nhận bằng authoritative
  Backend state.
- Bổ sung unit test bảo vệ các boundary trên.

Điều kiện hoàn tất: không còn mã kỹ thuật trong customer-visible happy/error
paths quan trọng.

### Phase P1 — Chuẩn hóa critical customer journeys — Hoàn tất

- Auth/register/session.
- Tìm phòng và tạo đặt phòng.
- Chi tiết/hủy đặt phòng.
- Tạo thanh toán và VNPay return.
- Hồ sơ và đổi mật khẩu.
- Feature resolver cung cấp copy/action cụ thể cho các conflict thường gặp.

Điều kiện hoàn tất: mỗi mutation critical có success, validation, conflict,
auth, network và server fallback rõ ràng.

### Phase P2 — Chuẩn hóa placement và dọn UI thừa — Hoàn tất trong phạm vi thay đổi

- Mỗi sự kiện chỉ còn một phản hồi chính.
- Field errors không lặp lại trong banner nếu không cần.
- Xóa alert/helper text không có tác dụng quyết định hoặc lặp lại heading.
- Tách lỗi cục bộ khỏi page-level error.
- Đồng nhất `Alert`, `ErrorState`, loading và empty state.

Điều kiện hoàn tất: không có duplicate alert/toast, không có stale success/error
sau action mới, mobile không overflow.

### Phase P3 — Backend stable contract — Hoàn tất cho luồng critical

- Thêm `errorCode`, structured `fieldErrors` và safe `details`.
- Thêm custom/domain exception hoặc factory thống nhất.
- Map các rule critical của booking, credential, customer, amenity và refund;
  các rule còn lại dùng common code an toàn cho tới khi cần UX riêng.
- Không nối third-party text vào public message.
- Cập nhật OpenAPI, generated contract, unit và E2E contract tests.

Điều kiện hoàn tất: mọi public/customer error critical có stable code được mô tả
trong OpenAPI.

### Phase P4 — FE code-first migration — Hoàn tất

- Normalize `errorCode ?? code` tại transport boundary.
- Migrate feature resolver từ legacy message sang code.
- Map Backend field errors vào form.
- Thêm telemetry cho unknown code, không hiển thị code cho người dùng.

Điều kiện hoàn tất: không còn message parsing/regex trong customer critical
flows.

### Phase P5 — Xóa compatibility layer — Hoàn tất

- Xóa exact-message maps và regex inspection.
- Deprecate FE use of Backend `message`/`error` cho UI.
- Dùng generated error contract thay hand-written duplicate.
- Chạy lại full unit, component, E2E và architecture checks.

Điều kiện hoàn tất: copy có thể thay đổi mà không phá logic FE; code có thể audit
từ OpenAPI và test matrix.

## 13. Test matrix bắt buộc

| Layer            | Scenario                                                      | Assertion bắt buộc                                                        |
| ---------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------- |
| API unit         | Backend trả raw English/technical message                     | `getErrorMessage()` không trả raw text                                    |
| API unit         | Có `requestId`                                                | Không xuất hiện trong primary message                                     |
| API unit         | `400`, `401`, `403`, `404`, `409`, `413`, `415`, `429`, `5xx` | Đúng safe fallback và recovery                                            |
| API unit         | `429` có/không `Retry-After`                                  | Countdown hợp lệ; không âm/NaN                                            |
| API unit         | Network, parse, aborted, unknown Error                        | Không lộ raw diagnostics; aborted không báo lỗi giả nếu flow chủ động hủy |
| Resolver unit    | Có known `errorCode`                                          | Copy feature được ưu tiên hơn HTTP fallback                               |
| Resolver unit    | Unknown `errorCode`                                           | Safe fallback; không hiện code/server message                             |
| Telemetry unit   | Unknown `errorCode` lặp lại                                   | Ghi nhận một lần, có status/requestId, không lộ lên UI                    |
| Form component   | Backend field error                                           | Hiển thị đúng field, `aria-describedby`, focus field đầu                  |
| Form component   | Mutation thất bại                                             | Giữ input; alert nằm trong form; submit hoạt động lại                     |
| Form component   | Mutation thành công sau lỗi                                   | Xóa lỗi cũ; chỉ một success message                                       |
| Query component  | Page data thất bại                                            | `ErrorState` có retry và accessible role                                  |
| Query component  | Partial data thất bại                                         | Chỉ vùng con bị thay; trang còn dùng được                                 |
| Accessibility    | Error và trạng thái động                                      | `role="alert"`/`status`, live announcement, không color-only              |
| Responsive       | Copy dài, 200% zoom, 320–375 px                               | Không overflow/clipping, CTA vẫn dùng được                                |
| Auth E2E         | Token hết hạn/invalid                                         | Clear session, redirect đúng, một thông báo dễ hiểu                       |
| Booking E2E      | Phòng vừa bị đặt trước submit                                 | Không hiện `409`; hướng chọn phòng khác và refresh availability           |
| Booking E2E      | Ngày/sức chứa không hợp lệ                                    | Copy field-specific, không generic toàn trang                             |
| Payment E2E      | VNPay success query bị chỉnh sửa                              | Không báo success nếu Backend state chưa xác nhận                         |
| Payment E2E      | `PENDING`/`REQUIRES_REVIEW`/`FAILED`                          | Copy đúng, không hiện gateway code, không khuyến khích trả lại sai lúc    |
| Payment E2E      | Backend/history tạm lỗi                                       | Không báo sai thành công/thất bại; có retry an toàn                       |
| Backend contract | Mỗi domain exception                                          | HTTP status + stable `errorCode` + requestId đúng                         |
| Backend contract | Validation                                                    | Structured fieldErrors khớp DTO field                                     |
| Backend contract | Unexpected/third-party error                                  | Response được sanitize; raw detail chỉ có trong log                       |
| OpenAPI contract | Error envelope                                                | `errorCode`, `fieldErrors`, `details` có schema và generated FE type      |

Các E2E test không được assert raw Backend message làm UI copy contract. Assert nội
dung người dùng nhìn thấy hoặc semantic state/action.

## 14. Checklist cho mỗi feature/action

### Product/UX

- [ ] Đã xác định một sự thật quan trọng nhất người dùng cần biết.
- [ ] Đã xác định bước tiếp theo hoặc nói rõ không cần làm gì.
- [ ] Copy dùng tiếng Việt có dấu và thuật ngữ thống nhất.
- [ ] Không lặp heading/body hoặc lặp cùng phản hồi ở nhiều vị trí.
- [ ] Tone phù hợp với mức độ và tính chắc chắn của trạng thái.
- [ ] Payment/refund copy không hứa kết quả khi Backend chưa xác nhận.

### Frontend

- [ ] View chỉ gọi generic/feature resolver, không đọc raw server fields.
- [ ] Lỗi field nằm cạnh field và có liên kết accessibility.
- [ ] Action error nằm trong đúng form/panel/dialog.
- [ ] Page/section load failure có retry khi an toàn.
- [ ] `requestId`, HTTP status, error code và gateway code không có trong primary
      message.
- [ ] Success/error cũ được reset đúng vòng đời.
- [ ] Nút không cho gửi lặp khi mutation đang pending.
- [ ] `429` tôn trọng `Retry-After`.
- [ ] Unknown error/code có safe fallback.
- [ ] Mobile, long copy và 200% zoom đã được kiểm tra.

### Backend/contract

- [ ] Business rule có stable `errorCode`.
- [ ] Code có schema/OpenAPI và không phụ thuộc copy.
- [ ] Validation có structured field errors khi áp dụng.
- [ ] `details` chỉ chứa dữ liệu an toàn và có nhu cầu UX rõ ràng.
- [ ] Raw DB/dependency/gateway message không đi ra public response.
- [ ] `requestId` có trong envelope/header và log.
- [ ] Unit test bảo vệ rule; E2E test bảo vệ route/actor/response contract.
- [ ] OpenAPI và generated FE types đã cập nhật.

### QA

- [ ] Loading, empty, error, success và retry đã được kiểm tra.
- [ ] Keyboard/focus/screen reader announcement hoạt động.
- [ ] Không có duplicate feedback hoặc stale feedback.
- [ ] Query/refetch không tạo vòng lặp thông báo.
- [ ] Critical auth/booking/payment flow có E2E coverage.
- [ ] Test không phụ thuộc raw Backend wording.

## 15. Review gate

Không đánh dấu một feature hoàn tất nếu còn một trong các điều sau:

- component hiển thị `error.message` hoặc Backend `message` trực tiếp;
- UI hiển thị raw code/request ID/gateway status như nội dung chính;
- payment success được quyết định từ query params;
- một mutation không có success và failure feedback;
- lỗi không có bước khôi phục trong khi hệ thống có một hành động an toàn;
- cùng một sự kiện tạo nhiều thông báo;
- copy không dấu, mixed technical English hoặc tên enum;
- field error không liên kết với field tương ứng;
- resolver phụ thuộc regex/raw message để quyết định copy hoặc nghiệp vụ;
- OpenAPI/generated contract không phản ánh error shape thực tế.

Chuẩn này là nguồn tham chiếu duy nhất cho feedback copy và error placement. Các
feature có thể bổ sung catalog code/copy riêng, nhưng không được làm suy yếu các
boundary về bảo mật, payment truth, accessibility và không hiển thị dữ liệu kỹ
thuật.

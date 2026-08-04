# BE-001: Management Room Availability API

## Trạng thái

- **Đã giải quyết ngày 2026-08-01.**
- Backend, OpenAPI generated contract, Counter Room Picker và critical staff
  journey đã được nối cùng một endpoint quản lý.

## Bối cảnh

Màn hình "Đặt phòng tại quầy" (Staff Counter Booking) cần hiển thị danh sách
phòng **thực sự trống** trong một khoảng ngày để STAFF chọn trước khi tạo
booking. Hiện tại:

- `GET /api/v1/rooms/search` (public) không trả về `roomNumber` và `status`
  theo phòng cụ thể, nên STAFF không thấy số phòng trước khi chọn.
- `Room.status` đơn lẻ **không đủ** để kết luận phòng trống trong một khoảng
  ngày (phòng có thể `ACTIVE` nhưng đã có booking giao với khoảng ngày đó).

## Đề xuất endpoint

```
GET /api/v1/management/rooms/available
```

### Query parameters

| Tham số      | Kiểu   | Bắt buộc | Mô tả                                  |
| ------------ | ------ | -------- | -------------------------------------- |
| `checkIn`    | string | Có       | Ngày nhận phòng, định dạng `YYYY-MM-DD` |
| `checkOut`   | string | Có       | Ngày trả phòng, định dạng `YYYY-MM-DD`  |
| `roomTypeId` | number | Không    | Lọc theo loại phòng                     |
| `guests`     | number | Có       | Sức chứa tối thiểu (số khách)           |
| `page`       | number | Không    | Trang, mặc định `1`                     |
| `limit`      | number | Không    | Số bản ghi mỗi trang, mặc định `20`     |

### Validation

- `checkOut` phải sau `checkIn`.
- Khoảng ngày phải hợp lệ (không quá khứ, độ dài kỳ nghỉ trong giới hạn cho
  phép).
- Trả `400` kèm thông điệp rõ ràng khi query không hợp lệ.

### Authorization

- Chỉ `ADMIN` và `STAFF` được gọi.
- Trả `401`/`403` theo cơ chế auth hiện có của management API.

### Response

Phân trang theo chuẩn hiện có của management API. Mỗi phần tử tối thiểu:

```json
{
  "id": 12,
  "roomNumber": "A101",
  "roomType": {
    "id": 3,
    "name": "Deluxe Garden View",
    "maxGuests": 2,
    "basePrice": "850000.00"
  },
  "status": "READY"
}
```

Nếu đã có `RoomDto` dùng cho management, ưu tiên tái sử dụng `RoomDto[]` thay
vì tạo shape mới, miễn là có đủ các trường tối thiểu ở trên.

## Quy tắc nghiệp vụ

1. **Không** trả về phòng có booking (ở các trạng thái chiếm chỗ, ví dụ
   `PENDING`, `CONFIRMED`, `CHECKED_IN` — theo định nghĩa hiện tại của BE) giao
   với khoảng ngày yêu cầu. Hai khoảng ngày được coi là **giao nhau** khi:

   ```sql
   existing.checkIn < requested.checkOut
   AND existing.checkOut > requested.checkIn
   ```

   Với điều kiện này, booking mới được phép **bắt đầu đúng ngày booking cũ trả
   phòng** (check-out và check-in cùng ngày không tính là giao nhau).
2. **Không** chỉ dựa vào `Room.status` để kết luận availability.
3. Chỉ trả về phòng ở các trạng thái được phép tạo booking (ví dụ `ACTIVE`;
   loại trừ `MAINTENANCE`, `INACTIVE`, ... theo quy ước hiện tại).
4. Availability trả về chỉ mang tính tham khảo tại thời điểm query. Khi tạo
   booking, BE **phải kiểm tra lại availability trong transaction** để tránh
   race condition (hai STAFF cùng đặt một phòng) và trả `409 Conflict` khi
   phòng vừa hết chỗ.

## Tiêu chí nghiệm thu (Acceptance criteria)

- [x] Endpoint hoạt động với đầy đủ query params và validation ở trên.
- [x] Chỉ `ADMIN`/`STAFF` gọi được; `CUSTOMER` và anonymous bị từ chối.
- [x] Phòng có booking giao với khoảng ngày không xuất hiện trong kết quả.
- [x] Phòng `MAINTENANCE`/`HIDDEN` không xuất hiện trong kết quả.
- [x] Tạo booking với phòng vừa hết chỗ trả `409` qua unique room-calendar
  constraint trong transaction.
- [x] OpenAPI spec được cập nhật (`npm run openapi:generate` phía BE), để FE
      chạy `npm run contract:generate` lấy types mới.

## Việc FE đã hoàn tất

1. Chạy `npm run contract:generate` để cập nhật generated types.
2. Dùng generated `RoomManagementAvailableData` thay cho query type viết tay.
3. Triển khai `CounterBookingPage` và Counter Room Picker dùng endpoint này
   (không gọi
   calendar theo từng phòng, tránh N+1).

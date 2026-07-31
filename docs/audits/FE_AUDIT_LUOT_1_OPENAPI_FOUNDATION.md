# FE Audit - Lượt 1 - OpenAPI contract và API foundation

Ngày kiểm chứng: 2026-07-29

## Scope

- Full OpenAPI type generation.
- Contract drift và negative contract test.
- Success/error envelope và `requestId`.
- Chuyển Room Calendar sang generated DTO.
- Chuyển toàn bộ core response type sang generated DTO hoặc adapter có type từ
  generated schema.
- Sửa metadata Swagger ở Backend sibling repository theo quyền owner đã cấp;
  không đổi route, enum, response runtime hay business rule.
- Khởi tạo product context của Impeccable với thương hiệu **Homestay Green**.

## Backend contract

Nguồn:

`D:\HBMS\homestay-booking-management-system-api\docs\openapi.json`

Generator:

- `@hey-api/openapi-ts@0.95.0`, pin exact version.
- Chỉ bật plugin `@hey-api/typescript`; không sinh SDK/client runtime.
- Output chỉ nằm trong `src/api/generated`.
- Sinh toàn bộ reusable schema và operation request/response types.
- Write-only input như password được sinh thành type `*Writable`.

## Defects fixed

1. Thay generator Room Calendar riêng lẻ bằng full OpenAPI generator.
2. Thêm `contract:check`, so sánh output mới với generated folder mà không phụ
   thuộc Git tracked state.
3. Thêm `contract:test`; fixture cố tình bỏ required `requestId` phải làm type
   assertion fail.
4. `ApiSuccess` và `ApiFailure` dùng generated envelope làm type base.
5. `ApiResult` giữ `requestId`.
6. `ApiError` giữ `requestId`.
7. Success envelope thiếu `requestId` bị coi là malformed response.
8. Error UI qua `getErrorMessage` hiển thị `Mã tra cứu` khi Backend trả
   `requestId`.
9. Room Calendar DTO/input/result đã chuyển sang generated contract.
10. Mock unit và mocked browser envelope đã bổ sung `requestId`.
11. Bổ sung explicit `String`/`Date` cho nullable scalar trong Backend DTO và
    test hồi quy OpenAPI.
12. Sửa metadata literal/optional cho Auth và Payment để generated contract
    giữ đúng `'Bearer'`, actor discriminator, `'VND'` và nullable Payment status.
13. Chuyển Auth/User/Customer, Amenity/RoomType, Room, Booking và Payment
    response model sang alias generated DTO; Auth login dùng adapter kiểm tra
    actor và principal trước khi tạo session.
14. Tạo `PRODUCT.md` theo Impeccable, chốt product truth và tên thương hiệu
    **Homestay Green** cho các lượt UI tiếp theo.

## Capability matrix

| Capability | Status | Evidence | Gap |
|---|---|---|---|
| Full generated schema/operations | PASS | `src/api/generated/types.gen.ts` | Không |
| Contract drift check | PASS | `npm run contract:check` | Không |
| Negative required-field test | PASS | `npm run contract:test` | Hiện bảo vệ `SuccessEnvelopeDto.requestId` |
| Success requestId path | PASS | Unit test + live Backend journey | Không |
| Error requestId path | PASS | Unit test cho HTTP 429 | Không |
| Room Calendar generated DTO | PASS | Typecheck | Không |
| Auth/User/Customer response migration | PASS | Generated DTO alias + Auth adapter + typecheck | Không |
| Amenity/RoomType/Room response migration | PASS | Generated DTO alias + typecheck | Không |
| Booking/Payment response migration | PASS | Generated DTO alias + nullable enum contract | Không |
| Dashboard response contract | PASS | `DashboardSummaryResponse` generated | Feature connection thuộc Lượt 9 |
| Impeccable product context | PASS | `PRODUCT.md` | UI polish áp dụng theo lượt có UI |

## Backend OpenAPI correction

Swagger trước đó xuất nhiều nullable scalar thành:

```ts
{
  [key: string]: unknown
} | null
```

trong khi DTO runtime khai báo `string | null` hoặc `Date | null`.

Các nhóm bị ảnh hưởng:

- `AuthCustomerDto.email`, `AuthUserDto.phone`.
- `AmenityDto.description`, `AdminAmenityDto.description/deletedAt`.
- `BookingDto`: nullable ID, email, date-time, note và cancellation fields.
- `PaymentDto`: gateway/refund strings, nullable IDs và date-time fields.
- `VnPayReturnDto`: nullable ID/code/status fields.
- `RoomTypeAmenityDto`, `RoomResponseRoomTypeDto`, `RoomDto`,
  `RoomTypeDto`, `AdminRoomTypeDto`: description/deletedAt.

Nguyên nhân đã đối chiếu trong Backend DTO: các `@ApiProperty` nullable scalar
thiếu `type: String` hoặc `type: Date`, nên Swagger suy luận thành `object`.

Đã sửa tại Backend bằng metadata Swagger:

- Nullable scalar khai báo explicit `String` hoặc `Date`.
- Auth login principal không còn bị mô tả bắt buộc đồng thời; actor response có
  discriminator literal.
- Payment currency/token literal và nullable enum được sinh đúng.
- Scan snapshot chỉ còn nullable `object` đúng chủ đích như nested principal,
  user reference, calendar booking và generic envelope data.
- `npm run openapi:validate`, Backend lint và Backend build đều PASS.

FE không dùng type assertion để che drift. Các response core giữ tên public hiện
có dưới dạng alias tới generated DTO; chỉ `LoginResponse` là view model phân biệt
actor được tạo sau bước kiểm tra response thô.

## Commands and results

| Command | Result |
|---|---|
| `npm run contract:generate` | PASS |
| `npm run contract:check` | PASS |
| `npm run contract:test` | PASS |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run test` | PASS, 41 files / 161 tests |
| `npm run build` | PASS |
| `npm run test:e2e` | PASS, 13 pass / 1 skip |
| `npm run test:e2e:live` | PASS, 1 live Chromium journey với Backend test runtime |
| Backend `npm run openapi:validate` | PASS, 4 tests |
| Backend `npm run lint` | PASS |
| Backend `npm run build` | PASS |

Build vẫn có FE-009 `INEFFECTIVE_DYNAMIC_IMPORT`, giữ đúng lịch Lượt 10.

`npm audit --omit=dev` báo advisory high ở React Router hiện tại và chỉ đề xuất
downgrade breaking về `react-router-dom@7.11.0`. Không chạy auto-fix vì ngoài
phạm vi Lượt 1 và có nguy cơ phá routing; cần một security dependency lượt riêng.

## Exit decision

`PASS`

Foundation, full generation, drift check, `requestId`, nullable scalar contract
và core response migration đều PASS. Không còn P0/P1 trong phạm vi Lượt 1.
Lượt 2 - Auth và route authorization được phép bắt đầu.

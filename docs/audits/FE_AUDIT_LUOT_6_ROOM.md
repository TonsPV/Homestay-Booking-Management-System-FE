# FE Audit - Lượt 6 - Room

Ngày kiểm chứng: 2026-07-29

## Scope

- Public Room list, search và detail.
- Management Room list, detail, create, update và status.
- Multipart Room image upload, delete và set-cover.
- Room calendar gồm `RESERVED`, `BLOCKED`, block và unblock.
- Không đổi route, enum, UI library, state management hoặc Backend API.

## Backend contract

| Capability | Method/path | Actor |
|---|---|---|
| Public list/search/detail | `GET /api/v1/rooms`, `/rooms/search`, `/rooms/{id}` | Public |
| Management list/detail | `GET /api/v1/management/rooms[/{id}]` | ADMIN, STAFF |
| Create/update/delete | `POST /api/v1/rooms`, `PATCH/DELETE /rooms/{id}` | ADMIN |
| Update status | `PATCH /api/v1/rooms/{id}/status` | ADMIN, STAFF |
| Upload image | `POST /api/v1/rooms/{roomId}/images` | ADMIN |
| Delete/set cover | `DELETE /api/v1/room-images/{id}`, `PATCH /room-images/{id}/set-cover` | ADMIN |
| Calendar | `GET /api/v1/management/rooms/{id}/calendar` | ADMIN, STAFF |
| Block/unblock | `POST/DELETE /api/v1/management/rooms/{id}/blocks` | ADMIN, STAFF |

Room query/request aliases derive from generated OpenAPI operation data types.
Multipart giữ `File` làm UI input hẹp hơn generated binary type. Date-only được gửi
nguyên chuỗi `YYYY-MM-DD`; tiền vẫn là decimal string.

## Actor/role matrix

| Capability | Public/Customer | STAFF | ADMIN |
|---|---:|---:|---:|
| Public inventory/search/detail | Có | Có | Có |
| Management inventory/detail/calendar | Không | Có | Có |
| Block/unblock calendar | Không | Có | Có |
| Update operational status | Không | Có, trừ `HIDDEN` | Có |
| Create/update/delete Room | Không | Không | Có |
| Upload/delete/set-cover image | Không | Không | Có |

FE chỉ hỗ trợ disabled/visibility. Backend tiếp tục là nguồn sự thật cho role,
status transition và availability conflict.

## Design decisions

1. Giữ nguyên cấu trúc catalog và management hiện hữu; đây là hardening, không
   phải redesign.
2. Thêm `RoomImage` riêng trong module để URL ảnh lỗi không làm vỡ hoặc giật
   layout. Vùng ảnh giữ nguyên kích thước, có fallback copy và accessible name.
3. Không sửa hoặc suy diễn URL ảnh; mọi URL đi qua adapter hiện có và dùng giá
   trị Backend trả về.
4. Upload lỗi giữ nguyên file đã chọn để người dùng sửa/thử lại; upload, set
   cover và delete thành công có feedback riêng.
5. Create/update/delete/status Room có success feedback thay vì đóng form hoặc
   refetch trong im lặng.
6. Block/unblock dùng khoảng `[from, to)`. Mutation calendar dùng `onSettled`
   invalidation nên cả success và `409` đều reload Room/calendar/availability.
7. Unblock chỉ yêu cầu xóa `BLOCKED`; Backend query có điều kiện status và test
   xác nhận không xóa `RESERVED`.

## Capability matrix

| Capability | Status | Evidence | Gap | Fix |
|---|---|---|---|---|
| Public list/loading/error/empty/filter | PASS | Existing UI, full tests | Không | Giữ |
| Search date/guests/RoomType/price/Amenity AND | PASS | API unit + mocked browser | Không | Generated query aliases |
| Public detail và booking handoff | PASS | Route/component + live browser | Không | Giữ search state |
| ADMIN/STAFF management visibility | PASS | Component + mocked browser | Không | Giữ Backend role truth |
| Room CRUD/status feedback | PASS | Mocked + live browser | Im lặng khi thành công | Success alert |
| Multipart upload/unsupported/server error | PASS | API/schema/component + live Sharp upload | Thiếu server-error evidence | Test và giữ selection |
| Broken image | PASS | Component + desktop/mobile browser | Browser broken-image icon | `RoomImage` fallback |
| One cover/delete/set-cover refetch | PASS | Hook invalidation + mocked/live browser | Thiếu success feedback | Success alert |
| Calendar `RESERVED`/`BLOCKED` | PASS | UI + mocked/live browser | Không | Giữ |
| Calendar conflict/refetch | PASS | Mocked `409`, read-count assertion | Thiếu browser evidence | `onSettled` invalidation |
| Unblock preserves reserved | PASS | Backend service test + mocked browser | Không | Status-filtered delete |

## Defects fixed

- Ảnh hỏng trước đây hiện browser broken-image icon và có thể làm trải nghiệm
  catalog/detail thiếu ổn định.
- Quản lý ảnh không báo upload/set-cover/delete thành công.
- Room create/update/delete/status thành công nhưng UI không xác nhận.
- Thiếu browser proof cho multi-Amenity query, calendar `409` refetch,
  reserved-preserving unblock và image lifecycle.
- Room request/query type chưa dùng đầy đủ generated operation data aliases.

## Tests added

- `src/features/rooms/components/RoomImage.test.tsx`
  - Broken URL chuyển sang fallback ổn định.
  - URL mới reset failure state và thử tải lại.
- `src/features/rooms/components/RoomImageManager.test.tsx`
  - Upload success.
  - Server rejection giữ file đã chọn.
  - Normalized server error.
  - Set-cover success.
- `e2e/room-flows.pw.ts`
  - Date/guest và hai `amenityIds` lặp đúng contract.
  - Broken image fallback ở catalog/detail.
  - ADMIN status, calendar `409` refetch, block/unblock giữ `RESERVED`.
  - Mocked multipart upload, set-cover và delete.
- `e2e-live/room-management.pw.ts`
  - Tạo RoomType fixture và Room bằng UI.
  - Status, calendar block/unblock.
  - Hai PNG thật qua Backend Sharp, set-cover và delete.
  - Public search đến Room detail trên Backend `_test`.

## Commands and results

| Command | Result |
|---|---|
| `npm run contract:check` | PASS |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run test` | PASS, 45 files / 186 tests |
| `npm run build` | PASS, 286 modules |
| `npm run test:e2e` | PASS, 37 pass / 1 skip |
| Room live journey | PASS, 1 |

Build vẫn còn FE-009 `INEFFECTIVE_DYNAMIC_IMPORT`, đã có owner tại Lượt 10.

## Architecture/hygiene observations

- Query keys vẫn do `roomKeys` sở hữu; không thêm key rải rác.
- Mutation ảnh invalidate toàn bộ Room query sau success.
- Calendar block/unblock invalidate toàn bộ Room query ở `onSettled` để stale
  state được sửa cả khi conflict.
- `RoomImage` là primitive nội bộ module, không mở rộng shared design system.
- Không thêm dependency và không chỉnh generated files bằng tay.

## Deferred dependencies

- Cross-module invalidation sau booking/payment tiếp tục được kiểm chứng ở Lượt
  7, 8 và 10.
- FE-009 dynamic import/bundle warning giữ đúng owner Lượt 10.

## Exit decision

`PASS`

Public visibility, Amenity AND search, management mutations, image cover/error,
calendar conflict và cả hai live exit journeys đều có bằng chứng. Lượt 7 -
Booking được phép bắt đầu.

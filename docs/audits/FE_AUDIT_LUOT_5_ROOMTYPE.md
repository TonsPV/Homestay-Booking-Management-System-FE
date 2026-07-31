# FE Audit - Lượt 5 - RoomType

Ngày kiểm chứng: 2026-07-29

## Product decision

Public `/room-types` không còn là một catalog độc lập. Khách quan tâm phòng
đang có thể đặt, vì vậy:

- `/room-types` redirect sang `/rooms`.
- `/room-types/{id}` redirect sang `/rooms?roomTypeId={id}`.
- Hai public RoomType page không thể truy cập đã được xóa.
- Public RoomType list API vẫn được dùng làm option/filter trong Home, Room
  catalog và form quản trị.
- RoomType Backend entity và toàn bộ ADMIN CRUD/amenity assignment được giữ.

## Contract

| Capability | Method/path |
|---|---|
| Public options | `GET /api/v1/room-types` |
| Admin list/detail | `GET /api/v1/admin/room-types[/{id}]` |
| Create | `POST /api/v1/admin/room-types` |
| Update | `PATCH /api/v1/admin/room-types/{id}` |
| Soft-delete | `DELETE /api/v1/admin/room-types/{id}` |
| Restore | `PATCH /api/v1/admin/room-types/{id}/restore` |
| Exact amenities | `PUT /api/v1/admin/room-types/{id}/amenities` |

FE request/query aliases derive from generated RoomType operation data types.

## Design decisions

1. Không thêm public page thay thế; redirect giữ backward compatibility cho
   bookmark/link cũ và dẫn khách thẳng tới Room catalog.
2. `basePrice` đi từ input tới API dưới dạng decimal string. FE không dùng
   JavaScript float để tính hoặc chuẩn hóa giá.
3. Amenity editor gửi exact `amenityIds` set bằng PUT, sau đó invalidate cả
   RoomType và Room queries.
4. CRUD, restore và amenity assignment có success feedback riêng.
5. Active badge dùng “Đang hoạt động”, không suy diễn RoomType đang được Room
   sử dụng.
6. Management cards có accessible article name; loading/error/empty/pagination
   hiện có được giữ.

## Dead code removed

- `PublicRoomTypesPage.tsx`
- `PublicRoomTypeDetailPage.tsx`
- Public detail/list hooks chỉ phục vụ hai page chết.
- Public detail API adapter không còn consumer.

## Test evidence

- `src/features/room-types/api.test.ts`: public/admin boundary, generated
  payloads và PUT exact amenity set.
- `src/features/room-types/schemas.test.ts`: decimal string, invalid money,
  name/guest/description rules.
- `e2e/room-type-management.pw.ts`: public redirects và ADMIN create → assign
  exact amenity → update → soft-delete → restore trên desktop/mobile.
- `e2e-live/room-type-management.pw.ts`: tạo Amenity riêng, real RoomType CRUD,
  assignment và restore trên Backend `_test`.

## Commands and results

| Command | Result |
|---|---|
| `npm run contract:check` | PASS |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run test` | PASS, 44 files / 181 tests |
| `npm run build` | PASS, 285 modules |
| `npm run test:e2e` | PASS, 33 pass / 1 skip |
| RoomType live journey | PASS, 1 |

Build vẫn còn FE-009 `INEFFECTIVE_DYNAMIC_IMPORT`, giữ tới Lượt 10.

## Exit decision

`PASS`

Public IA decision, ADMIN CRUD/restore, exact amenity assignment, validation,
all UI states và live smoke đều đạt exit gate. Lượt 6 - Room được phép bắt đầu.

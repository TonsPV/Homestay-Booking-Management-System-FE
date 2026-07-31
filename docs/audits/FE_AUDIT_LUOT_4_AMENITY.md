# FE Audit - Lượt 4 - Amenity

Ngày kiểm chứng: 2026-07-29

## Scope

- Public active Amenity options.
- ADMIN list/search/pagination with optional deleted records.
- ADMIN create/update/soft-delete/restore.
- Duplicate-name and in-use conflicts.

## Contract

| Capability | Method/path |
|---|---|
| Public list | `GET /api/v1/amenities` |
| Admin list | `GET /api/v1/admin/amenities` |
| Create | `POST /api/v1/admin/amenities` |
| Update | `PATCH /api/v1/admin/amenities/{id}` |
| Soft-delete | `DELETE /api/v1/admin/amenities/{id}` |
| Restore | `PATCH /api/v1/admin/amenities/{id}/restore` |

FE request/query aliases derive from generated `AmenityListData`,
`AmenityAdminListData`, `AmenityAdminCreateData` and
`AmenityAdminUpdateData`.

## Design decisions

1. Giữ catalog quản lý dạng card scan-friendly hiện có; không thêm table hoặc
   dialog mới chỉ để đổi hình thức.
2. Trạng thái active dùng nhãn “Đang hoạt động”, không dùng “Đang sử dụng” vì
   active không chứng minh Amenity đang được RoomType tham chiếu.
3. Create/update/delete/restore đều có success alert rõ ràng; lỗi giữ nguyên
   thông báo và `requestId` từ Backend.
4. Soft-delete đang được RoomType sử dụng là rule của Backend. FE không đoán
   quan hệ và không nhân bản business rule.
5. Amenity card có accessible article name để thao tác và kiểm thử ổn định.

## Backend alignment

- `AmenityService.softDelete` kiểm tra quan hệ RoomType trước khi xóa.
- Amenity đang được dùng trả `409 Conflict`.
- DELETE OpenAPI operation khai báo common mutation errors, gồm `409`.
- OpenAPI snapshot và generated FE types đã được tái tạo.

## State coverage

| State | Status |
|---|---|
| Loading | PASS |
| Retryable error | PASS |
| Empty/search-empty | PASS |
| Pagination | PASS |
| Form validation | PASS |
| Mutation pending | PASS |
| Success feedback | PASS |
| Duplicate conflict | PASS |
| In-use conflict | PASS |
| Deleted/restore state | PASS |

## Test evidence

- Backend `amenity.service.spec.ts`: 10 tests, gồm từ chối soft-delete Amenity
  đang được RoomType sử dụng.
- `src/features/amenities/api.test.ts`: public/admin auth boundary và đầy đủ
  POST/PATCH/DELETE/restore paths.
- `src/features/amenities/schemas.test.ts`: trim, required và max lengths.
- `e2e/amenity-management.pw.ts`: create → update → soft-delete → include
  deleted → restore và visible `409` conflict trên desktop/mobile.
- `e2e-live/amenity-management.pw.ts`: real ADMIN CRUD, duplicate conflict,
  soft-delete và restore trên Backend `_test`.

## Commands and results

| Command | Result |
|---|---|
| Backend Amenity tests | PASS, 10 |
| Backend OpenAPI validate | PASS |
| Backend lint/build | PASS |
| `npm run contract:check` | PASS |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run test` | PASS, 43 files / 171 tests |
| `npm run build` | PASS |
| `npm run test:e2e` | PASS, 29 pass / 1 skip |
| Amenity live journey | PASS, 1 |

Build vẫn còn FE-009 `INEFFECTIVE_DYNAMIC_IMPORT`, giữ tới Lượt 10.

## Exit decision

`PASS`

Amenity contract, CRUD/restore, conflict behavior, all UI states và live smoke
đều đạt exit gate. Lượt 5 - RoomType được phép bắt đầu.

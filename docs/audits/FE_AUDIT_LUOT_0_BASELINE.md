# FE Audit - Lượt 0 - Baseline, Git checkpoint và test topology

Ngày kiểm chứng: 2026-07-29

## Scope

- Runtime, environment và repository state.
- Unit/component, mocked browser E2E và live Backend browser E2E.
- Route/module inventory, bundle baseline và secret scan.
- Không thay đổi feature hoặc UI.
- Không commit/push theo quyết định của owner repository.

## Baseline

| Hạng mục | Giá trị |
|---|---|
| Node | `v22.13.0` |
| npm | `10.9.2` |
| Project files | 206, không tính `node_modules`, `dist`, test output |
| Source files | 186 |
| Unit/component test files | 41 |
| API origin mặc định | `http://localhost:3000` |
| Backend OpenAPI | `../homestay-booking-management-system-api/openapi/openapi.json` |

Git state tại thời điểm baseline:

- `readme.md` đã được sửa.
- Phần lớn scaffold đang untracked.
- Không file untracked nào bị xóa hoặc tự động đưa vào Git.
- Commit/checkpoint Git được thay bằng báo cáo baseline này do owner đã khóa
  phạm vi `không commit/push`.

## Test topology

| Tầng | Command | Backend | Trạng thái |
|---|---|---|---|
| Unit/component | `npm run test` | MSW/fetch mock | PASS |
| Mocked browser | `npm run test:e2e` | `page.route` | PASS |
| Live browser | `npm run test:e2e:live` | Backend test runtime thật | PASS |

Live E2E có fail-safe bắt buộc:

- `HBMS_LIVE_API_ORIGIN` phải là URL HTTP(S).
- `HBMS_LIVE_BACKEND_NODE_ENV` phải bằng `test`.
- `HBMS_LIVE_BACKEND_DB` phải kết thúc bằng `_test`.
- FE không seed, truncate hoặc ghi trực tiếp database.
- Journey baseline chỉ đọc public RoomType/Room catalog.

Command đã dùng:

```powershell
$env:HBMS_LIVE_API_ORIGIN='http://127.0.0.1:3001'
$env:HBMS_LIVE_BACKEND_NODE_ENV='test'
$env:HBMS_LIVE_BACKEND_DB='hbms_test'
npm.cmd run test:e2e:live
```

Backend test runtime đã xác nhận:

- `NODE_ENV=test`
- `DB_DATABASE=hbms_test`
- `APP_PORT=3001`

## Quality gates

| Gate | Kết quả |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run test` | PASS, 41 files / 161 tests |
| `npm run build` | PASS |
| `npm run test:e2e` | PASS, 13 pass / 1 skip |
| `npm run test:e2e:live` | PASS, 1 live Chromium journey |

## Bundle baseline

| Artifact | Raw size | Gzip |
|---|---:|---:|
| Main JS | 488.57 kB | 148.05 kB |
| Booking chunk | 63.11 kB | 14.95 kB |
| Main CSS | 54.77 kB | 10.17 kB |
| Room routes | 48.74 kB | 12.20 kB |
| Total `dist` | 714.71 kB | Chưa tổng hợp |

Build còn cảnh báo `INEFFECTIVE_DYNAMIC_IMPORT` cho
`src/features/room-types/index.ts`. Đây là FE-009, giữ đến Lượt 10 theo plan.

## Secret and environment checks

- Chỉ có `.env.example`; không có `.env` FE trong repo.
- `.env.example` chỉ chứa API origin local và optional empty values.
- Không có file `.env*` được Git track.
- Keyword scan không phát hiện literal credential trong source/project config.
- Runtime và ảnh tạm của Impeccable đã được đưa vào `.gitignore`.

## Capability matrix

| Capability | Status | Evidence | Gap |
|---|---|---|---|
| Unit/component topology | PASS | 41 files / 161 tests | Không |
| Mocked browser topology | PASS | 13 pass / 1 skip | Mobile overflow test chủ đích skip ở project mobile |
| Live browser topology | PASS | Public Room catalog đọc BE test runtime | Các journey mutation bổ sung theo từng module |
| Safe test database guard | PASS | Runner từ chối env khác `test` hoặc DB không có `_test` | FE không thể tự xác minh DB remote ngoài khai báo runner |
| Git checkpoint | DEFERRED | Owner policy: không commit/push | Báo cáo này là comparison baseline; Git rollback cần owner cho phép checkpoint sau |
| Bundle baseline | PASS | Vite production build | FE-009 ở Lượt 10 |

## Impeccable integration

- Skill được cài project-local tại `.agents/skills/impeccable`.
- Codex design detector hook được cấu hình tại `.codex/hooks.json`.
- Vendor skill được loại khỏi project lint; `src` vẫn giữ toàn bộ rule hiện có.
- `PRODUCT.md` chưa được tạo vì Impeccable yêu cầu một vòng xác nhận product
  truth với owner trước khi ghi context bền vững.

## Exit decision

`PASS` cho baseline kỹ thuật và test topology.

Git commit checkpoint được ghi `DEFERRED` theo quyết định owner, không mở rộng
quyền commit/push. Lượt 1 được phép bắt đầu trên baseline được ghi nhận ở đây.

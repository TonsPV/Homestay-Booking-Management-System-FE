# FE Audit - Lượt 11 Repository hygiene và architecture review

Ngày kiểm tra: 2026-07-29

## Phạm vi

- Không thêm feature, không đổi UI library, state management hoặc API nghiệp vụ.
- Không commit, push hoặc stage file.
- Chỉ xóa khi import graph, route, build, test và script đều chứng minh file không
  còn owner.
- Backend tiếp tục là nguồn quyết định cho contract, status và nghiệp vụ.

## Import graph và dependency

Đã thêm `npm run architecture:check`, dùng TypeScript compiler API sẵn có nên
không thêm package. Gate này kiểm tra:

- source không reachable từ `src/main.tsx` hoặc test root;
- runtime import cycle;
- dependency khai báo nhưng không được dùng và import chưa khai báo;
- raw React Query key dạng array literal trong production;
- runtime/test artifact bị Git track.

Kết quả hiện tại:

| Chỉ số | Kết quả |
|---|---:|
| Runtime module reachable | 146 |
| Source/test module được bao phủ | 210 |
| Direct package được kiểm tra | 23 |
| Runtime import cycle | 0 |
| Unreachable source ngoài allowlist | 0 |
| Raw production query key | 0 |
| Direct dependency không dùng | 0 |
| Import package chưa khai báo | 0 |
| Tracked runtime/test artifact | 0 |

`src/features/rooms/index.ts` là barrel duy nhất không có consumer. `rg`, route
graph, build graph và test graph đều không có reference; generated source không
phụ thuộc file này. File đã được xóa và toàn bộ quality gate pass sau khi xóa.

`msw` không có import, handler hoặc test owner trong repository. Direct
devDependency và lock entries liên quan đã được loại bỏ. `npm ci` vẫn hiển thị
một số package native/wasm ở trạng thái `extraneous`; đây là package vật lý do
tooling optional/native cài trong `node_modules`, không phải direct dependency
trong manifest hoặc artifact được track. `architecture:check` kiểm tra direct
manifest/import ownership thay vì dùng trạng thái flatten vật lý này.

## Query key, enum và contract

- Mỗi domain tiếp tục sở hữu query-key factory riêng; import chéo chỉ phục vụ
  invalidation có chủ đích hoặc composition giữa Booking và Payment.
- Ba raw key còn lại chỉ nằm trong test của `AuthProvider` để xác minh
  `queryClient.clear()`, không xuất hiện trong production.
- Các runtime status list của Booking, Payment và Room cần giữ để render option
  và tạo Zod enum. Chúng đã được ràng buộc bằng `satisfies` với union type sinh từ
  OpenAPI, vì vậy giá trị lệch contract sẽ fail typecheck.
- `LoginResponse` là discriminated union thu hẹp từ
  `AuthLoginResponseDto`; `MeResponse`, `DashboardSummary` và các response alias
  khác đều dẫn xuất trực tiếp từ generated type. Không có response schema viết
  tay trùng OpenAPI.

## File lớn

Generated OpenAPI `types.gen.ts` được miễn tách vì là artifact sinh tự động.
Các file source lớn nhất đã được review:

| File | Dòng | Quyết định |
|---|---:|---|
| `PaymentList.tsx` | 528 | Giữ; các subcomponent cùng một list capability và đã cô lập nội bộ |
| `ManagementRoomsPage.tsx` | 519 | Giữ; state/filter/dialog cùng owner của màn inventory |
| `ManagementDashboardPage.tsx` | 466 | Giữ; composition của một dashboard summary, đã có test trực tiếp |
| `ManagementPaymentsPage.tsx` | 409 | Giữ; orchestration query/filter/action của một page |
| `ManagementRoomDetailPage.tsx` | 402 | Giữ; detail editor của một aggregate |

Không tách cơ học chỉ để giảm line count vì sẽ làm tăng public surface và import
chuyển tiếp mà không giảm business state. Các public hook/API hiện tại được giữ
ổn định.

## Artifact và Git

- `debug.log`, `dist/`, `playwright-report/` và `test-results/` đều được
  `.gitignore` bao phủ.
- `git ls-files` hiện chỉ trả về `readme.md`; do đó không có runtime/test artifact
  bị commit.
- Đây cũng là giới hạn của bằng chứng Git: gần như toàn bộ source hiện vẫn
  untracked từ baseline. Theo phạm vi đã đóng băng, Lượt 11 không stage/commit
  thay người dùng.

## Live E2E runner

Runner live trước đây giao ownership Vite cho Playwright `webServer`; trên
Windows, test đã kết thúc nhưng process tree có thể không teardown và làm lệnh
treo. Runner mới:

- tự khởi chạy Vite bằng CLI local;
- chỉ truyền `VITE_API_ORIGIN` đã qua safety guard;
- luôn dừng đúng process Vite trong `finally`;
- dùng `taskkill /T` chỉ làm fallback cho process do chính runner tạo trên
  Windows.

Full live suite cố ý dùng rate limiter thật nên nhiều login theo cùng IP có thể
nhận `429`. Bằng chứng Lượt 11 được chạy theo hai batch với Backend test process
được reset giữa batch:

- batch chính: 10 journey pass;
- shard customer-management: 1 pass;
- shard user-management: 1 pass.

Customer fixture dùng số điện thoại normalized `+84`, đúng dữ liệu Backend.
Không hạ, bypass hoặc thay đổi rate-limit ứng dụng.

## Dependency security

`npm audit` báo 6 advisory: 3 moderate, 3 high, không có critical.

- Nhánh `@hey-api/openapi-ts` chỉ chạy ở local contract generation với OpenAPI
  tin cậy. Bản sửa yêu cầu nâng minor của package `0.x`, có thể làm thay đổi
  generated output, nên không nâng mù trong lượt hygiene.
- Advisory `react-router` liên quan RSC action. Ứng dụng này là Vite CSR, không
  dùng RSC; npm đề xuất downgrade `react-router-dom` về `7.11.0`, không phù hợp
  với nguyên tắc tránh regression.

Hai nhóm advisory không nằm trong production execution path hiện tại. Chúng là
maintenance P2 cần xử lý bằng một lượt dependency riêng, kèm contract diff và
full browser regression; không dùng `npm audit fix --force`.

## Bằng chứng kiểm thử

| Gate | Kết quả |
|---|---|
| Architecture check | PASS |
| FE typecheck | PASS |
| FE lint | PASS |
| FE unit/component | PASS, 54 files / 210 tests |
| FE build | PASS, 297 modules, không warning |
| FE contract check | PASS |
| FE negative contract test | PASS |
| Mocked browser | PASS, 73 pass / 1 skip có chủ đích |
| Live Backend critical integration | PASS, 12/12 qua hai batch an toàn |

## Kết luận

Lượt 11 đạt các exit gate về source reachability, runtime cycle, generated
contract ownership, query-key ownership và committed artifact. Không có P0/P1
mới. Hai việc không được tự động thực hiện là stage/commit toàn bộ source đang
untracked và nâng dependency có khả năng breaking; cả hai nằm ngoài phạm vi đã
đóng băng.

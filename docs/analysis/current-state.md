# Current State — HBMS Frontend

## Verified facts

- Repository là React 19 + Vite 8 + TypeScript 6 + Tailwind CSS 4.
- Entry point chính nằm dưới `src/main.tsx`; routing dùng `react-router-dom`.
- API client và generated OpenAPI types nằm dưới `src/api`; generated files không được sửa thủ công.
- Domain features nằm dưới `src/features`: auth, bookings, customers, dashboard, home, payments, rooms, room-types, amenities, users.
- Shared UI nằm dưới `src/shared/components`.
- Có ba application surfaces: customer/public, staff/POS, admin/management.
- Auth hiện có unified `/login` ở frontend; legacy `/management/login` vẫn tồn tại như compatibility route.
- Management dashboard dùng `useDashboardSummary`, date-range query, KPI, booking/room breakdown, revenue/occupancy analysis và payment attention links.
- Backend contract snapshot được tham chiếu từ `../homestay-booking-management-system-api/openapi/openapi.json`.

## Verification commands

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run architecture:check`

## Current working-tree warning

Working tree đang có nhiều thay đổi chưa commit từ các wave trước. Các thay đổi này không được xem là clean baseline. Ba test failures đã được ghi nhận trước đó là baseline debt:

- `CounterBookingPage.test.tsx`
- `CreateBookingPage.test.tsx`
- `RoomSearchPage.test.tsx`

## Known implementation conventions

- Feature code ở `src/features/<domain>`.
- Shared primitives ở `src/shared/components`.
- React Query quản lý server state.
- Zod + React Hook Form xử lý form validation.
- Route guards kiểm tra actor/role; redirect không phải security boundary.
- Backend là source of truth cho auth, pricing, booking status, payment status và availability.

## Not verified in this discovery pass

- Runtime backend/database health.
- Production deployment topology.
- Exact behavior của mọi backend endpoint ngoài generated contract.
- Visual screenshots ở mọi breakpoint.
- E2E live flow với backend đang chạy.

Các mục trên không được suy diễn thành requirement hoặc defect nếu chưa có bằng chứng runtime.

## Open questions

- Backend có endpoint unified login hay frontend fallback giữa hai endpoint theo actor.
- API contract cuối cùng cho Rooms detail/edit/images và Payments detail.
- Deployment/runtime fixtures cho visual QA và live E2E.
- Chính sách xử lý ba baseline test failures.

Tham chiếu: `docs/analysis/open-questions.md`.

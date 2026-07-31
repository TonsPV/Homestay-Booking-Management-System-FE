# Frontend Security Audit — 2026-07-30

## Phạm vi

- Repository: Homestay Green frontend (React/Vite).
- Trọng tâm: dependency, auth/token, API transport, redirect, VNPay Return,
  upload/URL ảnh, XSS sink, secret và cấu hình runtime.
- Backend vẫn là nguồn sự thật cho quyền, giá, booking, payment và chữ ký VNPay.

## Codex Security

Đã đồng bộ 11 skill chính thức của `openai/codex-security` vào
`.agents/skills/` để dùng ở cấp project:

- bulk scan, scan, scans;
- findings, export, validate, patch;
- info, login, logout, install-hook.

CLI `@openai/codex-security@0.1.4` được cài ngoài repository để không đưa
scanner vào dependency runtime của ứng dụng. `--dry-run` xác nhận đúng
repository, knowledge base và output ngoài checkout.

Scan đầy đủ chưa chạy được vì CLI dừng trước giai đoạn phân tích với lỗi:

```text
Invalid Codex plugin directory: .../@openai/codex-security/_bundled_plugin
```

Lỗi tái hiện trên Windows với cả package 0.1.3 và 0.1.4, trong khi bundled
plugin tồn tại. Không sửa trực tiếp package bên thứ ba để vượt qua bước kiểm
tra này. Audit bên dưới dùng `npm audit`, static search, contract checks,
unit/component test, Playwright và kiểm tra trình duyệt cục bộ.

Tài liệu chính thức:

- https://github.com/openai/codex-security
- https://learn.chatgpt.com/docs/security/cli
- https://learn.chatgpt.com/docs/security/cli/reference

## Kết quả

| Mức | Phát hiện | Trạng thái |
| --- | --- | --- |
| High | Production có thể gửi Bearer token hoặc runtime stack qua HTTP nếu biến môi trường cấu hình sai | Đã vá: remote API và error-reporting endpoint bắt buộc HTTPS; chỉ cho phép HTTP ở loopback |
| High advisory | React Router RSC CSRF, GHSA-qwww-vcr4-c8h2 | Đã nâng lên 7.18.2 (bản vá của maintainer); ứng dụng là Vite CSR và không dùng unstable RSC |
| High/Moderate dev | `js-yaml` DoS và prototype-chain issue trong bộ sinh OpenAPI | Đã nâng `@hey-api/openapi-ts` lên 0.97.3 và override `js-yaml` 4.3.0; contract không đổi |
| Medium | Điều hướng trực tiếp tới `paymentUrl` do API trả về | Đã vá: chỉ nhận HTTPS tuyệt đối, không credential; HTTP chỉ được dùng với loopback cho E2E/dev |
| Medium residual | Access token nằm trong sessionStorage/localStorage | Chưa đổi: cần phối hợp BE chuyển sang Secure HttpOnly cookie và thiết kế CSRF; không nên vá riêng FE làm hỏng auth contract |
| Medium residual | Repository không quản lý security headers triển khai | Cần cấu hình tại reverse proxy/CDN: CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` |
| Low residual | URL ảnh HTTP(S) bên ngoài có thể theo dõi IP/referrer | Giữ nguyên vì URL ảnh đến từ dữ liệu BE; FE đã chặn scheme thực thi |

## Kiểm tra mã

- Không tìm thấy `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`
  hoặc `document.write` trong runtime source.
- Không tìm thấy private key, AWS key, OpenAI key, GitHub token, Slack token
  hoặc JWT thật trong source. Chuỗi password/token tìm thấy chỉ thuộc fixture
  test.
- `.env` và `.env.*` bị ignore; chỉ `.env.example` được phép lưu.
- Redirect sau login chỉ nhận path bắt đầu bằng `/` và từ chối `//`.
- Bearer token chỉ được gắn vào request xây từ API origin cố định.
- Query VNPay được coi là không tin cậy; trạng thái thành công cuối cùng vẫn
  được đối chiếu từ Backend/payment history.
- URL ảnh chỉ nhận HTTP(S); file upload có giới hạn MIME/kích thước phía FE và
  vẫn phụ thuộc validation phía BE.
- Output Codex Security được ignore vì có thể chứa source excerpt và chi tiết
  lỗ hổng.

## Cảnh báo còn hiển thị trong npm audit

`npm audit` vẫn báo hai mục High cho `react-router` và `react-router-dom` do
database npm đang đánh dấu toàn bộ dải `<8.3.0`. Maintainer xác nhận nhánh 7
được vá ở `7.18.2`, đúng phiên bản đang cài:

- https://github.com/remix-run/react-router/security/advisories/GHSA-qwww-vcr4-c8h2

Không dùng `npm audit fix --force`, vì gợi ý hiện tại sẽ hạ phiên bản xuống
7.11.0 và không phản ánh advisory của maintainer.

## Xác minh

- `npm run architecture:check`: pass.
- `npm run contract:check`: pass.
- `npm run contract:test`: pass.
- `npm run typecheck`: pass.
- `npm run lint`: pass.
- `npm run test`: 56 files, 226 tests pass.
- `npm run build`: pass.
- `npm run test:e2e`: 73 pass, 1 configured skip.
- Smoke trình duyệt:
  - Trang chủ render đúng `Homestay Green`, không horizontal overflow,
    không có console error/warning.
  - Payload HTML trong query VNPay không tạo element hoặc event handler.
  - Trang Return hiển thị trạng thái an toàn thay vì tin query để kết luận
    payment.

## Việc cần làm ngoài phạm vi FE

1. Cấu hình security headers ở môi trường deploy với allowlist origin thực tế.
2. Lập kế hoạch đổi access token sang Secure HttpOnly cookie nếu Backend hỗ
   trợ, kèm SameSite và CSRF defense.
3. Chạy lại Codex Security full scan khi bản CLI Windows sửa lỗi bundled
   plugin; không bỏ qua bước validation của scanner.

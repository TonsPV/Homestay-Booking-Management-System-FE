import { LinkButton } from '@/shared/components/LinkButton'

export function ForbiddenPage() {
  return (
    <section
      aria-labelledby="forbidden-page-title"
      className="flex min-h-[65vh] items-center justify-center px-4 py-16"
    >
      <div className="max-w-md text-center">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-600">
          403
        </p>
        <h1
          className="mt-3 text-3xl font-black text-ink"
          id="forbidden-page-title"
        >
          Bạn không có quyền truy cập
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Tài khoản hiện tại không được phép mở khu vực này. Hãy quay lại trang
          phù hợp với vai trò của bạn.
        </p>
        <LinkButton className="mt-6" to="/">
          Về trang chủ
        </LinkButton>
      </div>
    </section>
  )
}

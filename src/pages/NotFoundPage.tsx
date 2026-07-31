import { LinkButton } from '@/shared/components/LinkButton'

export function NotFoundPage() {
  return (
    <section
      aria-labelledby="not-found-page-title"
      className="flex min-h-[65vh] items-center justify-center px-4 py-16"
    >
      <div className="max-w-md text-center">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-brand">
          404
        </p>
        <h1
          className="mt-3 text-3xl font-black text-ink"
          id="not-found-page-title"
        >
          Không tìm thấy trang
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Đường dẫn có thể đã thay đổi hoặc nội dung bạn tìm kiếm không tồn tại.
        </p>
        <LinkButton className="mt-6" to="/">
          Về trang chủ
        </LinkButton>
      </div>
    </section>
  )
}

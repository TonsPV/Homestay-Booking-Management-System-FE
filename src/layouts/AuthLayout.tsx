import { Link, Outlet } from 'react-router-dom'

import { ScrollToTop } from '@/routes/RouteSupport'
import { SkipLink } from '@/shared/components/SkipLink'

export function AuthLayout() {
  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[0.9fr_1.1fr]">
      <SkipLink />
      <ScrollToTop />
      <aside className="relative hidden overflow-hidden bg-inverse p-12 text-on-inverse lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="absolute -left-20 top-1/4 size-72 rounded-full bg-brand/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-28 -right-20 size-80 rounded-full bg-brand/10 blur-3xl"
        />
        <Link
          aria-label="Homestay Green - Trang chủ"
          className="relative flex min-h-11 items-center gap-3 rounded-xl font-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-on-inverse"
          to="/"
        >
          <span
            aria-hidden="true"
            className="flex size-11 items-center justify-center rounded-2xl bg-brand"
          >
            HG
          </span>
          Homestay Green
        </Link>
        <div className="relative max-w-md">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-on-inverse">
            Một hệ thống, hai trải nghiệm
          </p>
          <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight">
            Đặt phòng dễ dàng. Vận hành rõ ràng.
          </h2>
          <p className="mt-5 leading-7 text-on-inverse-muted">
            Khách hàng theo dõi kỳ nghỉ của mình, nhân viên xử lý mọi nghiệp vụ
            từ một nguồn dữ liệu thống nhất.
          </p>
        </div>
        <p className="relative text-sm text-on-inverse-subtle">
          Dữ liệu được xác nhận trực tiếp từ hệ thống quản lý.
        </p>
      </aside>

      <main
        className="flex min-w-0 items-center justify-center px-4 py-8 focus:outline-none sm:px-8 sm:py-10 lg:px-12"
        id="main-content"
        tabIndex={-1}
      >
        <div className="w-full max-w-xl">
          <Link
            aria-label="Homestay Green - Trang chủ"
            className="mb-7 inline-flex min-h-11 items-center gap-2 rounded-xl font-black text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand lg:hidden"
            to="/"
          >
            <span
              aria-hidden="true"
              className="flex size-9 items-center justify-center rounded-xl bg-brand text-white"
            >
              HG
            </span>
            Homestay Green
          </Link>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

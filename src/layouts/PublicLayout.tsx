import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '@/auth/useAuth'
import { ScrollToTop } from '@/routes/RouteSupport'
import { Button } from '@/shared/components/Button'
import { cn } from '@/shared/components/cn'
import { LinkButton } from '@/shared/components/LinkButton'
import { SkipLink } from '@/shared/components/SkipLink'

const publicNavigation = [
  { end: true, label: 'Trang chủ', to: '/' },
  { label: 'Danh sách phòng', to: '/rooms' },
  { label: 'Tìm phòng', to: '/rooms/search' },
]

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none',
    isActive
      ? 'bg-brand-soft text-brand-strong'
      : 'text-muted hover:bg-surface-muted hover:text-ink',
  )
}

function mobileNavLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'flex min-h-11 items-center rounded-xl px-3.5 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none',
    isActive
      ? 'bg-brand-soft text-brand-strong'
      : 'text-ink hover:bg-surface-muted',
  )
}

export function PublicLayout() {
  const { logout, principal, status } = useAuth()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) {
      return
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)')
    const closeAtDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setMenuOpen(false)
      }
    }

    desktop.addEventListener('change', closeAtDesktop)
    return () => desktop.removeEventListener('change', closeAtDesktop)
  }, [])

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <SkipLink />
      <ScrollToTop />
      <header className="sticky top-0 z-[60] isolate border-b border-line/90 bg-surface/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-app items-center gap-3 px-4 py-2 sm:px-6 lg:px-8">
          <NavLink
            aria-label="Homestay Green - Trang chủ"
            className="mr-auto inline-flex min-h-11 items-center gap-2 text-base font-black tracking-tight text-ink"
            to="/"
          >
            <span
              aria-hidden="true"
              className="flex size-9 items-center justify-center rounded-xl bg-brand text-sm text-white"
            >
              HG
            </span>
            <span className="hidden sm:inline">Homestay Green</span>
          </NavLink>

          <nav
            aria-label="Điều hướng chính"
            className="hidden items-center gap-1 lg:flex"
          >
            {publicNavigation.map((item) => (
              <NavLink
                className={navLinkClass}
                end={item.end}
                key={item.to}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
            {principal?.actorType === 'customer' ? (
              <NavLink className={navLinkClass} to="/bookings">
                Booking của tôi
              </NavLink>
            ) : null}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {status === 'restoring' ? (
              <span
                className="text-xs font-medium text-muted"
                role="status"
              >
                Đang khôi phục…
              </span>
            ) : principal?.actorType === 'customer' ? (
              <>
                <NavLink
                  className="inline-flex min-h-11 max-w-48 items-center truncate px-2 text-sm font-semibold text-ink hover:text-brand-strong"
                  to="/account"
                >
                  {principal.fullName}
                </NavLink>
                <Button onClick={logout} variant="outline">
                  Đăng xuất
                </Button>
              </>
            ) : principal?.actorType === 'user' ? (
              <LinkButton to="/management" variant="secondary">
                Khu quản lý
              </LinkButton>
            ) : (
              <>
                <LinkButton to="/login" variant="outline">
                  Đăng nhập
                </LinkButton>
                <LinkButton to="/register" variant="primary">
                  Đăng ký
                </LinkButton>
              </>
            )}
          </div>

          <button
            aria-controls="public-mobile-menu"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
            className="inline-flex size-11 items-center justify-center rounded-xl border border-line bg-surface text-ink transition hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none lg:hidden"
            onClick={() => setMenuOpen((current) => !current)}
            ref={menuButtonRef}
            type="button"
          >
            <span aria-hidden="true" className="grid gap-1">
              <span
                className={cn(
                  'block h-0.5 w-5 bg-current transition motion-reduce:transition-none',
                  menuOpen && 'translate-y-1.5 rotate-45',
                )}
              />
              <span
                className={cn(
                  'block h-0.5 w-5 bg-current transition motion-reduce:transition-none',
                  menuOpen && 'opacity-0',
                )}
              />
              <span
                className={cn(
                  'block h-0.5 w-5 bg-current transition motion-reduce:transition-none',
                  menuOpen && '-translate-y-1.5 -rotate-45',
                )}
              />
            </span>
          </button>
        </div>

        {menuOpen ? (
          <div
            className="border-t border-line bg-surface px-4 py-4 shadow-elevation-2 sm:px-6 lg:hidden"
            id="public-mobile-menu"
          >
            <nav
              aria-label="Điều hướng chính trên thiết bị di động"
              className="mx-auto grid max-w-app gap-1"
            >
              {publicNavigation.map((item) => (
                <NavLink
                  className={mobileNavLinkClass}
                  end={item.end}
                  key={item.to}
                  onClick={closeMenu}
                  to={item.to}
                >
                  {item.label}
                </NavLink>
              ))}
              {principal?.actorType === 'customer' ? (
                <NavLink
                  className={mobileNavLinkClass}
                  onClick={closeMenu}
                  to="/bookings"
                >
                  Booking của tôi
                </NavLink>
              ) : null}
            </nav>

            <div className="mx-auto mt-4 flex max-w-app flex-col gap-2 border-t border-line pt-4">
              {status === 'restoring' ? (
                <p className="py-2 text-sm font-medium text-muted" role="status">
                  Đang khôi phục phiên đăng nhập…
                </p>
              ) : principal?.actorType === 'customer' ? (
                <>
                  <LinkButton
                    onClick={closeMenu}
                    to="/account"
                    variant="outline"
                  >
                    {principal.fullName}
                  </LinkButton>
                  <Button
                    onClick={() => {
                      closeMenu()
                      logout()
                    }}
                    variant="outline"
                  >
                    Đăng xuất
                  </Button>
                </>
              ) : principal?.actorType === 'user' ? (
                <LinkButton
                  onClick={closeMenu}
                  to="/management"
                  variant="secondary"
                >
                  Khu quản lý
                </LinkButton>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <LinkButton
                    onClick={closeMenu}
                    to="/login"
                    variant="outline"
                  >
                    Đăng nhập
                  </LinkButton>
                  <LinkButton
                    onClick={closeMenu}
                    to="/register"
                    variant="primary"
                  >
                    Đăng ký
                  </LinkButton>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </header>

      <main
        className="mx-auto w-full max-w-app px-4 py-8 focus:outline-none sm:px-6 lg:px-8"
        id="main-content"
        tabIndex={-1}
      >
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-line bg-surface">
        <div className="mx-auto flex max-w-app flex-col gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© 2026 Homestay Green.</p>
          <NavLink
            className="inline-flex min-h-11 items-center font-semibold hover:text-brand-strong"
            to="/management/login"
          >
            Đăng nhập nhân viên
          </NavLink>
        </div>
      </footer>
    </div>
  )
}

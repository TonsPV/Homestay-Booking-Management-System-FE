import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/auth/useAuth";
import { getPrincipalHome } from "@/routes/workspace-policy";
import { ScrollToTop } from "@/routes/RouteSupport";
import { Button } from "@/shared/components/Button";
import { cn } from "@/shared/components/cn";
import { LinkButton } from "@/shared/components/LinkButton";
import { SkipLink } from "@/shared/components/SkipLink";

const publicNavigation = [
  { end: true, label: "Trang chủ", to: "/" },
  { label: "Khám phá phòng", to: "/rooms" },
  { label: "Kiểm tra phòng trống", to: "/rooms/search" },
];

function navLinkClass({ isActive }: { isActive: boolean }, inverse = false) {
  return cn(
    "inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none",
    inverse
      ? isActive
        ? "bg-white/14 text-white"
        : "text-white/80 hover:bg-white/10 hover:text-white"
      : isActive
        ? "bg-brand-soft text-brand-strong"
        : "text-muted hover:bg-surface-muted hover:text-ink",
  );
}

function mobileNavLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    "flex min-h-11 items-center rounded-xl px-3.5 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none",
    isActive
      ? "bg-brand-soft text-brand-strong"
      : "text-ink hover:bg-surface-muted",
  );
}

export function PublicLayout() {
  const { logout, principal, status } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const isHome = pathname === "/";
  const transparentHeader = isHome && !scrolled && !menuOpen;

  useEffect(() => {
    if (!isHome) {
      setScrolled(false);
      return;
    }

    const updateHeader = () => setScrolled(window.scrollY > 24);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, [isHome]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeAtDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setMenuOpen(false);
      }
    };

    desktop.addEventListener("change", closeAtDesktop);
    return () => desktop.removeEventListener("change", closeAtDesktop);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <SkipLink />
      <ScrollToTop />
      <header
        className={cn(
          "top-0 z-[60] isolate transition-[background-color,border-color,box-shadow] duration-base ease-calm",
          isHome ? "fixed inset-x-0" : "sticky",
          transparentHeader
            ? "border-b border-transparent bg-transparent text-white"
            : "border-b border-line/90 bg-surface/95 text-ink shadow-elevation-1 backdrop-blur",
        )}
      >
        <div className="mx-auto flex min-h-16 max-w-app items-center gap-3 px-4 py-2 sm:px-6 lg:px-8">
          <NavLink
            aria-label="Homestay Green - Trang chủ"
            className={cn(
              "mr-auto inline-flex min-h-11 items-center gap-2 text-base font-black tracking-tight",
              transparentHeader ? "text-white" : "text-ink",
            )}
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
                className={(state) => navLinkClass(state, transparentHeader)}
                end={item.end}
                key={item.to}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
            {principal?.actorType === "customer" ? (
              <NavLink
                className={(state) => navLinkClass(state, transparentHeader)}
                to="/bookings"
              >
                Đặt phòng của tôi
              </NavLink>
            ) : null}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {status === "restoring" ? (
              <span
                className={cn(
                  "text-xs font-medium",
                  transparentHeader ? "text-white/75" : "text-muted",
                )}
                role="status"
              >
                Đang khôi phục…
              </span>
            ) : principal?.actorType === "customer" ? (
              <>
                <NavLink
                  className={cn(
                    "inline-flex min-h-11 max-w-48 items-center truncate px-2 text-sm font-semibold",
                    transparentHeader
                      ? "text-white hover:text-white/80"
                      : "text-ink hover:text-brand-strong",
                  )}
                  to="/account"
                >
                  {principal.fullName}
                </NavLink>
                <Button
                  className={
                    transparentHeader
                      ? "border-white/35 bg-transparent text-white hover:bg-white/10"
                      : undefined
                  }
                  onClick={logout}
                  variant="outline"
                >
                  Đăng xuất
                </Button>
              </>
            ) : principal?.actorType === "user" ? (
              <LinkButton
                className={
                  transparentHeader
                    ? "border-white/35 bg-white/10 text-white hover:bg-white/20"
                    : undefined
                }
                to={getPrincipalHome(principal)}
                variant={transparentHeader ? "outline" : "secondary"}
              >
                {principal.role === "STAFF" ? "Vào màn quầy" : "Khu quản lý"}
              </LinkButton>
            ) : (
              <>
                <LinkButton
                  className={
                    transparentHeader
                      ? "border-white/35 bg-transparent text-white hover:bg-white/10"
                      : undefined
                  }
                  to="/login"
                  variant="outline"
                >
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
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
            className={cn(
              "inline-flex size-11 items-center justify-center rounded-xl border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none lg:hidden",
              transparentHeader
                ? "border-white/30 bg-black/10 text-white hover:bg-white/10"
                : "border-line bg-surface text-ink hover:bg-surface-muted",
            )}
            onClick={() => setMenuOpen((current) => !current)}
            ref={menuButtonRef}
            type="button"
          >
            <span aria-hidden="true" className="grid gap-1">
              <span
                className={cn(
                  "block h-0.5 w-5 bg-current transition motion-reduce:transition-none",
                  menuOpen && "translate-y-1.5 rotate-45",
                )}
              />
              <span
                className={cn(
                  "block h-0.5 w-5 bg-current transition motion-reduce:transition-none",
                  menuOpen && "opacity-0",
                )}
              />
              <span
                className={cn(
                  "block h-0.5 w-5 bg-current transition motion-reduce:transition-none",
                  menuOpen && "-translate-y-1.5 -rotate-45",
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
              {principal?.actorType === "customer" ? (
                <NavLink
                  className={mobileNavLinkClass}
                  onClick={closeMenu}
                  to="/bookings"
                >
                  Đặt phòng của tôi
                </NavLink>
              ) : null}
            </nav>

            <div className="mx-auto mt-4 flex max-w-app flex-col gap-2 border-t border-line pt-4">
              {status === "restoring" ? (
                <p
                  className="py-2 text-sm font-medium text-muted"
                  role="status"
                >
                  Đang khôi phục phiên đăng nhập…
                </p>
              ) : principal?.actorType === "customer" ? (
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
                      closeMenu();
                      logout();
                    }}
                    variant="outline"
                  >
                    Đăng xuất
                  </Button>
                </>
              ) : principal?.actorType === "user" ? (
                <LinkButton
                  onClick={closeMenu}
                  to={getPrincipalHome(principal)}
                  variant="secondary"
                >
                  {principal.role === "STAFF" ? "Vào màn quầy" : "Khu quản lý"}
                </LinkButton>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <LinkButton onClick={closeMenu} to="/login" variant="outline">
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
        className={cn(
          "w-full focus:outline-none",
          isHome
            ? "max-w-none p-0"
            : "mx-auto max-w-app px-4 py-8 sm:px-6 lg:px-8",
        )}
        id="main-content"
        tabIndex={-1}
      >
        <Outlet />
      </main>

      <footer
        className={cn(
          "border-t border-line bg-surface",
          isHome ? "mt-0" : "mt-16",
        )}
      >
        <div className="mx-auto grid max-w-app gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
          <div>
            <p className="text-lg font-black text-ink">Homestay Green</p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
              Tìm phòng, đặt chỗ và theo dõi kỳ lưu trú trong một hành trình rõ
              ràng.
            </p>
          </div>
          <nav
            aria-label="Khám phá"
            className="grid content-start gap-1 text-sm"
          >
            <p className="mb-2 font-black text-ink">Khám phá</p>
            <NavLink
              className="inline-flex min-h-11 items-center text-muted hover:text-brand-strong"
              to="/rooms"
            >
              Danh sách phòng
            </NavLink>
            <NavLink
              className="inline-flex min-h-11 items-center text-muted hover:text-brand-strong"
              to="/rooms/search"
            >
              Tìm phòng trống
            </NavLink>
          </nav>
          <nav
            aria-label="Tài khoản"
            className="grid content-start gap-1 text-sm"
          >
            <p className="mb-2 font-black text-ink">Tài khoản</p>
            <NavLink
              className="inline-flex min-h-11 items-center text-muted hover:text-brand-strong"
              to="/login"
            >
              Đăng nhập
            </NavLink>
            <NavLink
              className="inline-flex min-h-11 items-center text-muted hover:text-brand-strong"
              to="/register"
            >
              Đăng ký
            </NavLink>
          </nav>
        </div>
        <div className="border-t border-line">
          <div className="mx-auto flex max-w-app flex-col gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p>© 2026 Homestay Green.</p>
            <p>Thông tin phòng và giá được cung cấp trực tiếp từ hệ thống.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

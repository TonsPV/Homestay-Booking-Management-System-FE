import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "@/auth/useAuth";
import { appConfig } from "@/app/config";
import { ChatUnreadBadge } from "@/features/chat/components/ChatUnreadBadge";
import { STAFF_NAVIGATION, STAFF_PATHS } from "@/routes/staff-policy";
import { ScrollToTop } from "@/routes/RouteSupport";
import { Button } from "@/shared/components/Button";
import { cn } from "@/shared/components/cn";
import { SkipLink } from "@/shared/components/SkipLink";

/*
 * THESIS: Một mặt bàn thao tác nhanh cho lễ tân, không phải dashboard quản trị thu nhỏ.
 * OWN-WORLD: Nền sáng, thanh công cụ xanh đậm, tab lớn và trạng thái rõ theo hệ thống hiện có.
 * STORY: Nhân viên nhận diện ca làm, chọn tác vụ, hoàn thành giao dịch và tiếp tục phục vụ.
 * FIRST VIEWPORT: Thanh POS ngang cố định phía trên, nội dung nghiệp vụ rộng toàn màn hình.
 * FORM: Desktop dùng command bar; mobile dùng thanh tác vụ cố định dưới ngón tay cái.
 */

function staffNavClass({ isActive }: { isActive: boolean }) {
  return cn(
    "inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-control px-4 text-sm font-bold transition duration-fast ease-calm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-on-inverse motion-reduce:transition-none",
    isActive
      ? "bg-surface text-ink shadow-sm"
      : "text-on-inverse-muted hover:bg-inverse-raised hover:text-on-inverse",
  );
}

export function StaffLayout() {
  const { logout, principal } = useAuth();
  const staffNavigation = appConfig.chatEnabled
    ? STAFF_NAVIGATION
    : STAFF_NAVIGATION.filter((item) => item.to !== STAFF_PATHS.messages);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <SkipLink />
      <ScrollToTop />

      <header className="sticky top-0 z-sticky border-b border-inverse-line bg-inverse text-on-inverse shadow-elevation-2">
        <div className="mx-auto flex min-h-18 w-full max-w-[112rem] items-center gap-4 px-4 sm:px-6">
          <NavLink
            aria-label="Homi Stay - Quầy lễ tân"
            className="flex min-h-11 shrink-0 items-center gap-3 rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-on-inverse"
            to={STAFF_PATHS.counter}
          >
            <span
              aria-hidden="true"
              className="flex size-10 items-center justify-center rounded-xl bg-brand text-sm font-black text-white"
            >
              HG
            </span>
            <span className="hidden sm:block">
              <span className="block text-sm font-black">Homi Stay</span>
              <span className="block text-xs font-semibold text-on-inverse-subtle">
                POS · Quầy lễ tân
              </span>
            </span>
          </NavLink>

          <nav
            aria-label="Tác vụ tại quầy"
            className="ml-2 hidden items-center gap-1 lg:flex"
          >
            {staffNavigation.map((item) => (
              <NavLink
                className={staffNavClass}
                end={item.end}
                key={item.to}
                to={item.to}
              >
                {item.label}
                {item.to === STAFF_PATHS.messages && appConfig.chatEnabled ? (
                  <ChatUnreadBadge className="ml-2" mode="needsReply" />
                ) : null}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex min-w-0 items-center gap-3">
            <div className="min-w-0 text-right">
              <p className="truncate text-sm font-bold">
                {principal?.fullName}
              </p>
              <p className="text-xs text-on-inverse-subtle">
                Nhân viên tại quầy
              </p>
            </div>
            <Button
              className="hidden border-inverse-line bg-transparent text-on-inverse-muted hover:bg-inverse-raised sm:inline-flex"
              onClick={logout}
              variant="outline"
            >
              Đăng xuất
            </Button>
            <Button
              aria-label="Đăng xuất"
              className="border-inverse-line bg-transparent px-3 text-on-inverse-muted hover:bg-inverse-raised sm:hidden"
              onClick={logout}
              variant="outline"
            >
              Thoát
            </Button>
          </div>
        </div>
      </header>

      <main
        className="mx-auto w-full max-w-[112rem] px-4 py-5 pb-24 focus:outline-none sm:px-6 sm:py-6 lg:pb-8"
        id="main-content"
        tabIndex={-1}
      >
        <Outlet />
      </main>

      <nav
        aria-label="Tác vụ tại quầy trên thiết bị di động"
        className={cn(
          "fixed inset-x-0 bottom-0 z-sticky grid border-t border-inverse-line bg-inverse px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 text-on-inverse shadow-elevation-4 lg:hidden",
          staffNavigation.length === 5 ? "grid-cols-5" : "grid-cols-4",
        )}
      >
        {staffNavigation.map((item) => (
          <NavLink
            className={({ isActive }) =>
              cn(
                "flex min-h-12 items-center justify-center rounded-control px-2 text-center text-xs font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-on-inverse",
                isActive
                  ? "bg-brand text-white"
                  : "text-on-inverse-muted hover:bg-inverse-raised",
              )
            }
            end={item.end}
            key={item.to}
            to={item.to}
          >
            {item.label}
            {item.to === STAFF_PATHS.messages && appConfig.chatEnabled ? (
              <ChatUnreadBadge
                className="ml-1 text-[10px]"
                mode="needsReply"
              />
            ) : null}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

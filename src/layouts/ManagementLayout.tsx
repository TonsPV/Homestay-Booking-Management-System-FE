import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/auth/useAuth";
import { appConfig } from "@/app/config";
import { ChatUnreadBadge } from "@/features/chat/components/ChatUnreadBadge";
import {
  MANAGEMENT_NAV_GROUPS,
  MANAGEMENT_PATHS,
  type ManagementNavItem,
} from "@/routes/management-policy";
import { ScrollToTop } from "@/routes/RouteSupport";
import { Button } from "@/shared/components/Button";
import { cn } from "@/shared/components/cn";
import { IconButton } from "@/shared/components/IconButton";
import { SkipLink } from "@/shared/components/SkipLink";

interface ManagementNavigationProps {
  items: readonly ManagementNavItem[];
  label: string;
  onNavigate?: () => void;
}

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    "flex min-h-11 items-center rounded-control px-3.5 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-on-inverse motion-reduce:transition-none",
    isActive
      ? "bg-brand text-white shadow-sm"
      : "text-on-inverse-muted hover:bg-inverse-raised hover:text-on-inverse",
  );
}

function ManagementNavigation({
  items,
  label,
  onNavigate,
}: ManagementNavigationProps) {
  return (
    <nav aria-label={label} className="grid gap-1">
      {items.map((item) => (
        <NavLink
          className={navLinkClass}
          end={item.end}
          key={item.to}
          onClick={onNavigate}
          to={item.to}
        >
          {item.label}
          {item.to === MANAGEMENT_PATHS.messages && appConfig.chatEnabled ? (
            <ChatUnreadBadge className="ml-auto px-2" mode="needsReply" />
          ) : null}
        </NavLink>
      ))}
    </nav>
  );
}

function ManagementNavigationGroups({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  return (
    <div className="grid gap-6">
      {MANAGEMENT_NAV_GROUPS.map((group) => (
        <section key={group.label}>
          <p className="px-3.5 pb-2 text-xs font-bold uppercase tracking-eyebrow text-on-inverse-subtle">
            {group.label}
          </p>
          <ManagementNavigation
            items={group.items.filter(
              (item) => appConfig.chatEnabled || item.to !== MANAGEMENT_PATHS.messages,
            )}
            label={group.label}
            onNavigate={onNavigate}
          />
        </section>
      ))}
    </div>
  );
}

function Brand({
  home,
  onNavigate,
  workspaceLabel,
}: {
  home: string;
  onNavigate?: () => void;
  workspaceLabel: string;
}) {
  return (
    <NavLink
      aria-label={`Homi Stay - ${workspaceLabel}`}
      className="flex min-h-11 items-center gap-3 rounded-xl px-2 text-base font-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-on-inverse"
      onClick={onNavigate}
      to={home}
    >
      <span
        aria-hidden="true"
        className="flex size-10 items-center justify-center rounded-xl bg-brand text-sm text-white"
      >
        HG
      </span>
      <span>
        Homi Stay
        <span className="block text-xs font-semibold text-on-inverse-subtle">
          {workspaceLabel}
        </span>
      </span>
    </NavLink>
  );
}

export function ManagementLayout() {
  const { logout, principal } = useAuth();
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const previousPathnameRef = useRef(pathname);
  const home = MANAGEMENT_PATHS.dashboard;
  const workspaceLabel = "Quản trị vận hành";

  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      previousPathnameRef.current = pathname;
      setDrawerOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : menuButtonRef.current;
    const drawer = drawerRef.current;

    document.body.style.overflow = "hidden";
    const animationFrame = window.requestAnimationFrame(() => {
      drawer?.querySelector<HTMLElement>(focusableSelector)?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setDrawerOpen(false);
        return;
      }

      if (event.key !== "Tab" || !drawer) {
        return;
      }

      const focusableElements = Array.from(
        drawer.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter(
        (element) =>
          !element.hasAttribute("disabled") &&
          element.getAttribute("aria-hidden") !== "true",
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        drawer.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !drawer.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !drawer.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [drawerOpen]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeAtDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setDrawerOpen(false);
      }
    };

    desktop.addEventListener("change", closeAtDesktop);
    return () => desktop.removeEventListener("change", closeAtDesktop);
  }, []);

  return (
    <div className="min-h-screen bg-canvas text-ink lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <SkipLink />
      <ScrollToTop />

      <aside className="sticky top-0 hidden h-screen flex-col overflow-y-auto bg-inverse px-5 py-6 text-on-inverse lg:flex">
        <Brand home={home} workspaceLabel={workspaceLabel} />
        <div className="mt-8">
          <ManagementNavigationGroups />
        </div>

        <div className="mt-auto border-t border-inverse-line pt-5">
          <p className="truncate text-sm font-bold">{principal?.fullName}</p>
          <p className="mt-1 text-xs text-on-inverse-subtle">Quản trị viên</p>
          <Button
            className="mt-4 w-full border-inverse-line bg-transparent text-on-inverse-muted hover:bg-inverse-raised"
            onClick={logout}
            variant="outline"
          >
            Đăng xuất
          </Button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-line bg-surface/95 px-4 py-2 backdrop-blur lg:hidden">
          <IconButton
            aria-controls="management-mobile-drawer"
            aria-expanded={drawerOpen}
            aria-label="Mở menu vận hành"
            onClick={() => setDrawerOpen(true)}
            ref={menuButtonRef}
            variant="outline"
          >
            <span aria-hidden="true" className="grid gap-1">
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
            </span>
          </IconButton>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink">
              {principal?.fullName}
            </p>
            <p className="text-xs text-muted">Quản trị viên</p>
          </div>
          <span className="ml-auto text-xs font-black uppercase tracking-eyebrow text-brand">
            HG
          </span>
        </header>

        <main
          className="mx-auto w-full max-w-management px-4 py-6 focus:outline-none sm:px-6 lg:px-8 lg:py-8"
          id="main-content"
          tabIndex={-1}
        >
          <Outlet />
        </main>
      </div>

      {drawerOpen ? (
        <>
          <button
            aria-label="Đóng menu vận hành"
            className="fixed inset-0 z-overlay bg-overlay backdrop-blur-sm lg:hidden"
            onClick={() => setDrawerOpen(false)}
            type="button"
          />
          <aside
            aria-labelledby="management-drawer-title"
            aria-modal="true"
            className="fixed inset-y-0 left-0 z-modal flex h-dvh w-[min(88vw,20rem)] flex-col overflow-y-auto bg-inverse px-5 py-5 text-on-inverse shadow-elevation-4 lg:hidden"
            id="management-mobile-drawer"
            ref={drawerRef}
            role="dialog"
            tabIndex={-1}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold" id="management-drawer-title">
                Menu vận hành
              </h2>
              <IconButton
                aria-label="Đóng menu vận hành"
                onClick={() => setDrawerOpen(false)}
                variant="inverse-ghost"
              >
                <span aria-hidden="true" className="text-xl">
                  ×
                </span>
              </IconButton>
            </div>

            <div className="mt-4">
              <Brand
                home={home}
                onNavigate={() => setDrawerOpen(false)}
                workspaceLabel={workspaceLabel}
              />
            </div>
            <div className="mt-7">
              <ManagementNavigationGroups
                onNavigate={() => setDrawerOpen(false)}
              />
            </div>

            <div className="mt-auto border-t border-inverse-line pt-5">
              <p className="truncate text-sm font-bold">
                {principal?.fullName}
              </p>
              <p className="mt-1 text-xs text-on-inverse-subtle">
                Quản trị viên
              </p>
              <Button
                className="mt-4 w-full border-inverse-line bg-transparent text-on-inverse-muted hover:bg-inverse-raised"
                onClick={() => {
                  setDrawerOpen(false);
                  logout();
                }}
                variant="outline"
              >
                Đăng xuất
              </Button>
            </div>
          </aside>
        </>
      ) : null}
    </div>
  );
}

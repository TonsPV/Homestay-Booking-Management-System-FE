import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthContext, type AuthContextValue } from "@/auth/auth-context";
import type { AuthPrincipal } from "@/auth/types";

import { AuthLayout } from "./AuthLayout";
import { ManagementLayout } from "./ManagementLayout";
import { PublicLayout } from "./PublicLayout";
import { StaffLayout } from "./StaffLayout";

const customer: AuthPrincipal = {
  actorType: "customer",
  createdAt: "2026-07-24T00:00:00.000Z",
  email: "customer@example.com",
  fullName: "Khách kiểm thử",
  id: "101",
  phone: "+84900000000",
  status: "ACTIVE",
  updatedAt: "2026-07-24T00:00:00.000Z",
};

const staff: AuthPrincipal = {
  actorType: "user",
  createdAt: "2026-07-24T00:00:00.000Z",
  email: "staff@example.com",
  fullName: "Nhân viên kiểm thử",
  id: "201",
  phone: null,
  role: "STAFF",
  status: "ACTIVE",
  updatedAt: "2026-07-24T00:00:00.000Z",
};

const admin: AuthPrincipal = {
  ...staff,
  email: "admin@example.com",
  fullName: "Quản trị viên kiểm thử",
  id: "202",
  role: "ADMIN",
};

function authValue(principal: AuthPrincipal | null): AuthContextValue {
  return {
    error: null,
    isAuthenticated: principal !== null,
    loginCustomer: vi.fn(),
    loginUser: vi.fn(),
    logout: vi.fn(),
    principal,
    restore: vi.fn(),
    status: principal ? "authenticated" : "anonymous",
    updatePrincipal: vi.fn(),
  };
}

function renderPublicLayout() {
  return render(
    <AuthContext.Provider value={authValue(customer)}>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<PublicLayout />} path="/">
            <Route index element={<h1>Trang công khai</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

function renderManagementLayout() {
  return render(
    <AuthContext.Provider value={authValue(admin)}>
      <MemoryRouter initialEntries={["/management"]}>
        <Routes>
          <Route element={<ManagementLayout />} path="/management">
            <Route index element={<h1>Trang quản lý</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

function renderStaffLayout() {
  return render(
    <AuthContext.Provider value={authValue(staff)}>
      <MemoryRouter initialEntries={["/staff/counter"]}>
        <Routes>
          <Route element={<StaffLayout />} path="/staff">
            <Route path="counter" element={<h1>Tạo booking tại quầy</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("layout accessibility contracts", () => {
  beforeEach(() => {
    vi.stubGlobal("scrollTo", vi.fn());
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      }),
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        addEventListener: vi.fn(),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: false,
        media: query,
        onchange: null,
        removeEventListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    document.body.style.overflow = "";
    vi.unstubAllGlobals();
  });

  it("uses one focusable main landmark and a skip link in public pages", () => {
    renderPublicLayout();

    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(
      screen.getByRole("link", { name: "Bỏ qua điều hướng" }),
    ).toHaveAttribute("href", "#main-content");
  });

  it("opens and dismisses the public navigation disclosure", async () => {
    const user = userEvent.setup();
    renderPublicLayout();
    const trigger = screen.getByRole("button", { name: "Mở menu" });

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("navigation", {
        name: "Điều hướng chính trên thiết bị di động",
      }),
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps the auth shell to one main landmark", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<h1>Đăng nhập</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
  });

  it("traps focus in the management drawer and restores focus", async () => {
    const user = userEvent.setup();
    renderManagementLayout();
    const trigger = screen.getByRole("button", {
      name: "Mở menu vận hành",
    });

    await user.click(trigger);

    const drawer = screen.getByRole("dialog", { name: "Menu vận hành" });
    const drawerQueries = within(drawer);
    const closeButton = drawerQueries.getByRole("button", {
      name: "Đóng menu vận hành",
    });

    await waitFor(() => expect(closeButton).toHaveFocus());
    expect(document.body.style.overflow).toBe("hidden");
    expect(
      drawerQueries.getByRole("link", { name: "Nhân viên" }),
    ).toBeInTheDocument();
    expect(
      drawerQueries.getByRole("link", { name: "Khách hàng" }),
    ).toBeInTheDocument();

    drawerQueries.getByRole("button", { name: "Đăng xuất" }).focus();
    await user.tab();
    expect(closeButton).toHaveFocus();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Menu vận hành" }),
      ).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
      expect(document.body.style.overflow).toBe("");
    });
  });

  it("gives staff a dedicated POS landmark and touch navigation", () => {
    renderStaffLayout();

    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(screen.getByText("POS · Quầy lễ tân")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Đặt phòng" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole("link", { name: "Nhân viên" }),
    ).not.toBeInTheDocument();
  });
});

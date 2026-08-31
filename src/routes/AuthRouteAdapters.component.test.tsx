import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthPrincipal } from "@/auth/types";

const useAuthMock = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({
  LoginPage: ({
    locationState,
    notice,
  }: {
    locationState?: { returnTo?: string };
    notice?: string;
  }) => (
    <div>
      <div>login-page</div>
      <div>return-to:{locationState?.returnTo ?? "none"}</div>
      <div>notice:{notice ?? "none"}</div>
    </div>
  ),
  RegisterPage: () => <div>register</div>,
  useAuth: useAuthMock,
}));

import { LoginRoute } from "./AuthRouteAdapters";

function LocationProbe() {
  return <div>location:{useLocation().pathname}</div>;
}

function renderAdapter(
  element: React.ReactNode,
  path: string,
  state?: { returnTo: string; notice?: string },
  search = "",
) {
  render(
    <MemoryRouter initialEntries={[{ pathname: path, search, state }]}>
      <Routes>
        <Route element={element} path={path} />
        <Route element={<LocationProbe />} path="*" />
      </Routes>
    </MemoryRouter>,
  );
}

function principalOf(role?: "ADMIN" | "STAFF"): AuthPrincipal {
  return role === undefined
    ? {
        actorType: "customer",
        createdAt: "2026-07-26T00:00:00.000Z",
        email: "guest@example.com",
        fullName: "Khách",
        id: "customer-1",
        phone: "+84900000000",
        status: "ACTIVE",
        updatedAt: "2026-07-26T00:00:00.000Z",
      }
    : {
        actorType: "user",
        createdAt: "2026-07-26T00:00:00.000Z",
        email: `${role.toLowerCase()}@example.com`,
        fullName: role,
        id: role,
        phone: null,
        role,
        status: "ACTIVE",
        updatedAt: "2026-07-26T00:00:00.000Z",
      };
}

beforeEach(() => {
  useAuthMock.mockReset();
});

describe("LoginRoute (unified)", () => {
  it("renders the single login page for anonymous users at /login", () => {
    useAuthMock.mockReturnValue({ principal: null });

    renderAdapter(<LoginRoute />, "/login");

    expect(screen.getByText("login-page")).toBeInTheDocument();
    expect(screen.getByText("return-to:none")).toBeInTheDocument();
  });

  it("renders the same login page at the legacy /management/login alias", () => {
    useAuthMock.mockReturnValue({ principal: null });

    renderAdapter(<LoginRoute />, "/management/login");

    expect(screen.getByText("login-page")).toBeInTheDocument();
  });

  it("passes the intended destination through to the login page state", () => {
    useAuthMock.mockReturnValue({ principal: null });

    renderAdapter(<LoginRoute />, "/login", { returnTo: "/bookings/12" });

    expect(screen.getByText("return-to:/bookings/12")).toBeInTheDocument();
  });

  it("maps the password-changed notice query into the login alert", () => {
    useAuthMock.mockReturnValue({ principal: null });

    renderAdapter(<LoginRoute />, "/login", undefined, "?notice=password-changed");

    expect(
      screen.getByText(/Đổi mật khẩu thành công/i),
    ).toBeInTheDocument();
  });

  it("redirects an authenticated customer to the customer surface", () => {
    useAuthMock.mockReturnValue({ principal: principalOf() });

    renderAdapter(<LoginRoute />, "/login");

    expect(screen.getByText("location:/bookings")).toBeInTheDocument();
  });

  it.each(["STAFF", "ADMIN"] as const)(
    "redirects an authenticated %s account to its workspace home",
    (role) => {
      useAuthMock.mockReturnValue({ principal: principalOf(role) });

      renderAdapter(<LoginRoute />, "/management/login");

      expect(
        screen.getByText(
          `location:${role === "STAFF" ? "/staff/counter" : "/management/bookings"}`,
        ),
      ).toBeInTheDocument();
    },
  );

  it("does not return a staff account to an admin-only route", () => {
    useAuthMock.mockReturnValue({ principal: principalOf("STAFF") });

    renderAdapter(<LoginRoute />, "/login", { returnTo: "/management/users" });

    expect(screen.getByText("location:/staff/counter")).toBeInTheDocument();
  });

  it("honors a safe returnTo for the matching role", () => {
    useAuthMock.mockReturnValue({ principal: principalOf("ADMIN") });

    renderAdapter(<LoginRoute />, "/login", {
      returnTo: "/management/payments",
    });

    expect(
      screen.getByText("location:/management/payments"),
    ).toBeInTheDocument();
  });
});

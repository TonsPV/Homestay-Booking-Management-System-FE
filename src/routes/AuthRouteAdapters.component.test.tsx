import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthPrincipal } from "@/auth/types";

const useAuthMock = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({
  CustomerLoginPage: ({ redirectTo }: { redirectTo?: string }) => (
    <div>customer-login:{redirectTo}</div>
  ),
  ManagementLoginPage: ({
    redirectTo,
    resolveRedirect,
  }: {
    redirectTo?: string;
    resolveRedirect?: (principal: AuthPrincipal) => string;
  }) => {
    const principal = (role: "ADMIN" | "STAFF"): AuthPrincipal => ({
      actorType: "user",
      createdAt: "2026-07-26T00:00:00.000Z",
      email: `${role.toLowerCase()}@example.com`,
      fullName: role,
      id: role,
      phone: null,
      role,
      status: "ACTIVE",
      updatedAt: "2026-07-26T00:00:00.000Z",
    });

    return (
      <div>
        <div>management-login:{redirectTo}</div>
        <div>staff-destination:{resolveRedirect?.(principal("STAFF"))}</div>
        <div>admin-destination:{resolveRedirect?.(principal("ADMIN"))}</div>
      </div>
    );
  },
  RegisterPage: () => <div>register</div>,
  useAuth: useAuthMock,
}));

import { CustomerLoginRoute, ManagementLoginRoute } from "./AuthRouteAdapters";

function LocationProbe() {
  return <div>location:{useLocation().pathname}</div>;
}

function renderAdapter(
  element: React.ReactNode,
  path: string,
  state?: { returnTo: string },
) {
  render(
    <MemoryRouter initialEntries={[{ pathname: path, state }]}>
      <Routes>
        <Route element={element} path={path} />
        <Route element={<LocationProbe />} path="*" />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useAuthMock.mockReset();
});

describe("Auth route redirects", () => {
  it("sends a direct customer login to bookings by default", () => {
    useAuthMock.mockReturnValue({ principal: null });

    renderAdapter(<CustomerLoginRoute />, "/login");

    expect(screen.getByText("customer-login:/bookings")).toBeInTheDocument();
  });

  it("preserves a safe customer return path", () => {
    useAuthMock.mockReturnValue({ principal: null });

    renderAdapter(<CustomerLoginRoute />, "/login", {
      returnTo: "/bookings/12",
    });

    expect(screen.getByText("customer-login:/bookings/12")).toBeInTheDocument();
  });

  it("sends staff and admin to their role-specific workspace after login", () => {
    useAuthMock.mockReturnValue({ principal: null });

    renderAdapter(<ManagementLoginRoute />, "/management/login");

    expect(
      screen.getByText("management-login:/management"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("staff-destination:/staff/counter"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("admin-destination:/management/dashboard"),
    ).toBeInTheDocument();
  });

  it.each(["STAFF", "ADMIN"] as const)(
    "redirects an authenticated %s account to its workspace home",
    (role) => {
      const principal: AuthPrincipal = {
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
      useAuthMock.mockReturnValue({ principal });

      renderAdapter(<ManagementLoginRoute />, "/management/login");

      expect(
        screen.getByText(
          `location:${role === "STAFF" ? "/staff/counter" : "/management/dashboard"}`,
        ),
      ).toBeInTheDocument();
    },
  );

  it("does not return staff to an admin-only route", () => {
    const principal: AuthPrincipal = {
      actorType: "user",
      createdAt: "2026-07-26T00:00:00.000Z",
      email: "staff@example.com",
      fullName: "STAFF",
      id: "STAFF",
      phone: null,
      role: "STAFF",
      status: "ACTIVE",
      updatedAt: "2026-07-26T00:00:00.000Z",
    };
    useAuthMock.mockReturnValue({ principal });

    renderAdapter(<ManagementLoginRoute />, "/management/login", {
      returnTo: "/management/users",
    });

    expect(screen.getByText("location:/staff/counter")).toBeInTheDocument();
  });
});

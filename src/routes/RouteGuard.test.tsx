import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { AuthContext, type AuthContextValue } from "@/auth/auth-context";
import type { AuthPrincipal } from "@/auth/types";

import { RouteGuard } from "./RouteGuard";

const customer: AuthPrincipal = {
  actorType: "customer",
  createdAt: "2026-07-24T00:00:00.000Z",
  email: null,
  fullName: "Customer",
  id: "1",
  phone: "+84900000000",
  status: "ACTIVE",
  updatedAt: "2026-07-24T00:00:00.000Z",
};

function user(role: "ADMIN" | "STAFF"): AuthPrincipal {
  return {
    actorType: "user",
    createdAt: "2026-07-24T00:00:00.000Z",
    email: `${role.toLowerCase()}@example.com`,
    fullName: role,
    id: role === "ADMIN" ? "2" : "3",
    phone: null,
    role,
    status: "ACTIVE",
    updatedAt: "2026-07-24T00:00:00.000Z",
  };
}

function LocationResult() {
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo;

  return (
    <div>
      {location.pathname}|{returnTo ?? ""}
    </div>
  );
}

function renderGuard(
  principal: AuthPrincipal | null,
  roles?: Array<"ADMIN" | "STAFF">,
) {
  const value: AuthContextValue = {
    error: null,
    isAuthenticated: principal !== null,
    login: vi.fn(),
    loginCustomer: vi.fn(),
    loginUser: vi.fn(),
    logout: vi.fn(),
    principal,
    restore: vi.fn(),
    status: principal ? "authenticated" : "anonymous",
    updatePrincipal: vi.fn(),
  };

  render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={["/protected?tab=one"]}>
        <Routes>
          <Route
            element={
              <RouteGuard actor="user" loginPath="/login" roles={roles} />
            }
          >
            <Route path="/protected" element={<div>protected</div>} />
          </Route>
          <Route path="/login" element={<LocationResult />} />
          <Route path="/forbidden" element={<div>forbidden</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("RouteGuard", () => {
  it("preserves the requested path for anonymous users", () => {
    renderGuard(null);

    expect(screen.getByText("/login|/protected?tab=one")).toBeInTheDocument();
  });

  it("rejects the wrong actor type", () => {
    renderGuard(customer);

    expect(screen.getByText("forbidden")).toBeInTheDocument();
  });

  it("rejects a staff account from an admin-only route", () => {
    renderGuard(user("STAFF"), ["ADMIN"]);

    expect(screen.getByText("forbidden")).toBeInTheDocument();
  });

  it("rejects an admin account from a staff-only POS route", () => {
    renderGuard(user("ADMIN"), ["STAFF"]);

    expect(screen.getByText("forbidden")).toBeInTheDocument();
  });

  it("renders the protected route for an allowed role", () => {
    renderGuard(user("ADMIN"), ["ADMIN"]);

    expect(screen.getByText("protected")).toBeInTheDocument();
  });
});

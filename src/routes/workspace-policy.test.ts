import { describe, expect, it } from "vitest";

import type { AuthPrincipal } from "@/auth/types";

import {
  getPrincipalHome,
  resolvePostLoginRoute,
} from "./workspace-policy";

function adminPrincipal(): AuthPrincipal {
  return {
    actorType: "user",
    createdAt: "2026-08-22T00:00:00.000Z",
    email: "admin@example.com",
    fullName: "Admin",
    id: "admin-1",
    phone: null,
    role: "ADMIN",
    status: "ACTIVE",
    updatedAt: "2026-08-22T00:00:00.000Z",
  };
}

function staffPrincipal(): AuthPrincipal {
  return {
    actorType: "user",
    createdAt: "2026-08-22T00:00:00.000Z",
    email: "staff@example.com",
    fullName: "Staff",
    id: "staff-1",
    phone: null,
    role: "STAFF",
    status: "ACTIVE",
    updatedAt: "2026-08-22T00:00:00.000Z",
  };
}

function customerPrincipal(): AuthPrincipal {
  return {
    actorType: "customer",
    createdAt: "2026-08-22T00:00:00.000Z",
    email: "guest@example.com",
    fullName: "Khách",
    id: "customer-1",
    phone: "+84900000000",
    status: "ACTIVE",
    updatedAt: "2026-08-22T00:00:00.000Z",
  };
}

describe("post-login routing policy (regression)", () => {
  it("routes a customer to the public home page", () => {
    expect(resolvePostLoginRoute(customerPrincipal())).toBe("/");
    expect(getPrincipalHome(customerPrincipal())).toBe("/");
  });

  it("routes a staff user to the staff counter", () => {
    expect(resolvePostLoginRoute(staffPrincipal())).toBe("/staff/counter");
    expect(getPrincipalHome(staffPrincipal())).toBe("/staff/counter");
  });

  it("routes an ADMIN to the management bookings workflow — NEVER the staff counter", () => {
    const home = getPrincipalHome(adminPrincipal());
    const resolved = resolvePostLoginRoute(adminPrincipal());

    expect(home).toBe("/management/bookings");
    expect(resolved).toBe("/management/bookings");
    expect(home).not.toBe("/staff/counter");
    expect(resolved).not.toBe("/staff/counter");
  });

  it("honors an admin-safe management returnTo", () => {
    expect(
      resolvePostLoginRoute(adminPrincipal(), {
        returnTo: "/management/payments",
      }),
    ).toBe("/management/payments");
  });

  it("rejects an admin-only returnTo for STAFF and falls back to /staff/counter", () => {
    expect(
      resolvePostLoginRoute(staffPrincipal(), {
        returnTo: "/management/users",
      }),
    ).toBe("/staff/counter");
  });
});

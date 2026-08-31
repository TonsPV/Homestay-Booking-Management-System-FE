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
    phone: "+84900000001",
    role: "ADMIN",
    status: "ACTIVE",
    updatedAt: "2026-08-22T00:00:00.000Z",
  };
}

describe("ADMIN canonical home when state carries NO meaningful returnTo", () => {
  const admin = adminPrincipal();

  it.each([
    ["undefined state", undefined],
    ["null state", null],
    ["empty object", {}],
    ["unrelated state", { from: "somewhere" }],
    ["empty-string returnTo", { returnTo: "" }],
    ["login path as returnTo", { returnTo: "/login" }],
    ["management login path as returnTo", { returnTo: "/management/login" }],
    ["root path as returnTo", { returnTo: "/" }],
  ])("admin with %s resolves to /management/bookings, never /staff/counter", (_label, state) => {
    const result = resolvePostLoginRoute(admin, state);

    expect(result).toBe("/management/bookings");
    expect(result).not.toBe("/staff/counter");
    expect(getPrincipalHome(admin)).toBe("/management/bookings");
  });

  it("external absolute URL returnTo falls back to the ADMIN home", () => {
    expect(
      resolvePostLoginRoute(admin, { returnTo: "https://evil.example/x" }),
    ).toBe("/management/bookings");
  });

  it("double-slash protocol-relative returnTo falls back to the ADMIN home", () => {
    expect(
      resolvePostLoginRoute(admin, { returnTo: "//evil.example/x" }),
    ).toBe("/management/bookings");
  });
});

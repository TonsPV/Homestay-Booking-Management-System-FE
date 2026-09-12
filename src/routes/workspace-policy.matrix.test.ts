import { describe, expect, it } from "vitest";

import type { AuthPrincipal } from "@/auth/types";

import { resolvePostLoginRoute } from "./workspace-policy";

function customer(): AuthPrincipal {
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

function user(role: "ADMIN" | "STAFF"): AuthPrincipal {
  return {
    actorType: "user",
    createdAt: "2026-08-22T00:00:00.000Z",
    email: `${role.toLowerCase()}@example.com`,
    fullName: role,
    id: `user-${role}`,
    phone: null,
    role,
    status: "ACTIVE",
    updatedAt: "2026-08-22T00:00:00.000Z",
  };
}

describe("workspace landing policy (Step 4 matrix)", () => {
  describe("CUSTOMER", () => {
    it("defaults to the public home page without returnTo", () => {
      expect(resolvePostLoginRoute(customer())).toBe("/");
    });

    it("honors a customer-surface returnTo", () => {
      expect(
        resolvePostLoginRoute(customer(), { returnTo: "/bookings/12" }),
      ).toBe("/bookings/12");
    });

    it.each([
      "/staff/counter",
      "/staff/bookings",
      "/management/bookings",
      "/management/payments",
      "/management/users",
    ])("rejects cross-workspace %s and falls back to the public home page", (path) => {
      const result = resolvePostLoginRoute(customer(), { returnTo: path });

      expect(result).toBe("/");
    });
  });

  describe("STAFF", () => {
    it("defaults to /staff/counter without returnTo", () => {
      expect(resolvePostLoginRoute(user("STAFF"))).toBe("/staff/counter");
    });

    it.each(["/staff/counter", "/staff/bookings", "/staff/payments"])(
      "honors a valid staff returnTo %s",
      (path) => {
        expect(resolvePostLoginRoute(user("STAFF"), { returnTo: path })).toBe(
          path,
        );
      },
    );

    it.each(["/management/users", "/management/payments", "/management/bookings"])(
      "rejects admin-only %s and falls back to /staff/counter",
      (path) => {
        const result = resolvePostLoginRoute(user("STAFF"), {
          returnTo: path,
        });

        expect(result).toBe("/staff/counter");
        expect(result).not.toBe(path);
      },
    );

    it("rejects customer-surface returnTo and falls back to /staff/counter", () => {
      expect(
        resolvePostLoginRoute(user("STAFF"), { returnTo: "/bookings/1" }),
      ).toBe("/staff/counter");
    });
  });

  describe("ADMIN", () => {
    it("defaults to /management/bookings without returnTo", () => {
      expect(resolvePostLoginRoute(user("ADMIN"))).toBe(
        "/management/bookings",
      );
    });

    it.each([
      "/management/bookings",
      "/management/payments",
      "/management/rooms",
      "/management/bookings",
      "/management/users",
      "/management/customers",
    ])("honors a valid management returnTo %s", (path) => {
      expect(resolvePostLoginRoute(user("ADMIN"), { returnTo: path })).toBe(
        path,
      );
    });

    it.each(["/staff/counter", "/staff/bookings", "/staff/payments"])(
      "rejects staff-only %s and falls back to /management/bookings",
      (path) => {
        const result = resolvePostLoginRoute(user("ADMIN"), {
          returnTo: path,
        });

        expect(result).toBe("/management/bookings");
        expect(result).not.toBe(path);
        expect(result).not.toBe("/staff/counter");
      },
    );

    it("rejects customer-surface returnTo and falls back to /management/bookings", () => {
      expect(
        resolvePostLoginRoute(user("ADMIN"), { returnTo: "/bookings" }),
      ).toBe("/management/bookings");
    });
  });
});

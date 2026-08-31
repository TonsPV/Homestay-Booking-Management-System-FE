import { describe, expect, it } from "vitest";

import { canAccessManagementPath } from "./management-policy";
import { canAccessStaffPath } from "./staff-policy";
import {
  getUserWorkspaceDestination,
  getUserWorkspaceHome,
} from "./workspace-policy";

describe("management route policy", () => {
  it("uses a role-specific workspace home", () => {
    expect(getUserWorkspaceHome("STAFF")).toBe("/staff/counter");
    expect(getUserWorkspaceHome("ADMIN")).toBe("/management/bookings");
  });

  it("preserves deep links inside the actor workspace", () => {
    expect(
      getUserWorkspaceDestination(
        { returnTo: "/staff/bookings/42?tab=payments" },
        "STAFF",
      ),
    ).toBe("/staff/bookings/42?tab=payments");
    expect(
      getUserWorkspaceDestination(
        { returnTo: "/management/bookings/42?tab=payments" },
        "ADMIN",
      ),
    ).toBe("/management/bookings/42?tab=payments");
  });

  it("falls back from admin-only or unknown paths for staff", () => {
    expect(
      getUserWorkspaceDestination(
        { returnTo: "/management/users/12" },
        "STAFF",
      ),
    ).toBe("/staff/counter");
    expect(
      getUserWorkspaceDestination({ returnTo: "/management/unknown" }, "STAFF"),
    ).toBe("/staff/counter");
  });

  it("allows admin routes only for admin", () => {
    expect(canAccessManagementPath("/management/customers", "ADMIN")).toBe(
      true,
    );
    expect(canAccessManagementPath("/management/customers", "STAFF")).toBe(
      false,
    );
    expect(canAccessManagementPath("/management/rooms", "STAFF")).toBe(false);
    expect(canAccessStaffPath("/staff/rooms", "STAFF")).toBe(true);
    expect(canAccessStaffPath("/staff/rooms", "ADMIN")).toBe(true);
  });
});

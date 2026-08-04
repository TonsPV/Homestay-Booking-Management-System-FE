import type { AuthPrincipal, UserRole } from "@/auth/types";

import { canAccessManagementPath, MANAGEMENT_PATHS } from "./management-policy";
import { getSafeReturnTo } from "./return-to";
import { canAccessStaffPath, STAFF_PATHS } from "./staff-policy";

export function getUserWorkspaceHome(role: UserRole) {
  return role === "STAFF" ? STAFF_PATHS.counter : MANAGEMENT_PATHS.dashboard;
}

export function getPrincipalHome(principal: AuthPrincipal) {
  return principal.actorType === "customer"
    ? "/bookings"
    : getUserWorkspaceHome(principal.role);
}

export function getUserWorkspaceDestination(state: unknown, role: UserRole) {
  const home = getUserWorkspaceHome(role);
  const returnTo = getSafeReturnTo(state, home);
  const canAccess =
    canAccessStaffPath(returnTo, role) ||
    canAccessManagementPath(returnTo, role);

  return canAccess ? returnTo : home;
}

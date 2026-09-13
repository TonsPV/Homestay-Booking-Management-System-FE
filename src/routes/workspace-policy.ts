import type { AuthPrincipal, UserRole } from "@/auth/types";

import { canAccessManagementPath, MANAGEMENT_PATHS } from "./management-policy";
import { getSafeReturnTo } from "./return-to";
import { canAccessStaffPath, STAFF_PATHS } from "./staff-policy";

export function getUserWorkspaceHome(role: UserRole) {
  return role === "STAFF" ? STAFF_PATHS.counter : MANAGEMENT_PATHS.dashboard;
}

export function getPrincipalHome(principal: AuthPrincipal) {
  return principal.actorType === "customer"
    ? "/"
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

type PostLoginWorkspace = "customer" | "management" | "staff";

const CUSTOMER_SURFACE_PREFIXES = ["/account", "/bookings", "/rooms", "/room-types"] as const;

function canLandOn(
  workspace: PostLoginWorkspace,
  returnTo: string,
  principal: AuthPrincipal,
) {
  if (workspace === "customer") {
    return CUSTOMER_SURFACE_PREFIXES.some(
      (prefix) => returnTo === prefix || returnTo.startsWith(`${prefix}/`),
    );
  }

  if (principal.actorType !== "user") {
    return false;
  }

  if (workspace === "staff") {
    return canAccessStaffPath(returnTo, principal.role);
  }

  return canAccessManagementPath(returnTo, principal.role);
}

function workspaceOf(principal: AuthPrincipal): PostLoginWorkspace {
  if (principal.actorType === "customer") {
    return "customer";
  }

  return principal.role === "ADMIN" ? "management" : "staff";
}

/* A principal may only land in the workspace granted to its role. A safe
 * returnTo is preserved only when it belongs to that workspace. */
export function isPostLoginDestinationForPrincipal(
  principal: AuthPrincipal,
  returnTo: string,
) {
  return canLandOn(workspaceOf(principal), returnTo, principal);
}

/* Post-login destination resolution: honor returnTo only when the fresh
 * principal is actually allowed to LAND there on its own workspace,
 * otherwise fall back to the principal's canonical workspace home. */
export function resolvePostLoginRoute(
  principal: AuthPrincipal,
  state?: unknown,
) {
  const home = getPrincipalHome(principal);
  const returnTo = getSafeReturnTo(state, "");

  if (!returnTo) {
    return home;
  }

  return isPostLoginDestinationForPrincipal(principal, returnTo)
    ? returnTo
    : home;
}

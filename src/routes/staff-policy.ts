import type { UserRole } from "@/auth/types";

export const STAFF_WORKSPACE_ROLES: readonly UserRole[] = ["STAFF"];

export const STAFF_PATHS = {
  root: "/staff",
  counter: "/staff/counter",
  rooms: "/staff/rooms",
  bookings: "/staff/bookings",
  payments: "/staff/payments",
} as const;

export interface StaffNavItem {
  end?: boolean;
  label: string;
  to: string;
}

export const STAFF_NAVIGATION: readonly StaffNavItem[] = [
  { label: "Đặt phòng", to: STAFF_PATHS.counter },
  { label: "Phòng", to: STAFF_PATHS.rooms },
  { label: "Booking", to: STAFF_PATHS.bookings },
  { label: "Thanh toán", to: STAFF_PATHS.payments },
];

const STAFF_PREFIXES = [
  STAFF_PATHS.counter,
  STAFF_PATHS.rooms,
  STAFF_PATHS.bookings,
  STAFF_PATHS.payments,
] as const;

function matchesPathPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function canAccessStaffPath(path: string, role: UserRole) {
  if (!STAFF_WORKSPACE_ROLES.includes(role)) return false;

  const pathname = new URL(path, "https://homestay-green.local").pathname;
  return STAFF_PREFIXES.some((prefix) => matchesPathPrefix(pathname, prefix));
}

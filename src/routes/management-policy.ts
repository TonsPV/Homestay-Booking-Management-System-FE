import type { UserRole } from "@/auth/types";

export const MANAGEMENT_ROLES = [
  "ADMIN",
] as const satisfies readonly UserRole[];
export const ADMIN_ONLY_ROLES = [
  "ADMIN",
] as const satisfies readonly UserRole[];

export const MANAGEMENT_PATHS = {
  root: "/management",
  dashboard: "/management/dashboard",
  rooms: "/management/rooms",
  bookings: "/management/bookings",
  payments: "/management/payments",
  roomTypes: "/management/room-types",
  amenities: "/management/amenities",
  users: "/management/users",
  customers: "/management/customers",
} as const;

export interface ManagementNavItem {
  end?: boolean;
  label: string;
  to: string;
}

export const MANAGEMENT_NAVIGATION: readonly ManagementNavItem[] = [
  {
    end: true,
    label: "Tổng quan",
    to: MANAGEMENT_PATHS.dashboard,
  },
  {
    label: "Phòng",
    to: MANAGEMENT_PATHS.rooms,
  },
  {
    label: "Loại phòng",
    to: MANAGEMENT_PATHS.roomTypes,
  },
  {
    label: "Tiện nghi",
    to: MANAGEMENT_PATHS.amenities,
  },
  {
    label: "Booking",
    to: MANAGEMENT_PATHS.bookings,
  },
  {
    label: "Thanh toán",
    to: MANAGEMENT_PATHS.payments,
  },
  {
    label: "Nhân viên",
    to: MANAGEMENT_PATHS.users,
  },
  {
    label: "Khách hàng",
    to: MANAGEMENT_PATHS.customers,
  },
];

const MANAGEMENT_PREFIXES = [
  MANAGEMENT_PATHS.dashboard,
  MANAGEMENT_PATHS.rooms,
  MANAGEMENT_PATHS.bookings,
  MANAGEMENT_PATHS.payments,
  MANAGEMENT_PATHS.roomTypes,
  MANAGEMENT_PATHS.amenities,
  MANAGEMENT_PATHS.users,
  MANAGEMENT_PATHS.customers,
] as const;

function matchesPathPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function pathnameOf(path: string) {
  return new URL(path, "https://homestay-green.local").pathname;
}

export function canAccessManagementPath(path: string, role: UserRole) {
  const pathname = pathnameOf(path);
  return (
    role === "ADMIN" &&
    MANAGEMENT_PREFIXES.some((prefix) => matchesPathPrefix(pathname, prefix))
  );
}

import type { UserRole } from "@/auth/types";

export const MANAGEMENT_ROLES = [
  "ADMIN",
] as const satisfies readonly UserRole[];
export const ADMIN_ONLY_ROLES = [
  "ADMIN",
] as const satisfies readonly UserRole[];

export const MANAGEMENT_PATHS = {
  root: "/management",
  /* DORMANT (Phase 0): dashboard capability is absent in the Backend; the
   * alias points at the bookings workflow so policy/layout references stay
   * valid without rendering the dashboard. */
  dashboard: "/management/bookings",
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

export interface ManagementNavGroup {
  items: readonly ManagementNavItem[];
  label: string;
}

export const MANAGEMENT_NAV_GROUPS: readonly ManagementNavGroup[] = [
  {
    items: [
      /* DORMANT (Phase 0): dashboard entry removed while the Backend lacks
       * /management/dashboard/summary. Bookings is the admin landing. */
      { label: "Booking", to: MANAGEMENT_PATHS.bookings },
      { label: "Thanh toán", to: MANAGEMENT_PATHS.payments },
    ],
    label: "Vận hành",
  },
  {
    items: [
      { label: "Phòng", to: MANAGEMENT_PATHS.rooms },
      { label: "Loại phòng", to: MANAGEMENT_PATHS.roomTypes },
      { label: "Tiện nghi", to: MANAGEMENT_PATHS.amenities },
    ],
    label: "Phòng và danh mục",
  },
  {
    items: [
      { label: "Khách hàng", to: MANAGEMENT_PATHS.customers },
      { label: "Nhân viên", to: MANAGEMENT_PATHS.users },
    ],
    label: "Tài khoản",
  },
];

export const MANAGEMENT_NAVIGATION: readonly ManagementNavItem[] =
  MANAGEMENT_NAV_GROUPS.flatMap((group) => group.items);

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

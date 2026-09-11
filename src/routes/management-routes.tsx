import type { RouteObject } from "react-router-dom";

import { RouteGuard } from "./RouteGuard";
import { ADMIN_ONLY_ROLES } from "./management-policy";

const adminRoutes: RouteObject[] = [
  {
    path: "room-types",
    lazy: async () => {
      const { ManagementRoomTypesPage } =
        await import("@/features/room-types/pages/RoomTypeManagementPage");
      return { Component: ManagementRoomTypesPage };
    },
  },
  {
    path: "amenities",
    lazy: async () => {
      const { AmenityManagementPage } = await import("@/features/amenities");
      return { Component: AmenityManagementPage };
    },
  },
  {
    path: "users",
    lazy: async () => {
      const { UserAdminPage } = await import("@/features/users");
      return { Component: UserAdminPage };
    },
  },
  {
    path: "customers",
    lazy: async () => {
      const { CustomerAdminPage } = await import("@/features/customers");
      return { Component: CustomerAdminPage };
    },
  },
];

export const managementRoutes: RouteObject[] = [
  {
    index: true,
    lazy: async () => {
      const { ManagementIndexRoute } =
        await import("./ManagementRouteAdapters");
      return { Component: ManagementIndexRoute };
    },
  },
  /* DORMANT (Phase 0): the Backend no longer exposes
   * GET /management/dashboard/summary, so the dashboard page is unrouted.
   * Source is preserved under src/features/dashboard for a possible
   * capability return; do not re-add this route until the endpoint exists.
   * {
   *   path: "dashboard",
   *   lazy: async () => {
   *     const { ManagementDashboardPage } =
   *       await import("@/features/dashboard/pages/ManagementDashboardPage");
   *     return { Component: ManagementDashboardPage };
   *   },
   * },
   */
  {
    path: "rooms",
    lazy: async () => {
      const { ManagementRoomsRoute } = await import("./RoomRouteAdapters");
      return { Component: ManagementRoomsRoute };
    },
  },
  {
    path: "rooms/new",
    lazy: async () => {
      const { ManagementCreateRoomRoute } = await import("./RoomRouteAdapters");
      return { Component: ManagementCreateRoomRoute };
    },
  },
  {
    path: "rooms/:roomId",
    lazy: async () => {
      const { ManagementRoomDetailRoute } = await import("./RoomRouteAdapters");
      return { Component: ManagementRoomDetailRoute };
    },
  },
  {
    path: "rooms/:roomId/edit",
    lazy: async () => {
      const { ManagementEditRoomRoute } = await import("./RoomRouteAdapters");
      return { Component: ManagementEditRoomRoute };
    },
  },
  {
    path: "rooms/:roomId/images",
    lazy: async () => {
      const { ManagementRoomImagesRoute } = await import("./RoomRouteAdapters");
      return { Component: ManagementRoomImagesRoute };
    },
  },
  {
    path: "bookings",
    lazy: async () => {
      const { ManagementBookingsPage } = await import("@/features/bookings");
      return { Component: ManagementBookingsPage };
    },
  },
  {
    path: "bookings/:bookingId",
    lazy: async () => {
      const { ManagementBookingDetailPage } =
        await import("@/features/bookings");
      return { Component: ManagementBookingDetailPage };
    },
  },
  {
    path: "payments",
    lazy: async () => {
      const { ManagementPaymentsPage } = await import("@/features/payments");
      return { Component: ManagementPaymentsPage };
    },
  },
  {
    path: "payments/:paymentId",
    lazy: async () => {
      const { PaymentDetailPage } = await import("@/features/payments");
      return { Component: PaymentDetailPage };
    },
  },
  {
    element: (
      <RouteGuard
        actor="user"
        loginPath="/login"
        roles={ADMIN_ONLY_ROLES}
      />
    ),
    children: adminRoutes,
  },
];

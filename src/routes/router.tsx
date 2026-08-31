import { createBrowserRouter } from "react-router-dom";

import { AuthLayout } from "@/layouts/AuthLayout";
import { ManagementLayout } from "@/layouts/ManagementLayout";
import { PublicLayout } from "@/layouts/PublicLayout";
import { StaffLayout } from "@/layouts/StaffLayout";

import { RouteGuard } from "./RouteGuard";
import { RouteLoading } from "./RouteSupport";
import { authRoutes } from "./auth-routes";
import { managementRoutes } from "./management-routes";
import { MANAGEMENT_ROLES } from "./management-policy";
import { publicRoutes } from "./public-routes";
import { STAFF_WORKSPACE_ROLES } from "./staff-policy";
import { staffRoutes } from "./staff-routes";

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    HydrateFallback: RouteLoading,
    path: "/",
    children: publicRoutes,
  },
  {
    element: <AuthLayout />,
    HydrateFallback: RouteLoading,
    children: authRoutes,
  },
  {
    element: (
      <RouteGuard
        actor="user"
        loginPath="/login"
        roles={MANAGEMENT_ROLES}
      />
    ),
    HydrateFallback: RouteLoading,
    children: [
      {
        element: <ManagementLayout />,
        path: "management",
        children: managementRoutes,
      },
    ],
  },
  {
    element: (
      <RouteGuard
        actor="user"
        loginPath="/login"
        roles={STAFF_WORKSPACE_ROLES}
      />
    ),
    HydrateFallback: RouteLoading,
    children: [
      {
        element: <StaffLayout />,
        path: "staff",
        children: staffRoutes,
      },
    ],
  },
]);

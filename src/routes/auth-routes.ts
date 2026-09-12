import type { RouteObject } from "react-router-dom";

export const authRoutes: RouteObject[] = [
  {
    path: "login",
    lazy: async () => {
      const { LoginRoute } = await import("./AuthRouteAdapters");
      return { Component: LoginRoute };
    },
  },
  {
    path: "register",
    lazy: async () => {
      const { RegisterRoute } = await import("./AuthRouteAdapters");
      return { Component: RegisterRoute };
    },
  },
  {
    path: "management/login",
    lazy: async () => {
      const { ManagementLoginRoute } = await import("./AuthRouteAdapters");
      return { Component: ManagementLoginRoute };
    },
  },
];

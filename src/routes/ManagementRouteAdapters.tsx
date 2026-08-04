import { Navigate } from "react-router-dom";

import { MANAGEMENT_PATHS } from "./management-policy";

export function ManagementIndexRoute() {
  return <Navigate replace to={MANAGEMENT_PATHS.dashboard} />;
}

import { Navigate } from "react-router-dom";

import { MANAGEMENT_PATHS } from "./management-policy";

/* Phase 0: /management/dashboard/summary does not exist in the Backend, so
 * the admin landing is the bookings workflow. */
export function ManagementIndexRoute() {
  return <Navigate replace to={MANAGEMENT_PATHS.bookings} />;
}

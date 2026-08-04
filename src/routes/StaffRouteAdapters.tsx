import { Navigate } from "react-router-dom";

import { STAFF_PATHS } from "./staff-policy";

export function StaffIndexRoute() {
  return <Navigate replace to={STAFF_PATHS.counter} />;
}

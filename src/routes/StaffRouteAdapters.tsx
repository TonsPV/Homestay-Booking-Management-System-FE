import { Navigate } from "react-router-dom";

import { PaymentDetailPage } from "@/features/payments";
import { STAFF_PATHS } from "./staff-policy";

export function StaffIndexRoute() {
  return <Navigate replace to={STAFF_PATHS.counter} />;
}

export function StaffPaymentDetailRoute() {
  return (
    <PaymentDetailPage
      bookingBasePath="/staff/bookings"
      paymentBasePath="/staff/payments"
    />
  );
}

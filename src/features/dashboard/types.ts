/* DORMANT FEATURE SHIM (Phase 0): the Backend no longer exposes
 * GET /management/dashboard/summary, so the generated OpenAPI contract no
 * longer contains the Dashboard* types. The dashboard feature is kept
 * unrouted (source preserved) in case the capability returns; these local
 * types mirror the last Backend contract (removed in commit history) so the
 * dormant feature still compiles. Do NOT route this feature or call
 * /management/dashboard/summary while the endpoint is absent. */
export type BookingStatusCount = {
  cancelled: number
  checkedIn: number
  checkedOut: number
  confirmed: number
  pendingPayment: number
}

export type RoomStatusCount = {
  cleaning: number
  maintenance: number
  occupied: number
  ready: number
}

export type RevenueByMethod = {
  manual: number
  total: number
  vnpay: number
}

export type PaymentMetrics = {
  refundPending: number
  requiresReview: number
}

export type OccupancyMetrics = {
  occupancyRate: number
  roomNightsAvailable: number
  roomNightsReserved: number
}

export type DashboardSummaryResponse = {
  bookings: BookingStatusCount
  fromDate: string
  generatedAt: string
  occupancy: OccupancyMetrics
  payments: PaymentMetrics
  revenue: RevenueByMethod
  rooms: RoomStatusCount
  toDate: string
  totalRefunded: number
}

/* Query params of the removed GET /management/dashboard/summary. */
export type DashboardSummaryQuery = {
  from: string
  to: string
}

export type DashboardSummary = DashboardSummaryResponse

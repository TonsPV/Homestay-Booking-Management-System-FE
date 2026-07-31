import type {
  DashboardGetSummaryData,
  DashboardSummaryResponse,
} from '@/api/generated'

export type DashboardSummary = DashboardSummaryResponse
export type DashboardSummaryQuery = DashboardGetSummaryData['query']

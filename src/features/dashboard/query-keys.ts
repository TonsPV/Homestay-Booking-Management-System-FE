import type { DashboardSummaryQuery } from './types'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: (query: DashboardSummaryQuery) =>
    [...dashboardKeys.all, 'summary', query] as const,
}

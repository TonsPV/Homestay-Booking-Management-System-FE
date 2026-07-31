import { apiRequest } from '@/api/client'

import type { DashboardSummary, DashboardSummaryQuery } from './types'

export const dashboardApi = {
  async getSummary(
    query: DashboardSummaryQuery,
    signal?: AbortSignal,
  ) {
    const result = await apiRequest<DashboardSummary>(
      '/management/dashboard/summary',
      {
        query,
        signal,
      },
    )

    return result.data
  },
}

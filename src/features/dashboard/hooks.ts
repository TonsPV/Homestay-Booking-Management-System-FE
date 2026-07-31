import { useQuery } from '@tanstack/react-query'

import { dashboardApi } from './api'
import { dashboardKeys } from './query-keys'
import type { DashboardSummaryQuery } from './types'

export { dashboardKeys } from './query-keys'

export function useDashboardSummary(query: DashboardSummaryQuery) {
  return useQuery({
    queryKey: dashboardKeys.summary(query),
    queryFn: ({ signal }) => dashboardApi.getSummary(query, signal),
  })
}

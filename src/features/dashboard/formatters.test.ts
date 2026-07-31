import { describe, expect, it } from 'vitest'

import {
  formatDashboardMoney,
  formatDashboardPercentage,
  formatDashboardRange,
} from './formatters'

describe('dashboard formatters', () => {
  it('formats generated numeric money without losing the VND presentation', () => {
    expect(formatDashboardMoney(1_500_000)).toBe('1.500.000 ₫')
  })

  it('formats occupancy and the selected date range for Vietnamese readers', () => {
    expect(formatDashboardPercentage(62.5)).toBe('62,5%')
    expect(
      formatDashboardRange('2026-07-01', '2026-07-29'),
    ).toBe('01/07/2026 – 29/07/2026')
  })
})

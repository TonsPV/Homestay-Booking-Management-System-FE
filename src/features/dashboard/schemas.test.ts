import { describe, expect, it } from 'vitest'

import {
  createDefaultDashboardDateRange,
  dashboardDateRangeSchema,
} from './schemas'

describe('dashboard date range', () => {
  it('uses the current product-time-zone month through today by default', () => {
    expect(
      createDefaultDashboardDateRange(
        new Date('2026-07-31T18:30:00.000Z'),
      ),
    ).toEqual({
      from: '2026-08-01',
      to: '2026-08-01',
    })
  })

  it('accepts an inclusive range of up to 366 days', () => {
    expect(
      dashboardDateRangeSchema.safeParse({
        from: '2024-01-01',
        to: '2024-12-31',
      }).success,
    ).toBe(true)
  })

  it.each([
    {
      name: 'a nonexistent date',
      values: { from: '2026-02-30', to: '2026-03-01' },
    },
    {
      name: 'a reversed range',
      values: { from: '2026-07-30', to: '2026-07-01' },
    },
    {
      name: 'a range longer than 366 days',
      values: { from: '2025-01-01', to: '2026-01-02' },
    },
  ])('rejects $name', ({ values }) => {
    expect(dashboardDateRangeSchema.safeParse(values).success).toBe(
      false,
    )
  })
})

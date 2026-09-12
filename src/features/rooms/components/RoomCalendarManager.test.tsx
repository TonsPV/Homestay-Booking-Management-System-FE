import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { RoomCalendarManager } from './RoomCalendarManager'

vi.mock('../hooks', () => ({
  useBlockRoomDates: () => ({
    error: null,
    isPending: false,
    mutateAsync: vi.fn(),
  }),
  useRoomCalendar: () => ({
    data: [
      {
        booking: { bookingCode: 'HBMS-STAFF-902', id: '902' },
        id: 'calendar-902',
        reason: null,
        status: 'RESERVED',
        stayDate: '2026-09-14',
      },
    ],
    error: null,
    isError: false,
    isFetching: false,
    isPending: false,
    refetch: vi.fn(),
  }),
  useUnblockRoomDates: () => ({
    error: null,
    isPending: false,
    mutateAsync: vi.fn(),
  }),
}))

describe('RoomCalendarManager navigation', () => {
  it('opens a calendar booking inside the supplied workspace', () => {
    render(
      <MemoryRouter>
        <RoomCalendarManager bookingBasePath="/staff/bookings" roomId="10" />
      </MemoryRouter>,
    )

    for (const link of screen.getAllByRole('link', {
      name: 'HBMS-STAFF-902',
    })) {
      expect(link).toHaveAttribute('href', '/staff/bookings/902')
    }
  })
})

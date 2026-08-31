import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mutateMock = vi.hoisted(() => vi.fn())
const resetMock = vi.hoisted(() => vi.fn())

vi.mock('../hooks', () => ({
  useCreateCustomerBooking: () => ({
    error: null,
    isError: false,
    isPending: false,
    mutate: mutateMock,
    reset: resetMock,
  }),
}))

import { CreateBookingPage } from './CreateBookingPage'

function LocationProbe() {
  const location = useLocation()
  const state = location.state as { bookingCreated?: boolean } | null

  return (
    <div>
      location:{location.pathname};created:{String(state?.bookingCreated)}
    </div>
  )
}

beforeEach(() => {
  mutateMock.mockReset()
  resetMock.mockReset()
})

describe('CreateBookingPage', () => {
  it('submits the customer payload and redirects to the created detail', async () => {
    render(
      <MemoryRouter
        initialEntries={[
          '/bookings/new/12?checkIn=2099-08-10&checkOut=2099-08-12&guests=2',
        ]}
      >
        <Routes>
          <Route
            element={<CreateBookingPage />}
            path="/bookings/new/:roomId"
          />
          <Route
            element={<LocationProbe />}
            path="/bookings/:bookingId"
          />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Tên người lưu trú' }),
      { target: { value: 'Nguyễn Văn B' } },
    )
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Số điện thoại' }),
      { target: { value: '0901234567' } },
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Tạo đặt phòng' }),
    )

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledTimes(1)
    })

    expect(mutateMock.mock.calls[0]?.[0]).toEqual({
      roomId: '12',
      checkInDate: '2099-08-10',
      checkOutDate: '2099-08-12',
      guestCount: 2,
      contactName: 'Nguyễn Văn B',
      contactPhone: '0901234567',
      contactEmail: null,
      customerNote: undefined,
    })

    const [, options] = mutateMock.mock.calls[0] as [
      unknown,
      { onSuccess: (booking: { id: string }) => void },
    ]

    act(() => {
      options.onSuccess({ id: '91' })
    })

    await waitFor(() => {
      expect(
        screen.getByText('location:/bookings/91;created:true'),
      ).toBeInTheDocument()
    })
  })
})

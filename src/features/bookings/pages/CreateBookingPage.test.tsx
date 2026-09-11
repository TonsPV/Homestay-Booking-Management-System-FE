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
const mockMutationState = vi.hoisted(() => ({
  error: null as unknown,
  isError: false,
  isPending: false,
}))

vi.mock('../hooks', () => ({
  useCreateCustomerBooking: () => ({
    get error() {
      return mockMutationState.error
    },
    get isError() {
      return mockMutationState.isError
    },
    get isPending() {
      return mockMutationState.isPending
    },
    mutate: mutateMock,
    reset: resetMock,
  }),
}))

import { ApiError } from '@/api/errors'
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
  mockMutationState.error = null
  mockMutationState.isError = false
  mockMutationState.isPending = false
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

  it('displays error alert with CTA to find other rooms when 409 conflict occurs', () => {
    mockMutationState.isError = true
    mockMutationState.error = new ApiError('Room unavailable', {
      errorCode: 'BOOKING_ROOM_UNAVAILABLE',
      kind: 'http',
      status: 409,
    })

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
        </Routes>
      </MemoryRouter>,
    )

    expect(
      screen.getByText(
        'Phòng này không còn trống trong kỳ bạn đã chọn. Hãy chọn ngày hoặc phòng khác.',
      ),
    ).toBeInTheDocument()

    const ctaLink = screen.getByRole('link', { name: 'Tìm phòng khác' })
    expect(ctaLink).toBeInTheDocument()
    expect(ctaLink).toHaveAttribute(
      'href',
      '/rooms?checkIn=2099-08-10&checkOut=2099-08-12&guests=2',
    )
  })

  it('keeps the selected room and the live stay summary visible before submission', () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/bookings/new/12',
            search: '?checkIn=2099-08-10&checkOut=2099-08-12&guests=2',
            state: {
              room: {
                amenities: ['Ban công riêng', 'Điều hòa'],
                basePrice: '320000.00',
                coverImageUrl: 'https://cdn.example.com/rooms/studio-garden.jpg',
                description: 'Không gian nhìn ra khu vườn yên tĩnh.',
                id: '12',
                maxGuests: 3,
                name: 'Studio hướng vườn',
                roomTypeName: 'Phòng tiêu chuẩn',
              },
            },
          },
        ]}
      >
        <Routes>
          <Route
            element={<CreateBookingPage />}
            path="/bookings/new/:roomId"
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Studio hướng vườn')).toBeInTheDocument()
    expect(screen.getByText('Ban công riêng')).toBeInTheDocument()
    expect(screen.getByText('320.000 ₫')).toBeInTheDocument()
    expect(screen.getByText('Tối đa 3 khách')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Ảnh Studio hướng vườn' })).toHaveAttribute(
      'src',
      'https://cdn.example.com/rooms/studio-garden.jpg',
    )
    expect(
      screen.getByRole('region', { name: 'Tóm tắt kỳ lưu trú' }),
    ).toHaveTextContent('2 đêm')

    fireEvent.change(screen.getByLabelText(/^Số khách/), {
      target: { value: '3' },
    })

    expect(
      screen.getByRole('region', { name: 'Tóm tắt kỳ lưu trú' }),
    ).toHaveTextContent('3 khách')
  })
})

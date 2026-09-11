import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Booking } from '../types'
import { CustomerBookingDetailPage } from './CustomerBookingDetailPage'

const futureYear = new Date().getUTCFullYear() + 1

const booking: Booking = {
  id: '91',
  bookingCode: `BK-${futureYear}-0091`,
  customerId: '12',
  roomId: '8',
  createdByUserId: null,
  checkInDate: `${futureYear}-08-10`,
  checkOutDate: `${futureYear}-08-12`,
  guestCount: 2,
  contactName: 'Nguyễn Minh',
  contactPhone: '0901234567',
  contactEmail: 'minh@example.com',
  totalAmount: '1800000.00',
  status: 'PENDING_PAYMENT',
  paymentStatus: 'UNPAID',
  paymentExpiresAt: `${futureYear}-08-09T08:00:00.000Z`,
  customerNote: null,
  cancelledAt: null,
  cancellationReason: null,
  customer: {
    id: '12',
    fullName: 'Nguyễn Minh',
    phone: '0901234567',
  },
  room: {
    id: '8',
    roomNumber: 'A102',
    name: 'Phòng hướng vườn',
    roomType: { id: '2', name: 'Phòng đôi' },
  },
  createdByUser: null,
  createdAt: `${futureYear}-08-01T07:00:00.000Z`,
  updatedAt: `${futureYear}-08-01T07:00:00.000Z`,
}

const mocks = vi.hoisted(() => ({
  isReconciling: false,
  isStateUnknown: false,
  mutate: vi.fn(),
  refetch: vi.fn(),
  reset: vi.fn(),
  retryReconciliation: vi.fn(),
}))

vi.mock('@/features/payments/components/CustomerPaymentPanel', () => ({
  CustomerPaymentPanel: () => <section aria-label="Thanh toán booking" />,
}))

vi.mock('../hooks', () => ({
  useCustomerBooking: () => ({
    data: booking,
    error: null,
    isError: false,
    isPending: false,
    refetch: mocks.refetch,
  }),
  useCancelCustomerBooking: () => ({
    error: mocks.isStateUnknown ? new Error('Response lost') : null,
    isError: mocks.isStateUnknown,
    isPending: false,
    isReconciling: mocks.isReconciling,
    isStateUnknown: mocks.isStateUnknown,
    mutate: mocks.mutate,
    reset: mocks.reset,
    retryReconciliation: mocks.retryReconciliation,
  }),
}))

function page() {
  return (
    <MemoryRouter initialEntries={['/bookings/91']}>
      <Routes>
        <Route
          element={<CustomerBookingDetailPage />}
          path="/bookings/:bookingId"
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('CustomerBookingDetailPage reconciliation safety', () => {
  beforeEach(() => {
    booking.status = 'PENDING_PAYMENT'
    booking.paymentStatus = 'UNPAID'
    mocks.isReconciling = false
    mocks.isStateUnknown = false
    mocks.mutate.mockReset()
    mocks.refetch.mockReset()
    mocks.reset.mockReset()
    mocks.retryReconciliation.mockReset()
  })

  it('keeps cancellation disabled while authoritative state is reconciling', () => {
    mocks.isReconciling = true
    render(page())

    expect(
      screen.getByRole('button', { name: 'Hủy đặt phòng' }),
    ).toBeDisabled()
  })

  it('fails closed after reconciliation fails and cannot resubmit cancel', async () => {
    const user = userEvent.setup()
    const view = render(page())
    await user.click(screen.getByRole('button', { name: 'Hủy đặt phòng' }))

    mocks.isStateUnknown = true
    view.rerender(page())

    const confirm = screen.getByRole('button', {
      name: 'Xác nhận hủy đặt phòng',
    })
    expect(confirm).toBeDisabled()
    await user.click(confirm)
    expect(mocks.mutate).not.toHaveBeenCalled()
    expect(screen.getAllByText(/Chưa xác nhận được trạng thái đặt phòng/)).not
      .toHaveLength(0)
  })

  it('closes a stale dialog after authoritative state says cancelled', async () => {
    const user = userEvent.setup()
    const view = render(page())
    await user.click(screen.getByRole('button', { name: 'Hủy đặt phòng' }))
    await user.click(
      screen.getByRole('button', { name: 'Xác nhận hủy đặt phòng' }),
    )
    expect(mocks.mutate).toHaveBeenCalledTimes(1)

    booking.status = 'CANCELLED'
    view.rerender(page())

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(mocks.mutate).toHaveBeenCalledTimes(1)
  })

  it('recovers through status refresh before re-enabling valid actions', async () => {
    const user = userEvent.setup()
    mocks.isStateUnknown = true
    const view = render(page())

    const cancelButton = screen.getByRole('button', {
      name: 'Hủy đặt phòng',
    })
    expect(cancelButton).toBeDisabled()
    await user.click(
      screen.getByRole('button', { name: 'Thử tải lại trạng thái' }),
    )
    expect(mocks.retryReconciliation).toHaveBeenCalledWith(booking.id)

    mocks.isStateUnknown = false
    view.rerender(page())
    expect(
      screen.getByRole('button', { name: 'Hủy đặt phòng' }),
    ).toBeEnabled()
  })
})

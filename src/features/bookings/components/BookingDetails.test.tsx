import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { Booking } from '../types'
import { BookingDetails } from './BookingDetails'

const booking = {
  cancellationReason: null,
  checkInDate: '2099-01-10',
  checkOutDate: '2099-01-12',
  contactEmail: null,
  contactName: 'Khách tại quầy',
  contactPhone: '0901234567',
  createdAt: '2026-08-01T00:00:00.000Z',
  createdByUser: { fullName: 'Nhân viên nội bộ' },
  customerNote: null,
  guestCount: 2,
  paymentStatus: 'UNPAID',
  room: {
    name: 'Suite Vườn',
    roomNumber: 'A101',
    roomType: { name: 'Phòng gia đình' },
  },
  status: 'PENDING_PAYMENT',
  totalAmount: '1800000.00',
} as Booking

describe('BookingDetails', () => {
  it('hides the employee identity from the customer view', () => {
    render(<BookingDetails audience="customer" booking={booking} />)

    expect(screen.getByText('Kênh đặt phòng')).toBeInTheDocument()
    expect(screen.getByText('Đặt tại quầy')).toBeInTheDocument()
    expect(screen.queryByText('Nhân viên nội bộ')).not.toBeInTheDocument()
  })

  it('keeps the creator identity in the management view', () => {
    render(<BookingDetails booking={booking} />)

    expect(screen.getByText('Người tạo')).toBeInTheDocument()
    expect(screen.getByText('Nhân viên nội bộ')).toBeInTheDocument()
  })
})

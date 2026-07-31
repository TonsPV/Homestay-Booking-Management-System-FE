import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Payment } from '../types'
import { ManagementBookingPaymentPanel } from './ManagementBookingPaymentPanel'

const mocks = vi.hoisted(() => ({
  useCreateManualPayment: vi.fn(),
  useManagementBookingPayments: vi.fn(),
}))

vi.mock('../hooks', () => ({
  useCreateManualPayment: mocks.useCreateManualPayment,
  useManagementBookingPayments: mocks.useManagementBookingPayments,
}))

const pendingVnPayPayment = {
  id: '91',
  bookingId: '42',
  amount: '1250000.00',
  currency: 'VND',
  method: 'VNPAY',
  status: 'PENDING',
} as Payment

describe('ManagementBookingPaymentPanel', () => {
  beforeEach(() => {
    mocks.useManagementBookingPayments.mockReturnValue({
      data: { data: [], meta: undefined },
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
      isSuccess: true,
      refetch: vi.fn(),
    })
    mocks.useCreateManualPayment.mockReturnValue({
      data: { id: '92' },
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      mutate: vi.fn(),
    })
  })

  it('confirms a Backend-recorded manual payment to the operator', () => {
    render(
      <MemoryRouter>
        <ManagementBookingPaymentPanel bookingId="42" canRecord />
      </MemoryRouter>,
    )

    expect(
      screen.getByText('Đã ghi nhận thanh toán'),
    ).toBeInTheDocument()
    expect(screen.getByText(/Payment #92/)).toBeInTheDocument()
  })

  it('locks manual payment while a VNPay attempt is pending', () => {
    mocks.useManagementBookingPayments.mockReturnValue({
      data: { data: [pendingVnPayPayment], meta: undefined },
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
      isSuccess: true,
      refetch: vi.fn(),
    })
    mocks.useCreateManualPayment.mockReturnValue({
      data: undefined,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: false,
      mutate: vi.fn(),
    })

    render(
      <MemoryRouter>
        <ManagementBookingPaymentPanel bookingId="42" canRecord />
      </MemoryRouter>,
    )

    expect(
      screen.getByText('VNPay đang xử lý'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Ghi nhận đã thanh toán' }),
    ).not.toBeInTheDocument()
  })
})

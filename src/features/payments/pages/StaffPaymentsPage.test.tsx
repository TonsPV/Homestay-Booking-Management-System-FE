import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Payment } from '../types'

const useManagementPaymentsMock = vi.hoisted(() => vi.fn())

vi.mock('../hooks', () => ({
  useManagementPayments: (query: unknown) => useManagementPaymentsMock(query),
}))

import { StaffPaymentsPage } from './StaffPaymentsPage'

function payment(method: Payment['method'], id: string): Payment {
  return {
    amount: '500000.00',
    bookingId: '42',
    createdAt: '2026-08-01T08:00:00.000Z',
    createdByUser: null,
    createdByUserId: null,
    currency: 'VND',
    expiresAt: null,
    gatewayName: method === 'VNPAY' ? 'VNPAY' : null,
    gatewayReference: null,
    gatewayResponseCode: null,
    gatewayTransactionDate: null,
    gatewayTransactionId: null,
    gatewayTransactionStatus: null,
    id,
    method,
    paidAt: '2026-08-01T08:00:00.000Z',
    refundGatewayTransactionId: null,
    refundLastQueriedAt: null,
    refundMessage: null,
    refundPreviousStatus: null,
    refundReason: null,
    refundRequestId: null,
    refundRequestedAt: null,
    refundResponseCode: null,
    refundedAt: null,
    refundedByUser: null,
    refundedByUserId: null,
    refundTransactionStatus: null,
    reviewCanonicalPaymentId: null,
    reviewReason: null,
    status: 'SUCCESS',
    updatedAt: '2026-08-01T08:00:00.000Z',
  }
}

function LocationProbe() {
  return <output data-testid="location">{useLocation().search}</output>
}

beforeEach(() => {
  useManagementPaymentsMock.mockReset()
  useManagementPaymentsMock.mockReturnValue({
    data: {
      data: [
        payment('CASH', '1'),
        payment('BANK_TRANSFER', '2'),
        payment('VNPAY', '3'),
      ],
      meta: {
        pagination: { limit: 20, page: 1, total: 2, totalPages: 1 },
        staleRefundCount: 0,
      },
    },
    error: null,
    isError: false,
    isPending: false,
    refetch: vi.fn(),
  })
})

describe('StaffPaymentsPage', () => {
  it('shows only counter methods and links bookings inside the staff workspace', () => {
    render(
      <MemoryRouter initialEntries={['/staff/payments']}>
        <StaffPaymentsPage />
      </MemoryRouter>,
    )

    const methodFilter = screen.getByRole('combobox', {
      name: /Phương thức tại quầy/i,
    })
    expect(
      within(methodFilter).getByRole('option', { name: 'Tiền mặt' }),
    ).toBeInTheDocument()
    expect(
      within(methodFilter).getByRole('option', { name: 'Chuyển khoản' }),
    ).toBeInTheDocument()
    expect(
      within(methodFilter).queryByRole('option', { name: 'VNPay' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('option', { name: 'Cần đối soát' }),
    ).not.toBeInTheDocument()

    expect(screen.getAllByText('Tiền mặt').length).toBeGreaterThan(1)
    expect(screen.getAllByText('Chuyển khoản').length).toBeGreaterThan(1)
    expect(screen.queryByText('VNPay')).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: '#42' })[0]).toHaveAttribute(
      'href',
      '/staff/bookings/42',
    )
  })

  it('removes a VNPay filter injected through the URL', async () => {
    render(
      <MemoryRouter
        initialEntries={[
          '/staff/payments?method=VNPAY&status=REQUIRES_REVIEW&page=2',
        ]}
      >
        <LocationProbe />
        <StaffPaymentsPage />
      </MemoryRouter>,
    )

    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(/^$/),
    )
    expect(useManagementPaymentsMock).toHaveBeenLastCalledWith({
      limit: 20,
      method: undefined,
      page: 1,
      status: undefined,
    })
  })
})

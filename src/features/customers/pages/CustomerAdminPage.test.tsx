import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { AdminCustomer } from '../types'
import { CustomerAdminPage } from './CustomerAdminPage'

const eligibleCustomer: AdminCustomer = {
  id: '1',
  fullName: 'Khách chưa có mật khẩu',
  email: null,
  phone: '0900000001',
  status: 'ACTIVE',
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
  credentialCapabilities: {
    canSetInitialPassword: true,
    reasonCode: null,
  },
}

const configuredCustomer: AdminCustomer = {
  ...eligibleCustomer,
  id: '2',
  fullName: 'Khách đã có mật khẩu',
  phone: '0900000002',
  credentialCapabilities: {
    canSetInitialPassword: false,
    reasonCode: 'CUSTOMER_INITIAL_PASSWORD_ALREADY_CONFIGURED',
  },
}

vi.mock('../queries', () => ({
  useAdminCustomersQuery: () => ({
    data: {
      data: [eligibleCustomer, configuredCustomer],
      meta: {
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
      },
    },
    error: null,
    isPending: false,
    refetch: vi.fn(),
  }),
  useUpdateCustomerStatusMutation: () => ({
    error: null,
    isPending: false,
    mutate: vi.fn(),
    variables: undefined,
  }),
}))

describe('CustomerAdminPage credential capability', () => {
  it('shows the initial-password action only for an eligible customer', () => {
    render(<CustomerAdminPage />)

    const eligibleRow = screen
      .getAllByText(eligibleCustomer.fullName)
      .map((element) => element.closest('tr'))
      .find((row) => row !== null)
    const configuredRow = screen
      .getAllByText(configuredCustomer.fullName)
      .map((element) => element.closest('tr'))
      .find((row) => row !== null)

    expect(eligibleRow).not.toBeNull()
    expect(configuredRow).not.toBeNull()
    expect(
      within(eligibleRow as HTMLElement).getByRole('button', {
        name: 'Đặt mật khẩu ban đầu',
      }),
    ).toBeInTheDocument()
    expect(
      within(configuredRow as HTMLElement).queryByRole('button', {
        name: 'Đặt mật khẩu ban đầu',
      }),
    ).not.toBeInTheDocument()
  })
})

import { apiRequest } from '@/api/client'
import type { Customer } from '@/auth/types'

import type {
  ChangeCustomerPasswordInput,
  AdminCustomer,
  CustomerListParams,
  CustomerCredentialResult,
  SetInitialCustomerPasswordInput,
  UpdateCustomerProfileInput,
  UpdateCustomerStatusInput,
} from './types'

type LegacyAdminCustomer = Omit<
  AdminCustomer,
  'credentialCapabilities'
> & {
  credentialCapabilities?: AdminCustomer['credentialCapabilities']
}

function normalizeAdminCustomer(
  customer: LegacyAdminCustomer,
): AdminCustomer {
  return {
    ...customer,
    credentialCapabilities: customer.credentialCapabilities ?? {
      canSetInitialPassword: false,
      reasonCode: 'COMMON_NOT_FOUND',
    },
  }
}

export async function setInitialCustomerPassword({
  id,
  password,
}: SetInitialCustomerPasswordInput) {
  const result = await apiRequest<CustomerCredentialResult>(
    `/management/customers/${id}/initial-password`,
    {
      body: { password },
      method: 'PATCH',
    },
  )

  return result.data
}

export async function changeCustomerPassword(
  input: ChangeCustomerPasswordInput,
) {
  const result = await apiRequest<CustomerCredentialResult>(
    '/customers/me/password',
    {
      body: input,
      method: 'PATCH',
    },
  )

  return result.data
}

export async function getCustomerProfile() {
  const result = await apiRequest<Customer>('/customers/me')

  return result.data
}

export async function updateCustomerProfile(
  input: UpdateCustomerProfileInput,
) {
  const result = await apiRequest<Customer>('/customers/me', {
    body: input,
    method: 'PATCH',
  })

  return result.data
}

export async function listCustomers(params: CustomerListParams) {
  const result = await apiRequest<LegacyAdminCustomer[]>('/customers', {
    query: { ...params },
  })

  return {
    ...result,
    data: result.data.map(normalizeAdminCustomer),
  }
}

export async function updateCustomerStatus({
  id,
  status,
}: UpdateCustomerStatusInput) {
  const result = await apiRequest<LegacyAdminCustomer>(
    `/customers/${id}/status`,
    {
    body: { status },
    method: 'PATCH',
    },
  )

  return normalizeAdminCustomer(result.data)
}

import { apiRequest } from '@/api/client'
import type { Customer } from '@/auth/types'

import type {
  ChangeCustomerPasswordInput,
  CustomerListParams,
  CustomerCredentialResult,
  SetInitialCustomerPasswordInput,
  UpdateCustomerProfileInput,
  UpdateCustomerStatusInput,
} from './types'

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

export function listCustomers(params: CustomerListParams) {
  return apiRequest<Customer[]>('/customers', {
    query: { ...params },
  })
}

export async function updateCustomerStatus({
  id,
  status,
}: UpdateCustomerStatusInput) {
  const result = await apiRequest<Customer>(`/customers/${id}/status`, {
    body: { status },
    method: 'PATCH',
  })

  return result.data
}

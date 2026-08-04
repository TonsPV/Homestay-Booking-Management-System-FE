import type { AccountStatus } from '@/auth/types'
import type {
  AdminCustomerDto,
  CustomerCredentialResultDto,
} from '@/api/generated'
import type { EntityId } from '@/shared/types/primitives'

export interface CustomerListParams {
  limit?: number
  page?: number
  search?: string
  status?: AccountStatus
}

export interface UpdateCustomerProfileInput {
  email?: string | null
  fullName?: string
  phone?: string
}

export interface ChangeCustomerPasswordInput {
  currentPassword: string
  newPassword: string
}

export type CustomerCredentialResult = CustomerCredentialResultDto
export type AdminCustomer = AdminCustomerDto

export interface UpdateCustomerStatusInput {
  id: EntityId
  status: AccountStatus
}

export interface SetInitialCustomerPasswordInput {
  id: EntityId
  password: string
}

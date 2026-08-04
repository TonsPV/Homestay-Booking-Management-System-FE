import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { authQueryKeys } from '@/auth/query-keys'

import {
  changeCustomerPassword,
  getCustomerProfile,
  listCustomers,
  setInitialCustomerPassword,
  updateCustomerProfile,
  updateCustomerStatus,
} from './api'
import type {
  ChangeCustomerPasswordInput,
  AdminCustomer,
  CustomerListParams,
  SetInitialCustomerPasswordInput,
  UpdateCustomerProfileInput,
} from './types'

export const customerQueryKeys = {
  adminLists: () => ['customers', 'admin', 'list'] as const,
  adminList: (params: CustomerListParams) =>
    ['customers', 'admin', 'list', params] as const,
  all: ['customers'] as const,
  profile: ['customers', 'me'] as const,
}

export function useCustomerProfileQuery(enabled = true) {
  return useQuery({
    enabled,
    queryFn: getCustomerProfile,
    queryKey: customerQueryKeys.profile,
  })
}

export function useUpdateCustomerProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateCustomerProfileInput) =>
      updateCustomerProfile(input),
    onSuccess: (customer) => {
      queryClient.setQueryData(customerQueryKeys.profile, customer)
      queryClient.invalidateQueries({ queryKey: authQueryKeys.all })
      queryClient.invalidateQueries({
        queryKey: customerQueryKeys.adminLists(),
      })
    },
  })
}

export function useChangeCustomerPasswordMutation() {
  return useMutation({
    mutationFn: (input: ChangeCustomerPasswordInput) =>
      changeCustomerPassword(input),
  })
}

export function useSetInitialCustomerPasswordMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SetInitialCustomerPasswordInput) =>
      setInitialCustomerPassword(input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: customerQueryKeys.adminLists(),
      }),
  })
}

export function useAdminCustomersQuery(params: CustomerListParams) {
  return useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => listCustomers(params),
    queryKey: customerQueryKeys.adminList(params),
  })
}

export function useUpdateCustomerStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateCustomerStatus,
    onSuccess: (customer: AdminCustomer) => {
      queryClient.setQueriesData(
        { queryKey: customerQueryKeys.adminLists() },
        (current: unknown) => {
          if (
            typeof current !== 'object' ||
            current === null ||
            !('data' in current) ||
            !Array.isArray(current.data)
          ) {
            return current
          }

          return {
            ...current,
            data: current.data.map((item: AdminCustomer) =>
              item.id === customer.id ? { ...item, ...customer } : item,
            ),
          }
        },
      )
    },
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: customerQueryKeys.adminLists(),
      }),
  })
}

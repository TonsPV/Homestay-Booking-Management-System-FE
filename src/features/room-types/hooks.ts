import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { roomKeys } from '@/features/rooms/query-keys'

import {
  createRoomType,
  deleteRoomType,
  getAdminRoomType,
  listAllRoomTypes,
  listAdminRoomTypes,
  restoreRoomType,
  setRoomTypeAmenities,
  updateRoomType,
} from './api'
import { roomTypeKeys } from './query-keys'
import type {
  CreateRoomTypeInput,
  ListAdminRoomTypesQuery,
  UpdateRoomTypeInput,
} from './types'

export { roomTypeKeys } from './query-keys'

export function useRoomTypeOptions(enabled = true) {
  return useQuery({
    enabled,
    queryFn: ({ signal }) => listAllRoomTypes(signal),
    queryKey: roomTypeKeys.allOptions(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useAdminRoomTypes(query: ListAdminRoomTypesQuery = {}) {
  return useQuery({
    queryFn: ({ signal }) => listAdminRoomTypes(query, signal),
    queryKey: roomTypeKeys.adminList(query),
  })
}

export function useAdminRoomType(id: string, enabled = true) {
  return useQuery({
    enabled: enabled && id.length > 0,
    queryFn: ({ signal }) => getAdminRoomType(id, signal),
    queryKey: roomTypeKeys.adminDetail(id),
  })
}

function useInvalidateRoomTypes() {
  const queryClient = useQueryClient()

  return () => queryClient.invalidateQueries({ queryKey: roomTypeKeys.all })
}

function useInvalidateRoomTypeDependencies() {
  const queryClient = useQueryClient()

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: roomTypeKeys.all }),
      queryClient.invalidateQueries({ queryKey: roomKeys.all }),
    ])
}

export function useCreateRoomType() {
  const invalidate = useInvalidateRoomTypes()

  return useMutation({
    mutationFn: createRoomType,
    onSuccess: invalidate,
  })
}

export function useUpdateRoomType() {
  const invalidate = useInvalidateRoomTypeDependencies()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: UpdateRoomTypeInput
    }) => updateRoomType(id, input),
    onSuccess: invalidate,
  })
}

export function useDeleteRoomType() {
  const invalidate = useInvalidateRoomTypeDependencies()

  return useMutation({
    mutationFn: deleteRoomType,
    onSuccess: invalidate,
  })
}

export function useRestoreRoomType() {
  const invalidate = useInvalidateRoomTypeDependencies()

  return useMutation({
    mutationFn: restoreRoomType,
    onSuccess: invalidate,
  })
}

export function useSetRoomTypeAmenities() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      amenityIds,
      id,
    }: {
      amenityIds: string[]
      id: string
    }) => setRoomTypeAmenities(id, { amenityIds }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: roomTypeKeys.all }),
        queryClient.invalidateQueries({ queryKey: roomKeys.all }),
      ])
    },
  })
}

export type { CreateRoomTypeInput }

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { roomTypeKeys } from '@/features/room-types/query-keys'
import { roomKeys } from '@/features/rooms/query-keys'

import {
  createAmenity,
  deleteAmenity,
  listAdminAmenities,
  listAllAmenities,
  restoreAmenity,
  updateAmenity,
} from './api'
import { amenityKeys } from './query-keys'
import type {
  CreateAmenityInput,
  ListAdminAmenitiesQuery,
  UpdateAmenityInput,
} from './types'

export { amenityKeys } from './query-keys'

export function useAmenityOptions(enabled = true) {
  return useQuery({
    enabled,
    queryFn: ({ signal }) => listAllAmenities(signal),
    queryKey: amenityKeys.allOptions(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useAdminAmenities(query: ListAdminAmenitiesQuery = {}) {
  return useQuery({
    queryFn: ({ signal }) => listAdminAmenities(query, signal),
    queryKey: amenityKeys.adminList(query),
  })
}

function useInvalidateAmenityDependencies() {
  const queryClient = useQueryClient()

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: amenityKeys.all }),
      queryClient.invalidateQueries({ queryKey: roomTypeKeys.all }),
      queryClient.invalidateQueries({ queryKey: roomKeys.all }),
    ])
}

export function useCreateAmenity() {
  const invalidate = useInvalidateAmenityDependencies()
  return useMutation({ mutationFn: createAmenity, onSuccess: invalidate })
}

export function useUpdateAmenity() {
  const invalidate = useInvalidateAmenityDependencies()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAmenityInput }) =>
      updateAmenity(id, input),
    onSuccess: invalidate,
  })
}

export function useDeleteAmenity() {
  const invalidate = useInvalidateAmenityDependencies()
  return useMutation({ mutationFn: deleteAmenity, onSuccess: invalidate })
}

export function useRestoreAmenity() {
  const invalidate = useInvalidateAmenityDependencies()
  return useMutation({ mutationFn: restoreAmenity, onSuccess: invalidate })
}

export type { CreateAmenityInput }

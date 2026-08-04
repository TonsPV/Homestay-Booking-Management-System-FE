import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { dashboardKeys } from '@/features/dashboard/query-keys'
import { bookingKeys } from '@/features/bookings/query-keys'

import {
  blockRoomDates,
  createRoom,
  createRoomImage,
  deleteRoom,
  deleteRoomImage,
  getManagementRoom,
  getRoom,
  listAvailableRooms,
  listManagementRooms,

  listRoomCalendar,
  listRooms,
  searchRooms,
  setRoomCoverImage,
  updateRoom,
  updateRoomStatus,
  unblockRoomDates,
} from './api'
import { roomKeys } from './query-keys'
import type {
  BlockRoomDatesInput,
  CreateRoomImageInput,
  ListAvailableRoomsQuery,
  ListManagementRoomsQuery,

  ListRoomsQuery,
  RoomCalendarRange,
  RoomStatus,
  SearchRoomsQuery,
  UpdateRoomInput,
} from './types'

export { roomKeys } from './query-keys'

export function useRooms(query: ListRoomsQuery = {}) {
  return useQuery({
    queryFn: ({ signal }) => listRooms(query, signal),
    queryKey: roomKeys.list(query),
  })
}

export function useRoomSearch(query: SearchRoomsQuery | undefined) {
  return useQuery({
    enabled: query !== undefined,
    queryFn: ({ signal }) => searchRooms(query as SearchRoomsQuery, signal),
    queryKey:
      query === undefined
        ? (['rooms', 'public', 'search', 'idle'] as const)
        : roomKeys.search(query),
  })
}

export function useRoom(id: string, enabled = true) {
  return useQuery({
    enabled: enabled && id.length > 0,
    queryFn: ({ signal }) => getRoom(id, signal),
    queryKey: roomKeys.detail(id),
  })
}

export function useManagementRooms(query: ListManagementRoomsQuery = {}) {
  return useQuery({
    queryFn: ({ signal }) => listManagementRooms(query, signal),
    queryKey: roomKeys.managementList(query),
  })
}

export function useAvailableRooms(query: ListAvailableRoomsQuery | undefined) {
  return useQuery({
    enabled: query !== undefined,
    queryFn: ({ signal }) =>
      listAvailableRooms(query as ListAvailableRoomsQuery, signal),
    queryKey:
      query === undefined
        ? (['rooms', 'management', 'available', 'idle'] as const)
        : roomKeys.available(query),
  })
}

export function useManagementRoom(id: string, enabled = true) {

  return useQuery({
    enabled: enabled && id.length > 0,
    queryFn: ({ signal }) => getManagementRoom(id, signal),
    queryKey: roomKeys.managementDetail(id),
  })
}

export function useRoomCalendar(
  id: string,
  range: RoomCalendarRange,
  enabled = true,
) {
  return useQuery({
    enabled: enabled && id.length > 0,
    queryFn: ({ signal }) => listRoomCalendar(id, range, signal),
    queryKey: roomKeys.calendar(id, range),
  })
}

function useInvalidateRoomOperations() {
  const queryClient = useQueryClient()

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: roomKeys.all }),
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
      queryClient.invalidateQueries({ queryKey: bookingKeys.management() }),
    ])
}

export function useCreateRoom() {
  const invalidate = useInvalidateRoomOperations()

  return useMutation({
    mutationFn: createRoom,
    onSuccess: invalidate,
  })
}

export function useUpdateRoom() {
  const invalidate = useInvalidateRoomOperations()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: UpdateRoomInput
    }) => updateRoom(id, input),
    onSuccess: invalidate,
  })
}

export function useDeleteRoom() {
  const invalidate = useInvalidateRoomOperations()

  return useMutation({
    mutationFn: deleteRoom,
    onSuccess: invalidate,
  })
}

export function useUpdateRoomStatus() {
  const invalidate = useInvalidateRoomOperations()

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string
      status: RoomStatus
    }) => updateRoomStatus(id, status),
    onSuccess: invalidate,
  })
}

export function useBlockRoomDates() {
  const invalidate = useInvalidateRoomOperations()

  return useMutation({
    mutationFn: ({
      input,
      roomId,
    }: {
      input: BlockRoomDatesInput
      roomId: string
    }) => blockRoomDates(roomId, input),
    onSettled: invalidate,
  })
}

export function useUnblockRoomDates() {
  const invalidate = useInvalidateRoomOperations()

  return useMutation({
    mutationFn: ({
      range,
      roomId,
    }: {
      range: RoomCalendarRange
      roomId: string
    }) => unblockRoomDates(roomId, range),
    onSettled: invalidate,
  })
}

export function useCreateRoomImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      input,
      roomId,
    }: {
      input: CreateRoomImageInput
      roomId: string
    }) => createRoomImage(roomId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: roomKeys.all }),
  })
}

export function useDeleteRoomImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteRoomImage,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: roomKeys.all }),
  })
}

export function useSetRoomCoverImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: setRoomCoverImage,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: roomKeys.all }),
  })
}

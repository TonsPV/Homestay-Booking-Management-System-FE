import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'

import { useAuth } from '@/auth/useAuth'
import { ManagementRoomDetailPage } from '@/features/rooms/pages/ManagementRoomDetailPage'
import { ManagementRoomsPage } from '@/features/rooms/pages/ManagementRoomsPage'
import { PublicRoomDetailPage } from '@/features/rooms/pages/PublicRoomDetailPage'
import { PublicRoomsPage } from '@/features/rooms/pages/PublicRoomsPage'
import { RoomSearchPage } from '@/features/rooms/pages/RoomSearchPage'
import type { Room, SearchRoomsQuery } from '@/features/rooms/types'

interface RoomLocationState {
  search?: SearchRoomsQuery
}

export function PublicRoomsRoute() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requestedRoomTypeId = searchParams.get('roomTypeId') ?? ''
  const roomTypeId = /^[1-9][0-9]*$/.test(requestedRoomTypeId)
    ? requestedRoomTypeId
    : ''

  return (
    <PublicRoomsPage
      key={roomTypeId || 'all-room-types'}
      initialRoomTypeId={roomTypeId}
      onOpenSearch={() => navigate('/rooms/search')}
      onViewRoom={(roomId) => navigate(`/rooms/${roomId}`)}
    />
  )
}

export function RoomSearchRoute() {
  const navigate = useNavigate()

  return (
    <RoomSearchPage
      onViewRoom={(roomId, search) =>
        navigate(`/rooms/${roomId}`, { state: { search } })
      }
    />
  )
}

function createBookingUrl(roomId: string, search?: SearchRoomsQuery) {
  const params = new URLSearchParams()

  if (search?.checkIn) {
    params.set('checkIn', search.checkIn)
  }
  if (search?.checkOut) {
    params.set('checkOut', search.checkOut)
  }
  if (search?.guests) {
    params.set('guests', String(search.guests))
  }

  const query = params.toString()
  return `/bookings/new/${roomId}${query ? `?${query}` : ''}`
}

export function PublicRoomDetailRoute() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as RoomLocationState | null

  if (!roomId || !/^[1-9][0-9]*$/.test(roomId)) {
    return <Navigate replace to="/rooms" />
  }

  function bookRoom(room: Room) {
    navigate(createBookingUrl(room.id, state?.search), {
      state: {
        room: {
          id: room.id,
          name: room.name,
          roomNumber: room.roomNumber,
          roomTypeName: room.roomType.name,
        },
        search: state?.search,
      },
    })
  }

  return (
    <PublicRoomDetailPage
      onBack={() => navigate(-1)}
      onBook={bookRoom}
      roomId={roomId}
    />
  )
}

export function ManagementRoomsRoute() {
  const { principal } = useAuth()
  const navigate = useNavigate()

  if (principal?.actorType !== 'user') {
    return <Navigate replace to="/forbidden" />
  }

  return (
    <ManagementRoomsPage
      onViewRoom={(roomId) => navigate(`/management/rooms/${roomId}`)}
      role={principal.role}
    />
  )
}

export function ManagementRoomDetailRoute() {
  const { principal } = useAuth()
  const { roomId } = useParams()
  const navigate = useNavigate()

  if (principal?.actorType !== 'user') {
    return <Navigate replace to="/forbidden" />
  }

  if (!roomId || !/^[1-9][0-9]*$/.test(roomId)) {
    return <Navigate replace to="/management/rooms" />
  }

  return (
    <ManagementRoomDetailPage
      onBack={() => navigate('/management/rooms')}
      onDeleted={() => navigate('/management/rooms', { replace: true })}
      role={principal.role}
      roomId={roomId}
    />
  )
}

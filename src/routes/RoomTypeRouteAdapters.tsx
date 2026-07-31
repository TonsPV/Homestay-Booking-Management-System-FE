import { Navigate, useParams } from 'react-router-dom'

export function PublicRoomTypesRoute() {
  return <Navigate replace to="/rooms" />
}

export function PublicRoomTypeDetailRoute() {
  const { roomTypeId } = useParams()

  if (!roomTypeId || !/^[1-9][0-9]*$/.test(roomTypeId)) {
    return <Navigate replace to="/rooms" />
  }

  return (
    <Navigate
      replace
      to={`/rooms?roomTypeId=${encodeURIComponent(roomTypeId)}`}
    />
  )
}

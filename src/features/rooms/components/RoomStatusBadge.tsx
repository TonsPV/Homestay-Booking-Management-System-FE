import { Badge } from '@/shared/components/Badge'

import { ROOM_STATUS_PRESENTATION } from '../status'
import type { RoomStatus } from '../types'

interface RoomStatusBadgeProps {
  status: RoomStatus
}

export function RoomStatusBadge({ status }: RoomStatusBadgeProps) {
  const presentation = ROOM_STATUS_PRESENTATION[status]

  return <Badge tone={presentation.tone}>{presentation.label}</Badge>
}

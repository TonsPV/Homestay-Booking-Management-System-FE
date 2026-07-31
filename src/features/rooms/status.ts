import type { RoomStatus } from './types'

export const ROOM_STATUS_PRESENTATION: Record<
  RoomStatus,
  {
    label: string
    tone: 'amber' | 'blue' | 'emerald' | 'rose' | 'slate' | 'violet'
  }
> = {
  CLEANING: { label: 'Đang vệ sinh', tone: 'blue' },
  HIDDEN: { label: 'Đã ẩn', tone: 'slate' },
  MAINTENANCE: { label: 'Bảo trì', tone: 'amber' },
  OCCUPIED: { label: 'Đang có khách', tone: 'violet' },
  READY: { label: 'Sẵn sàng', tone: 'emerald' },
}

export function getRoomStatusLabel(status: RoomStatus) {
  return ROOM_STATUS_PRESENTATION[status].label
}

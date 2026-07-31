import type { Room } from '@/features/rooms/types'
import { Card } from '@/shared/components/Card'
import {
  formatDateOnly,
  formatMoney,
} from '@/shared/formatting/formatters'

import { nightsBetween } from './counterRoomAvailability'

interface CounterBookingSummaryProps {
  checkIn?: string
  checkOut?: string
  contactEmail?: string
  contactName?: string
  contactPhone?: string
  guests?: number
  room?: Room
}

function SummaryRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-ink">{value}</dd>
    </div>
  )
}

export function CounterBookingSummary({
  checkIn,
  checkOut,
  contactEmail,
  contactName,
  contactPhone,
  guests,
  room,
}: CounterBookingSummaryProps) {
  const nights = nightsBetween(checkIn, checkOut)
  const nightlyPrice = room ? Number(room.roomType.basePrice) : 0
  const total = nights > 0 && room ? nights * nightlyPrice : undefined

  return (
    <Card aria-label="Tóm tắt booking" className="grid gap-4" role="region">
      <h2 className="font-bold text-ink">Tóm tắt booking</h2>

      <dl className="grid gap-2.5">
        <SummaryRow
          label="Phòng"
          value={
            room ? `${room.roomNumber} · ${room.name}` : 'Chưa chọn phòng'
          }
        />
        <SummaryRow
          label="Ngày"
          value={
            checkIn && checkOut
              ? `${formatDateOnly(checkIn)} – ${formatDateOnly(checkOut)}`
              : '—'
          }
        />
        <SummaryRow
          label="Số đêm"
          value={nights > 0 ? String(nights) : '—'}
        />
        <SummaryRow
          label="Số khách"
          value={guests && guests >= 1 ? String(guests) : '—'}
        />
        <SummaryRow
          label="Giá mỗi đêm"
          value={room ? formatMoney(room.roomType.basePrice) : '—'}
        />
      </dl>

      <div className="flex items-baseline justify-between gap-3 border-t border-line pt-3">
        <span className="text-sm font-semibold text-ink">Tổng tạm tính</span>
        <span className="text-lg font-bold text-ink">
          {total !== undefined ? formatMoney(String(total)) : '—'}
        </span>
      </div>
      <p className="text-xs text-muted">
        Giá hiển thị để tham khảo. Hệ thống xác nhận tổng tiền cuối cùng khi
        tạo booking.
      </p>

      <div className="grid gap-2.5 border-t border-line pt-3">
        <h3 className="text-sm font-semibold text-ink">Thông tin liên hệ</h3>
        <dl className="grid gap-2.5">
          <SummaryRow label="Số điện thoại" value={contactPhone || '—'} />
          <SummaryRow label="Họ tên" value={contactName || '—'} />
          <SummaryRow label="Email" value={contactEmail || '—'} />
        </dl>
      </div>
    </Card>
  )
}

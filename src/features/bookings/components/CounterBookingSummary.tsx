import type { Room } from '@/features/rooms/types'
import { Badge } from '@/shared/components/Badge'
import { formatDateOnly, formatMoney } from '@/shared/formatting/formatters'

import { nightsBetween } from './counterRoomAvailability'

interface CounterBookingSummaryProps {
  checkIn?: string
  checkOut?: string
  guests?: number
  room?: Room
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-semibold text-ink">{value}</dd>
    </div>
  )
}

function estimateTotal(basePrice: string, nights: number) {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(basePrice)

  if (!match || nights < 1) return undefined

  const cents =
    BigInt(match[1]) * 100n + BigInt((match[2] ?? '').padEnd(2, '0'))
  const total = cents * BigInt(nights)

  return `${total / 100n}.${(total % 100n).toString().padStart(2, '0')}`
}

export function CounterBookingSummary({
  checkIn,
  checkOut,
  guests,
  room,
}: CounterBookingSummaryProps) {
  const nights = nightsBetween(checkIn, checkOut)
  const estimatedTotal = room
    ? estimateTotal(room.roomType.basePrice, nights)
    : undefined

  return (
    <section aria-label="Tóm tắt booking" className="grid gap-4" role="region">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-black text-ink">Booking hiện tại</h2>
        <Badge tone={room ? 'blue' : 'slate'}>
          {room ? 'Đã chọn phòng' : 'Chưa chọn phòng'}
        </Badge>
      </div>

      {room ? (
        <div className="rounded-card bg-brand-soft p-4">
          <p className="text-xs font-bold text-brand-strong">
            PHÒNG {room.roomNumber}
          </p>
          <p className="mt-1 text-lg font-black text-ink">{room.name}</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-muted">{room.roomType.name}</span>
            <span className="font-black text-ink">
              {formatMoney(room.roomType.basePrice)}
              <span className="text-xs font-medium text-muted"> / đêm</span>
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-card bg-surface-muted px-4 py-6 text-sm text-muted">
          Chọn một phòng trống để tiếp tục nhập thông tin khách.
        </div>
      )}

      <dl className="grid gap-2.5">
        <SummaryRow
          label="Kỳ lưu trú"
          value={
            checkIn && checkOut
              ? `${formatDateOnly(checkIn)} – ${formatDateOnly(checkOut)}`
              : 'Chưa chọn ngày'
          }
        />
        <SummaryRow label="Số đêm" value={nights > 0 ? String(nights) : '—'} />
        <SummaryRow
          label="Số khách"
          value={guests && guests >= 1 ? String(guests) : '—'}
        />
      </dl>

      {estimatedTotal ? (
        <div className="flex items-end justify-between gap-4 border-t border-line pt-4">
          <div>
            <p className="text-sm font-bold text-ink">Tạm tính</p>
            <p className="mt-0.5 text-xs text-muted">
              Theo giá cơ bản × số đêm
            </p>
          </div>
          <p className="text-xl font-black tracking-tight text-ink">
            {formatMoney(estimatedTotal)}
          </p>
        </div>
      ) : null}
    </section>
  )
}

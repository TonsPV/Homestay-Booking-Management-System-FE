import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { getErrorMessage } from '@/api/errors'
import { useRoomTypeOptions } from '@/features/room-types'
import { useRooms } from '@/features/rooms/hooks'
import { resolveRoomImageUrl } from '@/features/rooms/image-url'
import type { Room } from '@/features/rooms/types'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { LinkButton } from '@/shared/components/LinkButton'
import { formatMoney, formatNumber } from '@/shared/formatting/formatters'

const heroImageUrl =
  'https://picsum.photos/seed/homestay-booking-suite/1200/760'

function toDateInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)

  return next
}

function getCoverImage(room: Room) {
  return room.images.find((image) => image.isCover) ?? room.images[0]
}

function fallbackImage(seed: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/700/460`
}

export function HomePage() {
  const navigate = useNavigate()
  const today = useMemo(() => new Date(), [])
  const [checkIn, setCheckIn] = useState(() => toDateInput(addDays(today, 1)))
  const [checkOut, setCheckOut] = useState(() => toDateInput(addDays(today, 2)))
  const [guests, setGuests] = useState('2')
  const [roomTypeId, setRoomTypeId] = useState('')
  const [searchError, setSearchError] = useState('')
  const roomTypesQuery = useRoomTypeOptions()
  const roomsQuery = useRooms({ limit: 6, page: 1 })

  const roomTypes = roomTypesQuery.data ?? []
  const rooms = roomsQuery.data?.items ?? []
  const featuredRooms = rooms.slice(0, 5)

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!checkIn || !checkOut) {
      setSearchError('Vui lòng chọn ngày nhận phòng và ngày trả phòng.')
      return
    }

    if (checkIn >= checkOut) {
      setSearchError('Ngày trả phòng phải sau ngày nhận phòng.')
      return
    }

    const guestCount = Number(guests)
    if (!Number.isInteger(guestCount) || guestCount < 1) {
      setSearchError('Số khách phải từ 1 trở lên.')
      return
    }

    const params = new URLSearchParams({
      checkIn,
      checkOut,
      guests: String(guestCount),
    })

    if (roomTypeId) {
      params.set('roomTypeId', roomTypeId)
    }

    navigate(`/rooms/search?${params.toString()}`)
  }

  return (
    <div className="grid gap-10 pb-12 sm:gap-12">
      <section
        className="animate-soft-scale overflow-hidden rounded-panel border border-line bg-surface shadow-card"
        data-home-hero
      >
        <div className="grid lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
          <div className="flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
            <p className="text-sm font-bold uppercase tracking-widest text-brand">
              Homestay Green
            </p>
            <h1 className="mt-4 max-w-2xl text-3xl font-black leading-[1.08] tracking-tight text-ink sm:text-4xl lg:text-5xl">
              Tìm nơi lưu trú vừa ý, đặt phòng gọn trong vài bước.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg">
              Dữ liệu phòng, loại phòng và giá được lấy từ hệ thống để khách
              chọn đúng phòng đang mở bán.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton className="min-h-12 px-6" to="/rooms/search">
                Tìm phòng
              </LinkButton>
              <LinkButton
                className="min-h-12 px-6"
                to="/rooms"
                variant="outline"
              >
                Xem phòng
              </LinkButton>
            </div>
          </div>

          <div className="relative min-h-72 overflow-hidden bg-surface-muted sm:min-h-80 lg:min-h-full">
            <img
              alt="Không gian homestay sáng, có giường nghỉ và ánh sáng tự nhiên"
              className="size-full object-cover"
              decoding="async"
              src={heroImageUrl}
            />
            <div className="absolute inset-0 bg-linear-to-t from-ink/45 via-ink/5 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 rounded-card border border-white/25 bg-surface/92 p-4 text-ink shadow-elevation-3 backdrop-blur">
              <p className="text-sm font-black">
                Phòng phù hợp, giá rõ ràng
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                Kiểm tra ngày, số khách và loại phòng trước khi gửi yêu cầu.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Card
        className="animate-soft-rise mx-auto w-full max-w-6xl overflow-hidden border-line p-0 shadow-elevation-4"
        data-home-search-dock
      >
        <form
          className="grid gap-4 bg-brand p-4 sm:p-5 lg:grid-cols-[1.2fr_1fr_1fr_0.9fr_auto] lg:items-end"
          onSubmit={submitSearch}
        >
          <label className="grid gap-2">
            <span className="text-sm font-black text-white">Loại lưu trú</span>
            <select
              className="min-h-14 rounded-control border border-white/70 bg-surface px-4 text-sm font-semibold text-ink shadow-elevation-1 outline-none transition focus:ring-4 focus:ring-white/35"
              disabled={roomTypesQuery.isPending || roomTypesQuery.isError}
              onChange={(event) => setRoomTypeId(event.target.value)}
              value={roomTypeId}
            >
              <option value="">Tất cả loại phòng</option>
              {roomTypes.map((roomType) => (
                <option key={roomType.id} value={roomType.id}>
                  {roomType.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-black text-white">Check-in</span>
            <input
              className="min-h-14 rounded-control border border-white/70 bg-surface px-4 text-sm font-semibold text-ink shadow-elevation-1 outline-none transition focus:ring-4 focus:ring-white/35"
              min={toDateInput(today)}
              onChange={(event) => setCheckIn(event.target.value)}
              required
              type="date"
              value={checkIn}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-black text-white">Check-out</span>
            <input
              className="min-h-14 rounded-control border border-white/70 bg-surface px-4 text-sm font-semibold text-ink shadow-elevation-1 outline-none transition focus:ring-4 focus:ring-white/35"
              min={checkIn || toDateInput(today)}
              onChange={(event) => setCheckOut(event.target.value)}
              required
              type="date"
              value={checkOut}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-black text-white">Khách</span>
            <input
              className="min-h-14 rounded-control border border-white/70 bg-surface px-4 text-sm font-semibold text-ink shadow-elevation-1 outline-none transition focus:ring-4 focus:ring-white/35"
              inputMode="numeric"
              min={1}
              onChange={(event) => setGuests(event.target.value)}
              required
              step={1}
              type="number"
              value={guests}
            />
          </label>

          <Button
            className="min-h-14 whitespace-nowrap bg-cyan-600 px-7 text-base hover:bg-cyan-700 focus-visible:outline-white lg:mb-0"
            type="submit"
          >
            Tìm phòng
          </Button>

          {searchError || roomTypesQuery.isError ? (
            <p className="rounded-control bg-white/95 px-4 py-3 text-sm font-semibold text-danger lg:col-span-5">
              {searchError ||
                `Không thể tải loại phòng: ${getErrorMessage(roomTypesQuery.error)}`}
            </p>
          ) : null}
        </form>
      </Card>

      <section aria-labelledby="property-type-heading">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2
              className="text-2xl font-black tracking-tight text-ink sm:text-3xl"
              id="property-type-heading"
            >
              Khám phá theo loại lưu trú
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Chọn nhanh một nhóm phòng, sau đó xem các phòng còn phù hợp.
            </p>
          </div>
          <Link
            className="hidden min-h-11 shrink-0 items-center rounded-control px-3 text-sm font-bold text-brand transition hover:text-brand-strong hover:underline sm:inline-flex"
            to="/rooms"
          >
            Xem phòng
          </Link>
        </div>

        {roomTypesQuery.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                className="h-48 animate-pulse rounded-card bg-surface-muted"
                key={index}
              />
            ))}
          </div>
        ) : roomTypesQuery.isError ? (
          <Card className="border-danger-soft bg-danger-soft p-5 text-sm font-semibold text-danger">
            Không thể tải loại phòng: {getErrorMessage(roomTypesQuery.error)}
          </Card>
        ) : roomTypes.length === 0 ? (
          <Card className="border-line p-5 text-sm text-muted">
            Chưa có loại phòng public để hiển thị.
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {roomTypes.slice(0, 4).map((roomType) => {
              const matchingRoom = rooms.find(
                (room) => room.roomTypeId === roomType.id,
              )
              const cover = matchingRoom ? getCoverImage(matchingRoom) : null
              const imageUrl = cover
                ? resolveRoomImageUrl(cover.imageUrl)
                : fallbackImage(`room-type-${roomType.id}`)

              return (
                <Link
                  className="group min-w-0 overflow-hidden rounded-card bg-surface shadow-card ring-1 ring-line transition duration-base ease-calm hover:-translate-y-1 hover:shadow-elevation-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transform-none"
                  key={roomType.id}
                  to={`/rooms?roomTypeId=${roomType.id}`}
                >
                  <img
                    alt={`Loại lưu trú ${roomType.name}`}
                    className="h-32 w-full object-cover transition duration-slow ease-calm group-hover:scale-[1.03] motion-reduce:transform-none sm:h-36"
                    decoding="async"
                    src={imageUrl}
                  />
                  <div className="px-4 py-3">
                    <p className="font-black text-ink">{roomType.name}</p>
                    <p className="mt-1 text-xs font-semibold text-muted">
                      Tối đa {formatNumber(roomType.maxGuests)} khách
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="featured-room-heading">
        <div className="mb-5">
          <h2
            className="text-2xl font-black tracking-tight text-ink sm:text-3xl"
            id="featured-room-heading"
          >
            Phòng nổi bật
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Một vài lựa chọn đang được mở bán từ danh sách phòng public.
          </p>
        </div>

        {roomsQuery.isPending ? (
          <div className="grid gap-4 lg:grid-cols-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                className={
                  index < 2
                    ? 'h-44 animate-pulse rounded-card bg-surface-muted lg:col-span-3'
                    : 'h-44 animate-pulse rounded-card bg-surface-muted lg:col-span-2'
                }
                key={index}
              />
            ))}
          </div>
        ) : roomsQuery.isError ? (
          <Card className="border-danger-soft bg-danger-soft p-5 text-sm font-semibold text-danger">
            Không thể tải phòng nổi bật: {getErrorMessage(roomsQuery.error)}
          </Card>
        ) : featuredRooms.length === 0 ? (
          <Card className="border-line p-5 text-sm text-muted">
            Chưa có phòng public để hiển thị.
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-6">
            {featuredRooms.map((room, index) => {
              const cover = getCoverImage(room)
              const imageUrl = cover
                ? resolveRoomImageUrl(cover.imageUrl)
                : fallbackImage(`room-${room.id}`)

              return (
                <Link
                  className={
                    index < 2
                      ? 'group relative min-h-48 overflow-hidden rounded-card bg-ink shadow-card lg:col-span-3'
                      : 'group relative min-h-48 overflow-hidden rounded-card bg-ink shadow-card lg:col-span-2'
                  }
                  key={room.id}
                  to={`/rooms/${room.id}`}
                >
                  <img
                    alt={`Phòng ${room.name}`}
                    className="absolute inset-0 size-full object-cover transition duration-slow ease-calm group-hover:scale-[1.04] motion-reduce:transform-none"
                    decoding="async"
                    src={imageUrl}
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-ink/75 via-ink/25 to-transparent" />
                  <div className="relative flex min-h-48 flex-col justify-end p-5 text-white">
                    <p className="w-fit rounded-control bg-surface/95 px-3 py-1 text-xs font-black text-brand shadow-elevation-1">
                      {room.roomType.name}
                    </p>
                    <h3 className="mt-3 line-clamp-2 text-xl font-black leading-tight">
                      {room.name}
                    </h3>
                    <p className="mt-2 text-sm font-semibold text-white/90">
                      Từ {formatMoney(room.roomType.basePrice)} mỗi đêm
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-6 overflow-hidden rounded-panel border border-line bg-brand-soft p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
        <div>
          <h2 className="text-2xl font-black text-ink">
            Bạn đã có booking?
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Đăng nhập để kiểm tra chi tiết, thời hạn thanh toán hoặc yêu cầu hủy.
          </p>
        </div>
        <Link
          className="inline-flex min-h-11 shrink-0 items-center rounded-control font-bold text-brand transition hover:text-brand-strong hover:underline"
          to="/login"
        >
          Quản lý booking của tôi
        </Link>
      </section>
    </div>
  )
}

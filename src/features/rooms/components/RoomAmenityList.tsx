import { Check } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Input } from '@/shared/components/FormControls'

interface Amenity {
  description: string | null
  id: string
  name: string
}

interface RoomAmenityListProps {
  amenities: Amenity[]
}

/** Above this many amenities the list gains a name filter (CLIENT-03). */
const SEARCH_THRESHOLD = 8

/**
 * Public amenity list for the client room detail page (CLIENT-03): name plus
 * description when the Backend provides one, "show all" expansion, and a
 * name filter with an explicit empty state for long lists. Data comes only
 * from the public room-type contract.
 */
export function RoomAmenityList({ amenities }: RoomAmenityListProps) {
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const searchable = amenities.length > SEARCH_THRESHOLD

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (normalizedQuery === '') {
      return amenities
    }

    return amenities.filter((amenity) =>
      amenity.name.toLowerCase().includes(normalizedQuery),
    )
  }, [amenities, query])

  if (amenities.length === 0) {
    return null
  }

  const collapsedLimit = 6
  const filteredIsLong = filtered.length > collapsedLimit
  const visible =
    showAll || query.trim() !== '' || !filteredIsLong
      ? filtered
      : filtered.slice(0, collapsedLimit)
  const hiddenCount = filtered.length - visible.length

  return (
    <div className="grid gap-4">
      {searchable ? (
        <Input
          aria-label="Tìm tiện nghi"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm tiện nghi theo tên"
          type="search"
          value={query}
        />
      ) : null}

      {searchable && filtered.length === 0 ? (
        <p className="text-sm text-muted">
          Không có tiện nghi nào khớp từ khóa “{query.trim()}”.
        </p>
      ) : (
        <ul className="grid gap-x-8 sm:grid-cols-2">
          {visible.map((amenity) => (
            <li
              className="flex gap-3 border-b border-line py-4 first:pt-0 sm:[&:nth-child(2)]:pt-0"
              key={amenity.id}
            >
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                <Check aria-hidden="true" className="size-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink">{amenity.name}</p>
                {amenity.description ? (
                  <p className="mt-1 text-sm leading-6 text-muted">
                    {amenity.description}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {hiddenCount > 0 && query.trim() === '' ? (
        <button
          className="w-fit text-sm font-bold text-brand-strong underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          onClick={() => setShowAll(true)}
          type="button"
        >
          Xem tất cả {amenities.length} tiện nghi
        </button>
      ) : null}

      {showAll && query.trim() === '' && filteredIsLong ? (
        <button
          className="w-fit text-sm font-bold text-brand-strong underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          onClick={() => setShowAll(false)}
          type="button"
        >
          Thu gọn
        </button>
      ) : null}
    </div>
  )
}

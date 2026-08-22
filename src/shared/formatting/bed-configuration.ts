import type { BedType, RoomTypeBedResponseDto } from '@/api/generated'

const BED_TYPE_LABELS: Record<BedType, string> = {
  SINGLE: 'Giường đơn',
  DOUBLE: 'Giường đôi',
  QUEEN: 'Giường queen',
  KING: 'Giường king',
  BUNK: 'Giường tầng',
  SOFA_BED: 'Giường sofa',
}

const MAX_BED_QUANTITY = 20

export function formatBedConfiguration(
  beds: readonly RoomTypeBedResponseDto[] | null | undefined,
  legacyBedType?: string | null,
): string | null {
  const source = beds ?? []

  if (source.length > 0) {
    const formatted = source
      .filter(
        (bed) =>
          BED_TYPE_LABELS[bed.type] !== undefined &&
          Number.isSafeInteger(bed.quantity) &&
          bed.quantity >= 1 &&
          bed.quantity <= MAX_BED_QUANTITY,
      )
      .map((bed) => `${bed.quantity} ${BED_TYPE_LABELS[bed.type]}`)

    return formatted.length > 0 ? formatted.join(' · ') : null
  }

  const legacy = legacyBedType?.trim()
  return legacy ? legacy : null
}

export { BED_TYPE_LABELS }

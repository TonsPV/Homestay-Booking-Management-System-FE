interface DecimalParts {
  fraction: string
  integer: string
  negative: boolean
}

function parseDecimal(value: string): DecimalParts | null {
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(value.trim())

  if (!match) {
    return null
  }

  return {
    fraction: (match[3] ?? '').replace(/0+$/, ''),
    integer: match[2].replace(/^0+(?=\d)/, ''),
    negative: match[1] === '-',
  }
}

function compareMagnitude(left: DecimalParts, right: DecimalParts) {
  if (left.integer.length !== right.integer.length) {
    return left.integer.length > right.integer.length ? 1 : -1
  }

  if (left.integer !== right.integer) {
    return left.integer > right.integer ? 1 : -1
  }

  const fractionLength = Math.max(
    left.fraction.length,
    right.fraction.length,
  )
  const leftFraction = left.fraction.padEnd(fractionLength, '0')
  const rightFraction = right.fraction.padEnd(fractionLength, '0')

  if (leftFraction === rightFraction) {
    return 0
  }

  return leftFraction > rightFraction ? 1 : -1
}

export function compareDecimalStrings(leftValue: string, rightValue: string) {
  const left = parseDecimal(leftValue)
  const right = parseDecimal(rightValue)

  if (!left || !right) {
    throw new Error('Cannot compare invalid decimal strings.')
  }

  if (left.negative !== right.negative) {
    return left.negative ? -1 : 1
  }

  const magnitude = compareMagnitude(left, right)
  return left.negative ? -magnitude : magnitude
}

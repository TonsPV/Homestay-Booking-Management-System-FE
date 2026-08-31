import type {
  CreateBookingInput,
  CreateManagementBookingInput,
} from './types'

type BookingIntentInput = CreateBookingInput | CreateManagementBookingInput
type BookingIntentScope = 'customer' | 'management'

interface PersistedBookingIntent {
  actorId: string
  actorScope: BookingIntentScope
  createdAt: number
  fingerprint: string
  idempotencyKey: string
}

interface MemoryBookingIntent {
  intent: PersistedBookingIntent
  persisted: boolean
}

const STORAGE_PREFIX = 'hbms:bookings:create'
const STORAGE_VERSION = 'v3'
const memoryIntents = new Map<string, MemoryBookingIntent>()

function legacyStorageKey(scope: BookingIntentScope) {
  return `${STORAGE_PREFIX}:${scope}`
}

function actorlessV2StorageKey(
  scope: BookingIntentScope,
  inputFingerprint: string,
) {
  return `${STORAGE_PREFIX}:v2:${scope}:${encodeURIComponent(inputFingerprint)}`
}

function intentIdentity(
  scope: BookingIntentScope,
  actorId: string,
  inputFingerprint: string,
) {
  return JSON.stringify([scope, actorId, inputFingerprint])
}

/**
 * Each semantic payload owns a separate localStorage entry. Unlike a single
 * scope-level collection, concurrent tabs cannot overwrite unrelated intents
 * through a read-modify-write race.
 */
function intentStorageKey(
  scope: BookingIntentScope,
  actorId: string,
  inputFingerprint: string,
) {
  return `${STORAGE_PREFIX}:${STORAGE_VERSION}:${scope}:${encodeURIComponent(actorId)}:${encodeURIComponent(inputFingerprint)}`
}

function readStorageItem(key: string): PersistedBookingIntent | null | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }

  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as PersistedBookingIntent) : null
  } catch {
    return undefined
  }
}

function writeStorageItem(key: string, intent: PersistedBookingIntent) {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(intent))
    return true
  } catch {
    return false
  }
}

function removeStorageItem(key: string) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(key)
  } catch {
    // The in-memory entry is still removed even when persistence is unavailable.
  }
}

function normalizePhone(value: string | undefined) {
  if (value === undefined) {
    return undefined
  }

  const compact = value.trim().replace(/[().\-\s]/g, '')
  const subscriberNumber = compact.startsWith('+84')
    ? compact.slice(3)
    : compact.startsWith('84')
      ? compact.slice(2)
      : compact.startsWith('0')
        ? compact.slice(1)
        : compact

  return /^[35789][0-9]{8}$/.test(subscriberNumber)
    ? `+84${subscriberNumber}`
    : compact
}

function normalizeOptionalText(value: string | undefined) {
  return value === undefined ? undefined : value.trim()
}

function normalizeNullableText(value: string | null | undefined) {
  if (value === undefined || value === null || value === '') {
    return null
  }

  return value.trim()
}

function legacyStableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(legacyStableValue)
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, legacyStableValue(item)]),
    )
  }

  return value
}

function legacyFingerprint(input: BookingIntentInput) {
  return JSON.stringify(legacyStableValue(input))
}

function fingerprint(scope: BookingIntentScope, input: BookingIntentInput) {
  const checkInDate = input.checkInDate.trim()
  const checkOutDate = input.checkOutDate.trim()
  const nights =
    (Date.parse(`${checkOutDate}T00:00:00.000Z`) -
      Date.parse(`${checkInDate}T00:00:00.000Z`)) /
    86_400_000
  const normalizedInput = {
    roomId: input.roomId,
    checkInDate,
    checkOutDate,
    nights,
    guestCount: input.guestCount,
    contactName: normalizeOptionalText(input.contactName),
    contactPhone: normalizePhone(input.contactPhone),
    contactEmail:
      input.contactEmail === undefined
        ? undefined
        : input.contactEmail === null || input.contactEmail === ''
          ? null
          : input.contactEmail.trim().toLowerCase(),
    customerNote: normalizeNullableText(input.customerNote),
  }
  const requestedCustomerId =
    scope === 'management' && 'customerId' in input
      ? input.customerId === null || input.customerId === ''
        ? undefined
        : input.customerId
      : undefined

  return JSON.stringify(
    scope === 'management'
      ? { input: normalizedInput, requestedCustomerId }
      : { input: normalizedInput },
  )
}

function isValidIntent(
  intent: PersistedBookingIntent,
  scope: BookingIntentScope,
  actorId: string,
  inputFingerprint: string,
) {
  return (
    intent.actorScope === scope &&
    intent.actorId === actorId &&
    Number.isFinite(intent.createdAt) &&
    intent.createdAt > 0 &&
    intent.fingerprint === inputFingerprint &&
    typeof intent.idempotencyKey === 'string' &&
    intent.idempotencyKey.length > 0 &&
    intent.idempotencyKey.length <= 100
  )
}

function createKey(scope: BookingIntentScope) {
  const randomPart =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

  return `booking-${scope}-${randomPart}`.slice(0, 100)
}

function removeIntentByFingerprint(
  scope: BookingIntentScope,
  actorId: string,
  inputFingerprint: string,
  oldFingerprint: string,
) {
  const identity = intentIdentity(scope, actorId, inputFingerprint)
  memoryIntents.delete(identity)
  removeStorageItem(intentStorageKey(scope, actorId, inputFingerprint))

  // Actor-less v1/v2 entries cannot safely be assigned to any authenticated
  // principal. Discard only this semantic payload instead of replaying it.
  removeStorageItem(actorlessV2StorageKey(scope, inputFingerprint))

  const legacyIntent = readStorageItem(legacyStorageKey(scope))
  if (legacyIntent?.fingerprint === oldFingerprint) {
    removeStorageItem(legacyStorageKey(scope))
  }
}

function readIntent(
  scope: BookingIntentScope,
  actorId: string,
  inputFingerprint: string,
): PersistedBookingIntent | null {
  const identity = intentIdentity(scope, actorId, inputFingerprint)
  const memoryEntry = memoryIntents.get(identity)
  const key = intentStorageKey(scope, actorId, inputFingerprint)
  const persistedIntent = readStorageItem(key)

  if (persistedIntent !== undefined) {
    if (
      persistedIntent !== null &&
      isValidIntent(persistedIntent, scope, actorId, inputFingerprint)
    ) {
      memoryIntents.set(identity, { intent: persistedIntent, persisted: true })
      return persistedIntent
    }

    if (memoryEntry?.persisted) {
      memoryIntents.delete(identity)
    }

    if (persistedIntent !== null) {
      removeStorageItem(key)
    }

    if (memoryEntry !== undefined && !memoryEntry.persisted) {
      if (isValidIntent(memoryEntry.intent, scope, actorId, inputFingerprint)) {
        return memoryEntry.intent
      }
      memoryIntents.delete(identity)
    }
  } else if (memoryEntry !== undefined) {
    if (isValidIntent(memoryEntry.intent, scope, actorId, inputFingerprint)) {
      return memoryEntry.intent
    }
    memoryIntents.delete(identity)
  }

  return null
}

function discardActorlessLegacyIntent(
  scope: BookingIntentScope,
  inputFingerprint: string,
  oldFingerprint: string,
) {
  removeStorageItem(actorlessV2StorageKey(scope, inputFingerprint))

  const legacyIntent = readStorageItem(legacyStorageKey(scope))
  if (legacyIntent?.fingerprint === oldFingerprint) {
    removeStorageItem(legacyStorageKey(scope))
  }
}

function assertActorId(actorId: string) {
  if (actorId.length === 0) {
    throw new Error('Booking intent actor ID is required.')
  }
}

/**
 * Returns one stable request identity for one semantic booking payload. Each
 * fingerprint is stored independently, so another payload or browser tab
 * cannot replace a pending unknown-outcome attempt.
 */
export function getOrCreateBookingIntentKey(
  scope: BookingIntentScope,
  actorId: string,
  input: BookingIntentInput,
) {
  assertActorId(actorId)
  const inputFingerprint = fingerprint(scope, input)
  const existing = readIntent(scope, actorId, inputFingerprint)

  if (existing !== null) {
    return existing.idempotencyKey
  }

  discardActorlessLegacyIntent(
    scope,
    inputFingerprint,
    legacyFingerprint(input),
  )

  const intent: PersistedBookingIntent = {
    actorId,
    actorScope: scope,
    createdAt: Date.now(),
    fingerprint: inputFingerprint,
    idempotencyKey: createKey(scope),
  }
  const persisted = writeStorageItem(
    intentStorageKey(scope, actorId, inputFingerprint),
    intent,
  )
  memoryIntents.set(intentIdentity(scope, actorId, inputFingerprint), {
    intent,
    persisted,
  })
  return intent.idempotencyKey
}

/** Removes only the completed semantic payload, never unrelated attempts. */
export function clearBookingIntent(
  scope: BookingIntentScope,
  actorId: string,
  input: BookingIntentInput,
) {
  removeIntentByFingerprint(
    scope,
    actorId,
    fingerprint(scope, input),
    legacyFingerprint(input),
  )
}

/**
 * A request-intent conflict proves this local key cannot represent the current
 * payload. Remove only that poisoned association so an explicit retry can use
 * a fresh key after authoritative reconciliation.
 */
export function quarantineBookingIntent(
  scope: BookingIntentScope,
  actorId: string,
  input: BookingIntentInput,
) {
  removeIntentByFingerprint(
    scope,
    actorId,
    fingerprint(scope, input),
    legacyFingerprint(input),
  )
}

/** Test isolation for the same-tab fallback; persistent entries are separate. */
export function resetBookingIntentMemoryForTests() {
  memoryIntents.clear()
}

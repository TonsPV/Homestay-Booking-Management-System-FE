import { afterEach, describe, expect, it, vi } from 'vitest'

// The resolver compares against the configured API origin, which a local
// .env file (VITE_API_ORIGIN) can point at a deployed backend. Pin the
// config so these unit tests never depend on machine-local env files.
const mocks = vi.hoisted(() => ({
  appConfig: { apiOrigin: 'http://localhost:3000' },
}))

vi.mock('@/app/config', () => ({
  appConfig: mocks.appConfig,
}))

import { resolveRoomImageUrl } from './image-url'

describe('resolveRoomImageUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('resolves managed backend paths against the browser origin in dev', () => {
    vi.stubEnv('DEV', true)
    expect(
      resolveRoomImageUrl('/media/room-images/5/image.webp'),
    ).toBe('/media/room-images/5/image.webp')
  })

  it('resolves managed backend paths without a leading slash', () => {
    vi.stubEnv('DEV', true)
    expect(
      resolveRoomImageUrl('media/room-images/5/image.webp'),
    ).toBe('/media/room-images/5/image.webp')
  })

  it('keeps managed paths absolute against the API origin outside dev', () => {
    vi.stubEnv('DEV', false)
    expect(
      resolveRoomImageUrl('/media/room-images/5/image.webp'),
    ).toBe('http://localhost:3000/media/room-images/5/image.webp')
  })

  it('preserves absolute legacy image URLs', () => {
    expect(
      resolveRoomImageUrl('https://cdn.example.com/rooms/5.jpg'),
    ).toBe('https://cdn.example.com/rooms/5.jpg')
  })

  it('rejects unsupported URL schemes', () => {
    expect(resolveRoomImageUrl('javascript:alert(1)')).toBeUndefined()
  })
})

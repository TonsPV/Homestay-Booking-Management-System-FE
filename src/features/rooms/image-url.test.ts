import { describe, expect, it } from 'vitest'

import { resolveRoomImageUrl } from './image-url'

describe('resolveRoomImageUrl', () => {
  it('resolves managed backend paths against the API origin', () => {
    expect(
      resolveRoomImageUrl('/media/room-images/5/image.webp'),
    ).toBe('http://localhost:3000/media/room-images/5/image.webp')
  })

  it('resolves managed backend paths without a leading slash', () => {
    expect(
      resolveRoomImageUrl('media/room-images/5/image.webp'),
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

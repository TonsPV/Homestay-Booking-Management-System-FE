import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { usePendingRoomImages } from './pending-room-images'

const createObjectUrl = vi.fn((file: File) => `blob:${file.name}`)
const revokeObjectUrl = vi.fn()

function imageFile(name: string, type = 'image/png') {
  return new File(['room-image'], name, { type })
}

beforeEach(() => {
  createObjectUrl.mockClear()
  revokeObjectUrl.mockClear()
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: createObjectUrl,
  })
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: revokeObjectUrl,
  })
})

afterEach(() => {
  Reflect.deleteProperty(URL, 'createObjectURL')
  Reflect.deleteProperty(URL, 'revokeObjectURL')
})

describe('usePendingRoomImages', () => {
  it('accepts multiple files, chooses the first cover, and normalizes order', () => {
    const { result } = renderHook(() => usePendingRoomImages())

    act(() => {
      result.current.addFiles([
        imageFile('one.png'),
        imageFile('two.png'),
        imageFile('three.png'),
      ])
    })

    expect(result.current.images.map((image) => image.sortOrder)).toEqual([
      0, 1, 2,
    ])
    expect(result.current.images.map((image) => image.isCover)).toEqual([
      true,
      false,
      false,
    ])
    expect(createObjectUrl).toHaveBeenCalledTimes(3)
  })

  it('rejects unsupported files without creating previews', () => {
    const { result } = renderHook(() => usePendingRoomImages())

    act(() => {
      result.current.addFiles([imageFile('room.svg', 'image/svg+xml')])
    })

    expect(result.current.images).toHaveLength(0)
    expect(result.current.inputError).toContain('Chỉ chấp nhận ảnh JPEG')
    expect(createObjectUrl).not.toHaveBeenCalled()
  })

  it('enforces the ten-file limit while keeping valid files selected', () => {
    const { result } = renderHook(() => usePendingRoomImages())

    act(() => {
      result.current.addFiles(
        Array.from({ length: 11 }, (_, index) => imageFile(`room-${index}.png`)),
      )
    })

    expect(result.current.images).toHaveLength(10)
    expect(result.current.inputError).toContain('tối đa 10 ảnh')
    expect(createObjectUrl).toHaveBeenCalledTimes(10)
  })

  it('keeps one cover through selection, reorder, and removal', () => {
    const { result } = renderHook(() => usePendingRoomImages())

    act(() => {
      result.current.addFiles([imageFile('one.png'), imageFile('two.png')])
    })
    const firstId = result.current.images[0].clientId
    const secondId = result.current.images[1].clientId

    act(() => result.current.setCover(secondId))
    act(() => result.current.moveImage(secondId, 'up'))

    expect(result.current.images[0].clientId).toBe(secondId)
    expect(result.current.images.filter((image) => image.isCover)).toHaveLength(1)
    expect(result.current.images[0].isCover).toBe(true)

    act(() => result.current.removeImage(secondId))

    expect(result.current.images[0].clientId).toBe(firstId)
    expect(result.current.images[0].isCover).toBe(true)
    expect(result.current.images[0].sortOrder).toBe(0)
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:two.png')
  })

  it('reflects the Backend cover when the selected cover upload falls back', () => {
    const { result } = renderHook(() => usePendingRoomImages())

    act(() => {
      result.current.addFiles([imageFile('one.png'), imageFile('two.png')])
    })
    const [first, second] = result.current.images

    act(() =>
      result.current.updateImageStatus({
        clientId: first.clientId,
        status: 'failed',
      }),
    )
    act(() =>
      result.current.updateImageStatus({
        clientId: second.clientId,
        isCover: true,
        status: 'uploaded',
      }),
    )

    expect(result.current.images.find((image) => image.clientId === first.clientId))
      .toMatchObject({ isCover: false, requestedCover: true })
    expect(result.current.images.find((image) => image.clientId === second.clientId))
      .toMatchObject({ isCover: true })
  })

  it('revokes every remaining preview on reset and unmount', () => {
    const { result, unmount } = renderHook(() => usePendingRoomImages())

    act(() => {
      result.current.addFiles([imageFile('one.png'), imageFile('two.png')])
    })
    act(() => result.current.reset())

    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:one.png')
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:two.png')

    act(() => {
      result.current.addFiles([imageFile('three.png')])
    })
    unmount()

    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:three.png')
  })
})

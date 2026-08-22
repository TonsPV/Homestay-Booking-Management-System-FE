import { describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/api/errors'

import {
  createRoomWithImages,
  uploadRoomImages,
} from './create-room-with-images'
import type { PendingRoomImage } from './pending-room-images'
import type { Room, RoomImage } from './types'

function pendingImage(
  clientId: string,
  sortOrder: number,
  isCover = false,
): PendingRoomImage {
  return {
    clientId,
    file: new File([clientId], `${clientId}.png`, { type: 'image/png' }),
    isCover,
    previewUrl: `blob:${clientId}`,
    sortOrder,
    status: 'pending',
  }
}

const room = { id: 'room-7' } as Room
const uploadedImage = (id: string) => ({ id }) as RoomImage

describe('createRoomWithImages', () => {
  it('does not upload when creating the room fails', async () => {
    const create = vi.fn().mockRejectedValue(new Error('create failed'))
    const upload = vi.fn()

    await expect(
      createRoomWithImages(
        {} as never,
        [pendingImage('one', 0, true)],
        { createRoom: create, uploadImage: upload },
      ),
    ).rejects.toThrow('create failed')

    expect(create).toHaveBeenCalledOnce()
    expect(upload).not.toHaveBeenCalled()
  })

  it('validates the pending image list before creating the room', async () => {
    const create = vi.fn().mockResolvedValue(room)
    const upload = vi.fn()

    await expect(
      createRoomWithImages(
        {} as never,
        [pendingImage('one', 0, false)],
        { createRoom: create, uploadImage: upload },
      ),
    ).rejects.toThrow('Phải có đúng một ảnh bìa.')

    expect(create).not.toHaveBeenCalled()
    expect(upload).not.toHaveBeenCalled()
  })

  it('creates once and uploads sequentially with cover first', async () => {
    const create = vi.fn().mockResolvedValue(room)
    const upload = vi
      .fn()
      .mockResolvedValueOnce(uploadedImage('cover-id'))
      .mockResolvedValueOnce(uploadedImage('second-id'))
      .mockResolvedValueOnce(uploadedImage('third-id'))
    const images = [
      pendingImage('second', 1),
      pendingImage('cover', 2, true),
      pendingImage('third', 0),
    ]
    const updates: string[] = []

    const result = await createRoomWithImages(
      {} as never,
      images,
      { createRoom: create, uploadImage: upload },
      (update) => updates.push(`${update.clientId}:${update.status}`),
    )

    expect(create).toHaveBeenCalledOnce()
    expect(upload.mock.calls.map(([, input]) => input.file.name)).toEqual([
      'cover.png',
      'third.png',
      'second.png',
    ])
    expect(upload.mock.calls.map(([, input]) => input.isCover)).toEqual([
      true,
      false,
      false,
    ])
    expect(upload.mock.calls.map(([, input]) => input.sortOrder)).toEqual([
      2, 0, 1,
    ])
    expect(result).toMatchObject({
      failedImages: [],
      room,
      stopped: false,
      uploadedCount: 3,
    })
    expect(updates).toEqual([
      'cover:uploading',
      'cover:uploaded',
      'third:uploading',
      'third:uploaded',
      'second:uploading',
      'second:uploaded',
    ])
  })

  it('continues after an ordinary image failure and returns only failed images', async () => {
    const upload = vi
      .fn()
      .mockResolvedValueOnce(uploadedImage('one-id'))
      .mockRejectedValueOnce(new Error('upload failed'))
      .mockResolvedValueOnce(uploadedImage('three-id'))
    const images = [
      pendingImage('one', 0, true),
      pendingImage('two', 1),
      pendingImage('three', 2),
    ]

    const result = await uploadRoomImages(
      room.id,
      images,
      { uploadImage: upload },
    )

    expect(upload).toHaveBeenCalledTimes(3)
    expect(result.uploadedCount).toBe(2)
    expect(result.stopped).toBe(false)
    expect(result.failedImages.map((image) => image.clientId)).toEqual(['two'])
  })

  it('stops subsequent uploads for an auth or missing-room failure', async () => {
    const authError = new ApiError('forbidden', {
      kind: 'http',
      status: 401,
    })
    const upload = vi.fn().mockRejectedValue(authError)
    const images = [
      pendingImage('cover', 0, true),
      pendingImage('second', 1),
      pendingImage('third', 2),
    ]
    const updates: Record<string, string> = {}

    const result = await uploadRoomImages(
      room.id,
      images,
      { uploadImage: upload },
      (update) => {
        updates[update.clientId] = update.status
      },
    )

    expect(upload).toHaveBeenCalledOnce()
    expect(result.stopped).toBe(true)
    expect(result.failedImages.map((image) => image.clientId)).toEqual([
      'cover',
      'second',
      'third',
    ])
    expect(updates).toEqual({ cover: 'failed', second: 'failed', third: 'failed' })
  })
})

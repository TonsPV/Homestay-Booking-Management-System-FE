import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { RoomImage } from './RoomImage'

describe('RoomImage', () => {
  it('keeps the image area stable and explains a broken image', () => {
    render(
      <RoomImage
        alt="Ảnh phòng A101"
        className="size-full"
        fallbackLabel="Không thể tải ảnh phòng"
        src="https://example.com/broken-room.jpg"
      />,
    )

    fireEvent.error(screen.getByRole('img', { name: 'Ảnh phòng A101' }))

    expect(
      screen.getByRole('img', { name: 'Ảnh phòng A101' }),
    ).toHaveTextContent('Không thể tải ảnh phòng')
  })

  it('tries again when the image URL changes', async () => {
    const { rerender } = render(
      <RoomImage alt="Ảnh phòng" src="https://example.com/broken.jpg" />,
    )

    fireEvent.error(screen.getByRole('img', { name: 'Ảnh phòng' }))
    rerender(
      <RoomImage alt="Ảnh phòng" src="https://example.com/recovered.jpg" />,
    )

    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'Ảnh phòng' })).toHaveAttribute(
        'src',
        'https://example.com/recovered.jpg',
      )
    })
  })
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { PendingRoomImage } from '../pending-room-images'
import { PendingRoomImagePicker } from './PendingRoomImagePicker'

function image(overrides: Partial<PendingRoomImage> = {}): PendingRoomImage {
  return {
    clientId: 'image-1',
    file: new File(['image'], 'garden.png', { type: 'image/png' }),
    isCover: false,
    previewUrl: 'blob:garden',
    sortOrder: 0,
    status: 'pending',
    ...overrides,
  }
}

describe('PendingRoomImagePicker', () => {
  it('renders preview metadata and accessible image actions', async () => {
    const user = userEvent.setup()
    const onMoveImage = vi.fn()
    const onRemoveImage = vi.fn()
    const onSetCover = vi.fn()
    const onRetryImage = vi.fn()
    const pending = image({
      errorMessage: 'Tải ảnh tạm thời không thành công.',
      sortOrder: 1,
      status: 'failed',
    })
    const first = image({
      clientId: 'image-0',
      file: new File(['first'], 'first.png', { type: 'image/png' }),
      isCover: true,
      previewUrl: 'blob:first',
      sortOrder: 0,
    })

    render(
      <PendingRoomImagePicker
        images={[first, pending]}
        onAddFiles={vi.fn()}
        onMoveImage={onMoveImage}
        onRemoveImage={onRemoveImage}
        onRetryImage={onRetryImage}
        onSetCover={onSetCover}
      />,
    )

    expect(document.querySelectorAll('img')[1]).toHaveAttribute(
      'src',
      pending.previewUrl,
    )
    expect(screen.getByText(pending.file.name)).toBeInTheDocument()
    expect(screen.getByText('Tải lỗi')).toBeInTheDocument()
    expect(
      screen.getByText('Tải ảnh tạm thời không thành công.'),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: `Đặt ${pending.file.name} làm ảnh bìa` }),
    )
    await user.click(
      screen.getByRole('button', { name: `Thử lại ${pending.file.name}` }),
    )
    await user.click(
      screen.getByRole('button', { name: `Đưa ${pending.file.name} lên` }),
    )
    await user.click(
      screen.getByRole('button', { name: `Xóa ảnh ${pending.file.name}` }),
    )

    expect(onSetCover).toHaveBeenCalledWith(pending.clientId)
    expect(onRetryImage).toHaveBeenCalledWith(pending.clientId)
    expect(onMoveImage).toHaveBeenCalledWith(pending.clientId, 'up')
    expect(onRemoveImage).toHaveBeenCalledWith(pending.clientId)
  })

  it('accepts multiple files through the labeled file input', async () => {
    const user = userEvent.setup()
    const onAddFiles = vi.fn()
    const first = new File(['one'], 'one.png', { type: 'image/png' })
    const second = new File(['two'], 'two.webp', { type: 'image/webp' })

    render(
      <PendingRoomImagePicker
        images={[]}
        onAddFiles={onAddFiles}
        onMoveImage={vi.fn()}
        onRemoveImage={vi.fn()}
        onSetCover={vi.fn()}
      />,
    )

    await user.upload(screen.getByLabelText('Chọn ảnh từ máy'), [first, second])

    expect(onAddFiles).toHaveBeenCalledOnce()
    expect(Array.from(onAddFiles.mock.calls[0][0])).toEqual([first, second])
    expect(screen.getByText('Chưa chọn ảnh. Bạn vẫn có thể tạo phòng không có ảnh.'))
      .toBeInTheDocument()
  })
})

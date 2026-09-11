import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

import { CreateRoomPage } from './CreateRoomPage'
import type { PendingRoomImage } from '../pending-room-images'

const mocks = vi.hoisted(() => ({
  useCreateRoomWithImages: vi.fn(),
  useRoomTypeOptions: vi.fn(),
  useUploadRoomImages: vi.fn(),
}))

vi.mock('@/features/room-types', () => ({
  useRoomTypeOptions: mocks.useRoomTypeOptions,
}))

vi.mock('../hooks', () => ({
  useCreateRoomWithImages: mocks.useCreateRoomWithImages,
  useUploadRoomImages: mocks.useUploadRoomImages,
}))

const roomTypes = [
  {
    id: '2',
    name: 'Phòng đôi',
    description: null,
    maxGuests: 2,
    basePrice: '900000.00',
    bedType: null,
    beds: [],
    amenities: [],
  },
]

function queryMock(overrides: Record<string, unknown> = {}) {
  return {
    data: roomTypes,
    error: null,
    isError: false,
    isFetching: false,
    isPending: false,
    refetch: vi.fn(),
    ...overrides,
  }
}

function mutationMock(overrides: Record<string, unknown> = {}) {
  return {
    data: undefined,
    error: null,
    isError: false,
    isPending: false,
    mutateAsync: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/management/rooms/new']}>
      <Routes>
        <Route element={null} path="/management/rooms/:roomId" />
        <Route element={<CreateRoomPage />} path="/management/rooms/new" />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mocks.useRoomTypeOptions.mockReturnValue(queryMock())
  mocks.useCreateRoomWithImages.mockReturnValue(mutationMock())
  mocks.useUploadRoomImages.mockReturnValue(mutationMock())
})

describe('CreateRoomPage', () => {
  it('renders the create form with room type options', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { name: 'Tạo phòng mới' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/Số phòng/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Tên phòng/)).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /Loại phòng/ })).toHaveValue('')
    expect(
      screen.getByRole('button', { name: 'Tạo phòng' }),
    ).toBeInTheDocument()
  })

  it('submits the form payload for the create mutation', async () => {
    const user = userEvent.setup()
    const mutateAsync = vi.fn().mockResolvedValue({
      failedImages: [],
      room: { id: '15', roomNumber: 'B202' },
      stopped: false,
      uploadedCount: 0,
    })
    mocks.useCreateRoomWithImages.mockReturnValue(
      mutationMock({ mutateAsync }),
    )

    renderPage()

    await user.type(screen.getByLabelText(/Số phòng/), 'B202')
    await user.type(screen.getByLabelText(/Tên phòng/), 'Phòng hiên đá')
    await user.selectOptions(
      screen.getByRole('combobox', { name: /Loại phòng/ }),
      '2',
    )
    await user.click(screen.getByRole('button', { name: 'Tạo phòng' }))

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledTimes(1)
    })
    expect(mutateAsync.mock.calls[0][0].input).toMatchObject({
      name: 'Phòng hiên đá',
      roomNumber: 'B202',
      roomTypeId: '2',
    })
  })

  it('reports partially failed image uploads without navigating away', async () => {
    const user = userEvent.setup()
    const pendingImage = {
      clientId: 'img-1',
      file: new File(['x'], 'cover.png', { type: 'image/png' }),
      previewUrl: 'blob:cover',
      isCover: true,
      sortOrder: 0,
      status: 'uploaded',
    } as PendingRoomImage

    mocks.useCreateRoomWithImages.mockReturnValue(
      mutationMock({
        mutateAsync: vi.fn().mockResolvedValue({
          failedImages: [pendingImage],
          room: { id: '15', roomNumber: 'B202' },
          stopped: false,
          uploadedCount: 0,
        }),
      }),
    )

    renderPage()

    await user.type(screen.getByLabelText(/Số phòng/), 'B202')
    await user.type(screen.getByLabelText(/Tên phòng/), 'Phòng hiên đá')
    await user.selectOptions(
      screen.getByRole('combobox', { name: /Loại phòng/ }),
      '2',
    )
    await user.click(screen.getByRole('button', { name: 'Tạo phòng' }))

    // The partial-upload warning appears and the page stays on /new (no
    // navigation happened: the form heading is still mounted).
    await waitFor(() => {
      expect(screen.getByText(/ảnh chưa tải lên/)).toBeInTheDocument()
    })
    expect(
      screen.getByRole('heading', { name: 'Tạo phòng mới' }),
    ).toBeInTheDocument()
  })
})

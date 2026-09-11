import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { Room } from '../types'
import { EditRoomPage } from './EditRoomPage'

const mocks = vi.hoisted(() => ({
  useManagementRoom: vi.fn(),
  useRoomTypeOptions: vi.fn(),
  useUpdateRoom: vi.fn(),
}))

vi.mock('@/features/room-types', () => ({
  useRoomTypeOptions: mocks.useRoomTypeOptions,
}))

vi.mock('../hooks', () => ({
  useManagementRoom: mocks.useManagementRoom,
  useUpdateRoom: mocks.useUpdateRoom,
}))

const room = {
  id: '5',
  roomTypeId: '2',
  roomNumber: 'A101',
  name: 'Phòng hướng vườn',
  description: 'Không gian yên tĩnh.',
  status: 'READY',
  roomType: {
    amenities: [],
    id: '2',
    name: 'Phòng đôi',
    description: null,
    maxGuests: 2,
    basePrice: '900000.00',
    bedType: null,
    beds: [],
  },
  images: [],
  createdAt: '2026-07-20T01:00:00.000Z',
  updatedAt: '2026-07-24T01:00:00.000Z',
} satisfies Room

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
    <MemoryRouter initialEntries={['/management/rooms/5/edit']}>
      <EditRoomPage roomId="5" />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mocks.useRoomTypeOptions.mockReturnValue(queryMock())
  mocks.useManagementRoom.mockReturnValue(queryMock({ data: room }))
  mocks.useUpdateRoom.mockReturnValue(mutationMock())
})

describe('EditRoomPage', () => {
  it('renders the edit header and pre-fills the form with the current room', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { name: 'Chỉnh sửa phòng A101' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/Số phòng/)).toHaveValue('A101')
    expect(screen.getByLabelText(/Tên phòng/)).toHaveValue(
      'Phòng hướng vườn',
    )
    expect(screen.getByLabelText(/Mô tả/)).toHaveValue('Không gian yên tĩnh.')
    expect(
      screen.getByRole('button', { name: 'Lưu thay đổi' }),
    ).toBeInTheDocument()
    // Status must not be editable through the edit form.
    expect(
      screen.queryByRole('combobox', { name: 'Trạng thái ban đầu' }),
    ).not.toBeInTheDocument()
  })

  it('shows an error state when the room cannot be loaded', () => {
    mocks.useManagementRoom.mockReturnValue(
      queryMock({
        data: undefined,
        error: new Error('boom'),
        isError: true,
      }),
    )

    renderPage()

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Lưu thay đổi' }),
    ).not.toBeInTheDocument()
  })

  it('submits the update payload for the update mutation', async () => {
    const user = userEvent.setup()
    const mutateAsync = vi.fn().mockResolvedValue({ ...room, name: 'Đã sửa' })
    mocks.useUpdateRoom.mockReturnValue(mutationMock({ mutateAsync }))

    renderPage()

    await user.clear(screen.getByLabelText(/Tên phòng/))
    await user.type(screen.getByLabelText(/Tên phòng/), 'Phòng hiên đá')
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledTimes(1)
    })
    expect(mutateAsync).toHaveBeenCalledWith({
      id: '5',
      input: expect.objectContaining({
        name: 'Phòng hiên đá',
        roomNumber: 'A101',
        roomTypeId: '2',
      }),
    })
  })

  it('keeps the form open and renders the API error when the update fails', async () => {
    const user = userEvent.setup()
    const mutateAsync = vi.fn().mockRejectedValue(new Error('boom'))
    mocks.useUpdateRoom.mockReturnValue(mutationMock({ mutateAsync }))

    renderPage()

    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => {
      expect(
        screen.getByText('Không thể hoàn tất thao tác. Vui lòng thử lại.'),
      ).toBeInTheDocument()
    })
    expect(
      screen.getByRole('button', { name: 'Lưu thay đổi' }),
    ).toBeInTheDocument()
  })
})

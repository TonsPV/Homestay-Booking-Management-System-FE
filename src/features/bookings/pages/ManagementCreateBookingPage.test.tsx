import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Room } from '@/features/rooms/types'

const availableRoomsMock = vi.hoisted(() => vi.fn())
const mutateMock = vi.hoisted(() => vi.fn())
const mutationState = vi.hoisted(() => ({
  error: null as unknown,
  isError: false,
  isPending: false,
}))

vi.mock('@/features/rooms/hooks', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/rooms/hooks')>()
  return {
    ...actual,
    useAvailableRooms: (query: unknown) => availableRoomsMock(query),
  }
})

vi.mock('../hooks', () => ({
  useCreateManagementBooking: () => ({
    get error() {
      return mutationState.error
    },
    get isError() {
      return mutationState.isError
    },
    get isPending() {
      return mutationState.isPending
    },
    mutate: mutateMock,
  }),
}))

import { ManagementCreateBookingPage } from './ManagementCreateBookingPage'

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    createdAt: '2026-01-01T00:00:00.000Z',
    description: null,
    id: '1',
    images: [],
    name: 'Phòng biển',
    roomNumber: '101',
    roomType: {
      amenities: [],
      basePrice: '500000',
      description: null,
      id: '10',
      maxGuests: 2,
      name: 'Deluxe',
    },
    roomTypeId: '10',
    status: 'READY',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function mockAvailability(overrides: Record<string, unknown> = {}) {
  availableRoomsMock.mockReturnValue({
    data: { items: [makeRoom()], pagination: undefined },
    error: null,
    isError: false,
    isFetching: false,
    isPending: false,
    isSuccess: true,
    refetch: vi.fn(),
    ...overrides,
  })
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ManagementCreateBookingPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function fillStayCriteria() {
  fireEvent.change(screen.getByLabelText(/Ngày nhận phòng/i), {
    target: { value: '2026-08-10' },
  })
  fireEvent.change(screen.getByLabelText(/Ngày trả phòng/i), {
    target: { value: '2026-08-12' },
  })
}

async function selectFirstRoom() {
  const option = await screen.findByRole('radio', { name: /Phòng 101/i })
  fireEvent.click(option)
  return option
}

beforeEach(() => {
  availableRoomsMock.mockReset()
  mutateMock.mockReset()
  mutationState.error = null
  mutationState.isError = false
  mutationState.isPending = false
})

describe('ManagementCreateBookingPage', () => {
  it('clears the selected room when the dates change', async () => {
    mockAvailability()
    renderPage()
    fillStayCriteria()

    const option = await selectFirstRoom()
    expect(option).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText(/Đã chọn:/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/Ngày trả phòng/i), {
      target: { value: '2026-08-15' },
    })

    await waitFor(() =>
      expect(screen.queryByText(/Đã chọn:/i)).not.toBeInTheDocument(),
    )
  })

  it('clears the selected room when the guest count changes', async () => {
    mockAvailability()
    renderPage()
    fillStayCriteria()

    await selectFirstRoom()
    expect(screen.getByText(/Đã chọn:/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/Số khách/i), {
      target: { value: '3' },
    })

    await waitFor(() =>
      expect(screen.queryByText(/Đã chọn:/i)).not.toBeInTheDocument(),
    )
  })

  it('keeps the submit button disabled until a room is selected', async () => {
    mockAvailability()
    renderPage()
    fillStayCriteria()

    await screen.findByRole('radio', { name: /Phòng 101/i })

    expect(
      screen.getByRole('button', { name: 'Tạo booking' }),
    ).toBeDisabled()
  })

  it('disables submit while availability is refetching', async () => {
    mockAvailability({ isFetching: true })
    renderPage()
    fillStayCriteria()

    await selectFirstRoom()

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Tạo booking' }),
      ).toBeDisabled(),
    )
  })

  it('does not submit with a stale roomId after criteria change', async () => {
    mockAvailability()
    renderPage()
    fillStayCriteria()

    await selectFirstRoom()

    fireEvent.change(screen.getByLabelText(/Ngày trả phòng/i), {
      target: { value: '2026-08-15' },
    })

    await waitFor(() =>
      expect(screen.queryByText(/Đã chọn:/i)).not.toBeInTheDocument(),
    )

    fireEvent.change(screen.getByLabelText(/Họ tên khách/i), {
      target: { value: 'Nguyễn Văn B' },
    })
    fireEvent.change(screen.getByLabelText(/Số điện thoại/i), {
      target: { value: '0901234567' },
    })

    const submitButton = screen.getByRole('button', { name: 'Tạo booking' })
    expect(submitButton).toBeDisabled()
    fireEvent.click(submitButton)

    expect(mutateMock).not.toHaveBeenCalled()
  })

  it('submits the selected room once all guards pass', async () => {
    mockAvailability()
    renderPage()
    fillStayCriteria()

    await selectFirstRoom()

    fireEvent.change(screen.getByLabelText(/Họ tên khách/i), {
      target: { value: 'Nguyễn Văn B' },
    })
    fireEvent.change(screen.getByLabelText(/Số điện thoại/i), {
      target: { value: '0901234567' },
    })

    const submitButton = screen.getByRole('button', { name: 'Tạo booking' })
    await waitFor(() => expect(submitButton).toBeEnabled())
    fireEvent.click(submitButton)

    await waitFor(() => expect(mutateMock).toHaveBeenCalledTimes(1))
    expect(mutateMock.mock.calls[0]?.[0]).toMatchObject({
      roomId: '1',
      checkInDate: '2026-08-10',
      checkOutDate: '2026-08-12',
    })
  })

  it('does not render a customerId field in the counter flow', () => {
    mockAvailability()
    renderPage()

    expect(screen.queryByLabelText(/Mã khách hàng/i)).not.toBeInTheDocument()
  })

  it('shows the summary with room, nights, total and contact info', async () => {
    mockAvailability()
    renderPage()
    fillStayCriteria()

    await selectFirstRoom()

    fireEvent.change(screen.getByLabelText(/Họ tên khách/i), {
      target: { value: 'Nguyễn Văn B' },
    })
    fireEvent.change(screen.getByLabelText(/Số điện thoại/i), {
      target: { value: '0901234567' },
    })

    const summary = screen.getByRole('region', { name: /Tóm tắt booking/i })
    expect(summary).toHaveTextContent('101 · Phòng biển')
    expect(summary).toHaveTextContent('10/08/2026 – 12/08/2026')
    expect(summary).toHaveTextContent('Số đêm')
    expect(summary).toHaveTextContent('2')
    expect(summary).toHaveTextContent('1.000.000 ₫')
    expect(summary).toHaveTextContent('Nguyễn Văn B')
    expect(summary).toHaveTextContent('0901234567')
  })

  it('shows an empty summary before any room is selected', () => {
    mockAvailability()
    renderPage()

    const summary = screen.getByRole('region', { name: /Tóm tắt booking/i })
    expect(summary).toHaveTextContent('Chưa chọn phòng')
  })
})

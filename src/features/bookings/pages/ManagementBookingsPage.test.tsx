import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import {
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  MemoryRouter,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { ManagementBookingsPage } from './ManagementBookingsPage'

const mocks = vi.hoisted(() => ({
  useManagementBookings: vi.fn(),
}))

vi.mock('../hooks', () => ({
  useManagementBookings: mocks.useManagementBookings,
}))

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{location.search}</output>
}

function BackHarness() {
  const navigate = useNavigate()

  return (
    <>
      <button onClick={() => navigate(-1)} type="button">
        Quay lại lịch sử
      </button>
      <LocationProbe />
      <ManagementBookingsPage />
    </>
  )
}

describe('ManagementBookingsPage filters', () => {
  beforeEach(() => {
    mocks.useManagementBookings.mockReturnValue({
      data: {
        data: [],
        meta: {
          pagination: {
            limit: 10,
            page: 1,
            total: 0,
            totalPages: 0,
          },
        },
      },
      error: null,
      isError: false,
      isPending: false,
      refetch: vi.fn(),
    })
  })

  it('keeps all controls synchronized with browser history', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter
        initialEntries={[
          '/management/bookings?status=CONFIRMED&search=Lan&customerId=12&roomId=8',
          '/management/bookings?status=CHECKED_IN&search=Minh&customerId=30&roomId=9',
        ]}
        initialIndex={1}
      >
        <BackHarness />
      </MemoryRouter>,
    )

    const status = screen.getByRole('combobox', { name: 'Trạng thái' })
    const search = screen.getByRole('textbox', { name: 'Tìm kiếm' })
    const customerId = screen.getByRole('textbox', {
      name: 'Mã khách hàng',
    })
    const roomId = screen.getByRole('textbox', { name: 'Mã phòng' })
    expect(status).toHaveValue('CHECKED_IN')
    expect(search).toHaveValue('Minh')
    expect(customerId).toHaveValue('30')
    expect(roomId).toHaveValue('9')

    await user.click(
      screen.getByRole('button', { name: 'Quay lại lịch sử' }),
    )

    await waitFor(() => {
      expect(status).toHaveValue('CONFIRMED')
      expect(search).toHaveValue('Lan')
      expect(customerId).toHaveValue('12')
      expect(roomId).toHaveValue('8')
    })
  }, 15_000)

  it('clears both the URL and visible controls', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter
        initialEntries={[
          '/management/bookings?status=CONFIRMED&search=Lan&customerId=12&roomId=8',
        ]}
      >
        <LocationProbe />
        <ManagementBookingsPage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Xóa' }))

    await waitFor(() => {
      expect(
        screen.getByRole('combobox', { name: 'Trạng thái' }),
      ).toHaveValue('')
      expect(
        screen.getByRole('textbox', { name: 'Tìm kiếm' }),
      ).toHaveValue('')
      expect(
        screen.getByRole('textbox', { name: 'Mã khách hàng' }),
      ).toHaveValue('')
      expect(
        screen.getByRole('textbox', { name: 'Mã phòng' }),
      ).toHaveValue('')
      expect(screen.getByTestId('location')).toHaveTextContent(/^$/)
    })
  }, 15_000)
})

import { expect, test } from '@playwright/test'

import { fulfillJson, installSession } from './helpers'

const roomType = {
  amenities: [],
  basePrice: '900000.00',
  createdAt: '2026-07-24T00:00:00.000Z',
  description: 'Phòng dành cho gia đình.',
  id: '5',
  maxGuests: 4,
  name: 'Family Suite',
  updatedAt: '2026-07-24T00:00:00.000Z',
}

const room = {
  createdAt: '2026-07-24T00:00:00.000Z',
  description: 'Không gian yên tĩnh.',
  id: '10',
  images: [],
  name: 'Suite Vườn',
  roomNumber: 'A101',
  roomType,
  roomTypeId: roomType.id,
  status: 'READY',
  updatedAt: '2026-07-24T00:00:00.000Z',
}

const booking = {
  bookingCode: 'HBMS-000900',
  cancelledAt: null,
  cancellationReason: null,
  checkInDate: '2099-01-10',
  checkOutDate: '2099-01-12',
  contactEmail: 'customer@example.com',
  contactName: 'Khách kiểm thử',
  contactPhone: '+84900000000',
  createdAt: '2026-07-24T00:00:00.000Z',
  createdByUser: null,
  createdByUserId: null,
  customer: {
    fullName: 'Khách kiểm thử',
    id: '101',
    phone: '+84900000000',
  },
  customerId: '101',
  customerNote: null,
  guestCount: 2,
  id: '900',
  paymentExpiresAt: '2099-01-01T00:15:00.000Z',
  paymentStatus: 'UNPAID',
  room: {
    id: room.id,
    name: room.name,
    roomNumber: room.roomNumber,
    roomType: { id: roomType.id, name: roomType.name },
  },
  roomId: room.id,
  status: 'PENDING_PAYMENT',
  totalAmount: '1800000.00',
  updatedAt: '2026-07-24T00:00:00.000Z',
}

test('customer searches availability and books with profile contact', async ({
  page,
}) => {
  await installSession(page, { actorType: 'customer' })
  let submittedBooking: Record<string, unknown> | undefined
  let submittedCancellation: Record<string, unknown> | undefined

  await page.route('**/api/v1/room-types?**', async (route) => {
    await fulfillJson(route, [roomType], '/api/v1/room-types')
  })
  await page.route('**/api/v1/amenities?**', async (route) => {
    await fulfillJson(route, [], '/api/v1/amenities')
  })
  await page.route('**/api/v1/rooms/search?**', async (route) => {
    const requestUrl = new URL(route.request().url())

    expect(requestUrl.searchParams.get('checkIn')).toBe('2099-01-10')
    expect(requestUrl.searchParams.get('checkOut')).toBe('2099-01-12')
    expect(requestUrl.searchParams.get('guests')).toBe('2')
    await fulfillJson(route, [room], '/api/v1/rooms/search')
  })
  await page.route('**/api/v1/rooms/10', async (route) => {
    await fulfillJson(route, room, '/api/v1/rooms/10')
  })
  await page.route('**/api/v1/bookings', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback()
      return
    }

    submittedBooking = route.request().postDataJSON()
    await fulfillJson(route, booking, '/api/v1/bookings', 201)
  })
  await page.route('**/api/v1/bookings/900', async (route) => {
    await fulfillJson(route, booking, '/api/v1/bookings/900')
  })
  await page.route('**/api/v1/bookings/900/cancel', async (route) => {
    submittedCancellation = route.request().postDataJSON()
    booking.status = 'CANCELLED'
    booking.paymentExpiresAt = null
    booking.cancelledAt = '2026-07-24T01:00:00.000Z'
    booking.cancellationReason = String(submittedCancellation?.reason ?? '')
    await fulfillJson(route, booking, '/api/v1/bookings/900/cancel')
  })
  await page.route('**/api/v1/bookings/900/payments?**', async (route) => {
    await fulfillJson(route, [], '/api/v1/bookings/900/payments')
  })

  await page.goto('/rooms/search')
  await page.getByLabel('Nhận phòng').fill('2099-01-10')
  await page.getByLabel('Trả phòng').fill('2099-01-12')
  await page.getByText('1 khách', { exact: true }).click()
  await page.getByRole('button', { name: 'Tăng số khách' }).click()
  await page.getByRole('button', { name: 'Xong' }).click()
  await page.getByRole('button', { name: 'Tìm phòng' }).click()

  await expect(page.getByText('Suite Vườn')).toBeVisible()
  await page.getByRole('button', { name: 'Xem chi tiết' }).click()
  await expect(page.getByRole('heading', { name: 'Suite Vườn' })).toBeVisible()
  await page.getByRole('button', { name: 'Chọn phòng này' }).click()
  await page.getByRole('button', { name: 'Tạo đặt phòng' }).click()

  await expect(page.getByText('HBMS-000900').first()).toBeVisible()
  await expect(
    page.getByText(
      'Đã tạo đặt phòng. Hãy thanh toán trước thời hạn để giữ phòng.',
    ),
  ).toBeVisible()
  expect(submittedBooking).toEqual({
    checkInDate: '2099-01-10',
    checkOutDate: '2099-01-12',
    guestCount: 2,
    roomId: '10',
  })

  await page.getByRole('button', { name: 'Hủy đặt phòng' }).click()
  await page.getByLabel('Lý do hủy').fill('Khách đổi kế hoạch')
  await page.getByRole('button', { name: 'Xác nhận hủy đặt phòng' }).click()
  await expect(page.getByText('Đã hủy đặt phòng.')).toBeVisible()
  expect(submittedCancellation).toEqual({ reason: 'Khách đổi kế hoạch' })
})

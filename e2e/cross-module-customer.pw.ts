import { expect, test } from '@playwright/test'

import { fulfillJson } from './helpers'

const customer = {
  createdAt: '2026-07-29T00:00:00.000Z',
  email: 'journey-customer@example.com',
  fullName: 'Khách hành trình',
  id: '103',
  phone: '0901234567',
  status: 'ACTIVE',
  updatedAt: '2026-07-29T00:00:00.000Z',
}

const roomType = {
  amenities: [],
  basePrice: '900000.00',
  createdAt: '2026-07-29T00:00:00.000Z',
  description: 'Phòng dành cho gia đình.',
  id: '5',
  maxGuests: 4,
  name: 'Family Suite',
  updatedAt: '2026-07-29T00:00:00.000Z',
}

const room = {
  createdAt: '2026-07-29T00:00:00.000Z',
  description: 'Không gian yên tĩnh.',
  id: '10',
  images: [],
  name: 'Suite Vườn',
  roomNumber: 'A101',
  roomType,
  roomTypeId: roomType.id,
  status: 'READY',
  updatedAt: '2026-07-29T00:00:00.000Z',
}

function payment(status: 'PENDING' | 'SUCCESS') {
  return {
    amount: '1800000.00',
    bookingId: '903',
    createdAt: '2026-07-29T00:02:00.000Z',
    createdByUser: null,
    createdByUserId: null,
    currency: 'VND',
    expiresAt: null,
    gatewayName: 'VNPAY',
    gatewayReference: 'P96',
    gatewayResponseCode: status === 'SUCCESS' ? '00' : null,
    gatewayTransactionDate: null,
    gatewayTransactionId: null,
    gatewayTransactionStatus: status === 'SUCCESS' ? '00' : null,
    id: '96',
    method: 'VNPAY',
    paidAt: status === 'SUCCESS' ? '2026-07-29T00:03:00.000Z' : null,
    refundedAt: null,
    refundedByUser: null,
    refundedByUserId: null,
    refundGatewayTransactionId: null,
    refundLastQueriedAt: null,
    refundMessage: null,
    refundPreviousStatus: null,
    refundReason: null,
    refundRequestId: null,
    refundRequestedAt: null,
    refundResponseCode: null,
    refundTransactionStatus: null,
    status,
    updatedAt: '2026-07-29T00:03:00.000Z',
  }
}

test('customer register, login, search, booking and VNPay return use authoritative history', async ({
  page,
}) => {
  let booking = {
    bookingCode: 'HBMS-000903',
    cancelledAt: null,
    cancellationReason: null,
    checkInDate: '2099-04-10',
    checkOutDate: '2099-04-12',
    contactEmail: customer.email,
    contactName: customer.fullName,
    contactPhone: customer.phone,
    createdAt: '2026-07-29T00:01:00.000Z',
    createdByUser: null,
    createdByUserId: null,
    customer: {
      fullName: customer.fullName,
      id: customer.id,
      phone: customer.phone,
    },
    customerId: customer.id,
    customerNote: null,
    guestCount: 2,
    id: '903',
    paymentExpiresAt: '2099-04-01T00:15:00.000Z',
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
    updatedAt: '2026-07-29T00:01:00.000Z',
  }
  let payments: Array<ReturnType<typeof payment>> = []
  let paymentCreates = 0

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname

    if (path.endsWith('/auth/customers/register')) {
      expect(request.postDataJSON()).toEqual({
        email: customer.email,
        fullName: customer.fullName,
        password: 'StrongPassword123!',
        phone: customer.phone,
      })
      await fulfillJson(route, customer, path, 201)
      return
    }

    if (path.endsWith('/auth/customers/login')) {
      await fulfillJson(
        route,
        {
          accessToken: 'customer-cross-module-token',
          actorType: 'customer',
          customer,
          expiresIn: 3600,
          tokenType: 'Bearer',
        },
        path,
      )
      return
    }

    if (path.endsWith('/auth/me')) {
      await fulfillJson(route, { actorType: 'customer', customer }, path)
      return
    }

    if (path.endsWith('/room-types')) {
      await fulfillJson(route, [roomType], path)
      return
    }

    if (path.endsWith('/amenities')) {
      await fulfillJson(route, [], path)
      return
    }

    if (path.endsWith('/rooms/search')) {
      expect(url.searchParams.get('checkIn')).toBe('2099-04-10')
      expect(url.searchParams.get('checkOut')).toBe('2099-04-12')
      expect(url.searchParams.get('guests')).toBe('2')
      await fulfillJson(route, [room], path)
      return
    }

    if (path.endsWith('/rooms') && request.method() === 'GET') {
      await fulfillJson(route, [room], path)
      return
    }

    if (path.endsWith('/rooms/10')) {
      await fulfillJson(route, room, path)
      return
    }

    if (path.endsWith('/bookings') && request.method() === 'GET') {
      await fulfillJson(route, [], path)
      return
    }

    if (path.endsWith('/bookings') && request.method() === 'POST') {
      await fulfillJson(route, booking, path, 201)
      return
    }

    if (path.endsWith('/bookings/903') && request.method() === 'GET') {
      await fulfillJson(route, booking, path)
      return
    }

    if (path.endsWith('/bookings/903/payments')) {
      if (request.method() === 'GET') {
        await fulfillJson(route, payments, path)
        return
      }

      paymentCreates += 1
      expect(request.headers()['idempotency-key']).toMatch(/^vnpay-/)
      payments = [payment('SUCCESS')]
      booking = {
        ...booking,
        paymentExpiresAt: null,
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        updatedAt: '2026-07-29T00:03:00.000Z',
      }
      await fulfillJson(
        route,
        {
          expiresAt: '2099-04-01T00:15:00.000Z',
          payment: payment('PENDING'),
          paymentUrl:
            'http://127.0.0.1:5173/payments/vnpay/return?validSignature=true&paymentId=96&bookingId=903&paymentStatus=PENDING&responseCode=00&transactionStatus=00',
        },
        path,
        201,
      )
      return
    }

    await route.fallback()
  })

  await page.goto('/register')
  await page.getByLabel('Họ và tên').fill(customer.fullName)
  await page.getByLabel('Số điện thoại').fill(customer.phone)
  await page.getByLabel('Email').fill(customer.email)
  await page.locator('input[name="password"]').fill('StrongPassword123!')
  await page.locator('input[name="confirmPassword"]').fill('StrongPassword123!')
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click()
  await expect(page.getByText('Đăng ký thành công')).toBeVisible()
  await page.getByRole('link', { name: 'Đăng nhập ngay' }).click()

  await page.getByLabel('Email hoặc số điện thoại').fill(customer.email)
  await page
    .getByRole('textbox', { name: 'Mật khẩu', exact: true })
    .fill('StrongPassword123!')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  await page.goto('/rooms')
  await page.getByLabel('Nhận phòng').fill('2099-04-10')
  await page.getByLabel('Trả phòng').fill('2099-04-12')
  await page.getByText('1 khách', { exact: true }).click()
  await page.getByRole('button', { name: 'Tăng số khách' }).click()
  await page.getByRole('button', { name: 'Xong' }).click()
  await page.getByRole('button', { name: 'Tìm phòng trống' }).click()
  await page.getByRole('button', { name: 'Xem chi tiết' }).click()
  await page
    .getByRole('button', { name: 'Tiếp tục đặt phòng' })
    .first()
    .click()
  await page.getByRole('button', { name: 'Tạo đặt phòng' }).click()

  await expect(page).toHaveURL(/\/bookings\/903$/)
  await expect(
    page.getByText(
      'Đã tạo đặt phòng. Hãy thanh toán trước thời hạn để giữ phòng.',
    ),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Thanh toán qua VNPay' }).click()

  await expect(page).toHaveURL(/\/payments\/vnpay\/return/)
  await expect(page.getByText('Thanh toán thành công')).toBeVisible()
  await expect(
    page.getByText(/Khoản thanh toán đã được ghi nhận/i),
  ).toBeVisible()
  expect(paymentCreates).toBe(1)
})

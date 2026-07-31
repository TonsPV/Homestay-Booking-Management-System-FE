import { expect, test } from '@playwright/test'

import {
  dashboardSummary,
  fulfillJson,
  principalFor,
} from './helpers'

test('staff login continues through counter booking, manual payment, check-in and check-out', async ({
  page,
}) => {
  const principal = principalFor({ actorType: 'user', role: 'STAFF' })
  let payments: Array<Record<string, unknown>> = []
  let booking = {
    bookingCode: 'HBMS-STAFF-902',
    cancelledAt: null,
    cancellationReason: null,
    checkInDate: '2099-03-10',
    checkOutDate: '2099-03-12',
    contactEmail: null,
    contactName: 'Khách tại quầy',
    contactPhone: '0901234567',
    createdAt: '2026-07-29T00:00:00.000Z',
    createdByUser: { fullName: principal.fullName, id: principal.id },
    createdByUserId: principal.id,
    customer: {
      fullName: 'Khách tại quầy',
      id: '302',
      phone: '0901234567',
    },
    customerId: '302',
    customerNote: null,
    guestCount: 2,
    id: '902',
    paymentExpiresAt: '2099-03-01T00:15:00.000Z',
    paymentStatus: 'UNPAID',
    room: {
      id: '10',
      name: 'Suite Vườn',
      roomNumber: 'A101',
      roomType: { id: '5', name: 'Family Suite' },
    },
    roomId: '10',
    status: 'PENDING_PAYMENT',
    totalAmount: '1800000.00',
    updatedAt: '2026-07-29T00:00:00.000Z',
  }

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname

    if (path.endsWith('/auth/users/login')) {
      await fulfillJson(
        route,
        {
          accessToken: 'staff-cross-module-token',
          actorType: 'user',
          expiresIn: 3600,
          tokenType: 'Bearer',
          user: {
            createdAt: principal.createdAt,
            email: principal.email,
            fullName: principal.fullName,
            id: principal.id,
            phone: principal.phone,
            role: 'STAFF',
            status: principal.status,
            updatedAt: principal.updatedAt,
          },
        },
        path,
      )
      return
    }

    if (path.endsWith('/management/dashboard/summary')) {
      await fulfillJson(
        route,
        dashboardSummary(
          url.searchParams.get('from') ?? '2026-07-01',
          url.searchParams.get('to') ?? '2026-07-29',
        ),
        path,
      )
      return
    }

    if (path.endsWith('/management/bookings') && request.method() === 'POST') {
      await fulfillJson(route, booking, path, 201)
      return
    }

    if (
      path.endsWith('/management/bookings/902') &&
      request.method() === 'GET'
    ) {
      await fulfillJson(route, booking, path)
      return
    }

    if (path.endsWith('/management/bookings/902/payments')) {
      if (request.method() === 'GET') {
        await fulfillJson(route, payments, path)
        return
      }

      const payment = {
        amount: '1800000.00',
        bookingId: '902',
        createdAt: '2026-07-29T00:01:00.000Z',
        createdByUser: {
          fullName: principal.fullName,
          id: principal.id,
        },
        createdByUserId: principal.id,
        currency: 'VND',
        expiresAt: null,
        gatewayName: null,
        gatewayReference: null,
        gatewayResponseCode: null,
        gatewayTransactionDate: null,
        gatewayTransactionId: null,
        gatewayTransactionStatus: null,
        id: '95',
        method: 'CASH',
        paidAt: '2026-07-29T00:01:00.000Z',
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
        status: 'SUCCESS',
        updatedAt: '2026-07-29T00:01:00.000Z',
      }
      payments = [payment]
      booking = {
        ...booking,
        paymentExpiresAt: null,
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        updatedAt: '2026-07-29T00:01:00.000Z',
      }
      await fulfillJson(route, payment, path, 201)
      return
    }

    if (
      path.endsWith('/management/bookings/902/status') &&
      request.method() === 'PATCH'
    ) {
      const body = request.postDataJSON() as {
        status: 'CHECKED_IN' | 'CHECKED_OUT'
      }
      booking = {
        ...booking,
        status: body.status,
        updatedAt: '2026-07-29T00:02:00.000Z',
      }
      await fulfillJson(route, booking, path)
      return
    }

    await route.fallback()
  })

  await page.goto('/management/login')
  await page
    .getByLabel('Email hoặc số điện thoại')
    .fill(principal.email)
  await page.getByLabel('Mật khẩu').fill('StrongPassword123!')
  await page.getByRole('button', { name: 'Đăng nhập' }).click()

  await expect(page).toHaveURL(/\/management$/)
  await page.getByRole('link', { name: 'Tạo booking tại quầy' }).click()
  await page.getByLabel('Mã phòng').fill('10')
  await page.getByLabel('Ngày nhận phòng').fill('2099-03-10')
  await page.getByLabel('Ngày trả phòng').fill('2099-03-12')
  await page.getByLabel('Số khách').fill('2')
  await page.getByLabel('Tên liên hệ').fill('Khách tại quầy')
  await page.getByLabel('Số điện thoại').fill('0901234567')
  await page.getByRole('button', { name: 'Tạo booking' }).click()

  await expect(page).toHaveURL(/\/management\/bookings\/902$/)
  await page
    .getByRole('button', { name: 'Ghi nhận đã thanh toán' })
    .click()
  await expect(page.getByText('Đã ghi nhận thanh toán')).toBeVisible()
  await expect(
    page.locator('span').filter({ hasText: /^Đã xác nhận$/ }).first(),
  ).toBeVisible()

  await page
    .getByRole('combobox', { name: 'Trạng thái tiếp theo' })
    .selectOption('CHECKED_IN')
  await page.getByRole('button', { name: 'Cập nhật trạng thái' }).click()
  await expect(
    page.locator('span').filter({ hasText: /^Đã nhận phòng$/ }).first(),
  ).toBeVisible()

  await page
    .getByRole('combobox', { name: 'Trạng thái tiếp theo' })
    .selectOption('CHECKED_OUT')
  await page.getByRole('button', { name: 'Cập nhật trạng thái' }).click()
  await expect(
    page.locator('span').filter({ hasText: /^Đã trả phòng$/ }).first(),
  ).toBeVisible()
})

import { expect, test } from '@playwright/test'

import { fulfillJson, installSession } from './helpers'

test('staff creates a counter booking and Backend decides lifecycle transitions', async ({
  page,
}) => {
  await installSession(page, { actorType: 'user', role: 'STAFF' })

  let detailReads = 0
  let submittedCreate: Record<string, unknown> | undefined
  let submittedStatus: Record<string, unknown> | undefined
  let booking = {
    bookingCode: 'HBMS-COUNTER-901',
    cancelledAt: null as string | null,
    cancellationReason: null as string | null,
    checkInDate: '2099-02-10',
    checkOutDate: '2099-02-12',
    contactEmail: null,
    contactName: 'Khách tại quầy',
    contactPhone: '0901234567',
    createdAt: '2026-07-24T00:00:00.000Z',
    createdByUser: { fullName: 'Nhân viên kiểm thử', id: '201' },
    createdByUserId: '201',
    customer: {
      fullName: 'Khách tại quầy',
      id: '301',
      phone: '0901234567',
    },
    customerId: '301',
    customerNote: null,
    guestCount: 2,
    id: '901',
    paymentExpiresAt: '2099-02-01T00:15:00.000Z',
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
    updatedAt: '2026-07-24T00:00:00.000Z',
  }

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const method = request.method()
    const url = new URL(request.url())
    const path = url.pathname

    if (path.endsWith('/auth/me')) {
      await route.fallback()
      return
    }

    if (path.endsWith('/management/bookings') && method === 'POST') {
      submittedCreate = request.postDataJSON()
      await fulfillJson(route, booking, path, 201)
      return
    }

    if (path.endsWith('/management/bookings/901') && method === 'GET') {
      detailReads += 1
      await fulfillJson(route, booking, path)
      return
    }

    if (
      path.endsWith('/management/bookings/901/payments') &&
      method === 'GET'
    ) {
      await fulfillJson(route, [], path)
      return
    }

    if (
      path.endsWith('/management/bookings/901/status') &&
      method === 'PATCH'
    ) {
      submittedStatus = request.postDataJSON()

      if (submittedStatus?.status === 'CHECKED_OUT') {
        await route.fulfill({
          body: JSON.stringify({
            error: 'Conflict',
            message:
              'Khong the chuyen booking tu CONFIRMED sang CHECKED_OUT.',
            path,
            requestId: 'req-booking-conflict',
            statusCode: 409,
            success: false,
            timestamp: '2026-07-24T00:00:00.000Z',
          }),
          contentType: 'application/json',
          status: 409,
        })
        return
      }

      if (submittedStatus?.status === 'CONFIRMED') {
        booking = {
          ...booking,
          paymentExpiresAt: null,
          status: 'CONFIRMED',
        }
        await fulfillJson(route, booking, path)
        return
      }

      booking = {
        ...booking,
        cancelledAt: '2026-07-24T01:00:00.000Z',
        cancellationReason: String(
          submittedStatus?.cancellationReason ?? '',
        ),
        status: 'CANCELLED',
      }
      await fulfillJson(route, booking, path)
      return
    }

    await route.fallback()
  })

  await page.goto('/management/bookings/new')
  await page.getByLabel('Mã phòng').fill('10')
  await page.getByLabel('Ngày nhận phòng').fill('2099-02-10')
  await page.getByLabel('Ngày trả phòng').fill('2099-02-12')
  await page.getByLabel('Số khách').fill('2')
  await page.getByLabel('Tên liên hệ').fill('Khách tại quầy')
  await page.getByLabel('Số điện thoại').fill('0901234567')
  await page.getByRole('button', { name: 'Tạo booking' }).click()

  await expect(page).toHaveURL(/\/management\/bookings\/901$/)
  await expect(page.getByText('Chờ thanh toán').first()).toBeVisible()
  await expect(page.getByText('Chưa thanh toán').first()).toBeVisible()
  expect(submittedCreate).toEqual({
    checkInDate: '2099-02-10',
    checkOutDate: '2099-02-12',
    contactName: 'Khách tại quầy',
    contactPhone: '0901234567',
    guestCount: 2,
    roomId: '10',
  })

  await page
    .getByRole('combobox', { name: 'Trạng thái tiếp theo' })
    .selectOption('CHECKED_OUT')
  await page.getByRole('button', { name: 'Cập nhật trạng thái' }).click()
  await expect(
    page.getByText('Dữ liệu đặt phòng vừa thay đổi.'),
  ).toBeVisible()
  await expect.poll(() => detailReads).toBeGreaterThan(1)

  await page
    .getByRole('combobox', { name: 'Trạng thái tiếp theo' })
    .selectOption('CONFIRMED')
  await page.getByRole('button', { name: 'Cập nhật trạng thái' }).click()
  await expect(page.getByText('Đã xác nhận').first()).toBeVisible()

  await page
    .getByRole('combobox', { name: 'Trạng thái tiếp theo' })
    .selectOption('CANCELLED')
  await page.getByLabel('Lý do hủy').fill('Khách đổi kế hoạch')
  await page.getByRole('button', { name: 'Cập nhật trạng thái' }).click()
  await expect(
    page.getByRole('dialog', { name: 'Hủy booking HBMS-COUNTER-901?' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Xác nhận hủy booking' }).click()

  await expect(
    page.getByText('Đã cập nhật trạng thái booking.'),
  ).toBeVisible()
  expect(submittedStatus).toEqual({
    cancellationReason: 'Khách đổi kế hoạch',
    status: 'CANCELLED',
  })
})

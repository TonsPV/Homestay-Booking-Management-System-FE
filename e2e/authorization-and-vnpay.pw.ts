import { expect, test } from '@playwright/test'

import { fulfillJson, installSession } from './helpers'

function payment(status: 'FAILED' | 'SUCCESS') {
  return {
    amount: '300000.00',
    bookingId: '11',
    createdAt: '2026-09-11T10:00:00.000Z',
    currency: 'VND',
    expiresAt: null,
    gatewayReference: 'VNPAY-9',
    id: '9',
    method: 'VNPAY',
    paidAt: status === 'SUCCESS' ? '2026-09-11T10:01:00.000Z' : null,
    refundedAt: null,
    status,
    updatedAt: '2026-09-11T10:01:00.000Z',
  }
}

test('staff cannot open an admin-only account route', async ({ page }) => {
  await installSession(page, { actorType: 'user', role: 'STAFF' })

  await page.goto('/management/users')

  await expect(
    page.getByRole('heading', { name: /không có quyền truy cập/i }),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/forbidden$/)
})

test('customer sees a pending confirmation until payment history is available', async ({
  page,
}) => {
  await page.route('**/api/v1/payments/vnpay/return?**', async (route) => {
    await fulfillJson(
      route,
      {
        paymentId: '700',
        paymentStatus: 'SUCCESS',
        responseCode: '00',
        transactionStatus: '00',
        validSignature: true,
      },
      '/api/v1/payments/vnpay/return',
    )
  })

  await page.goto(
    '/payments/vnpay/return?vnp_ResponseCode=00&vnp_SecureHash=signed',
  )

  await expect(
    page.getByText('Đang xác nhận thanh toán'),
  ).toBeVisible()
  await expect(
    page.getByText(/hiển thị trạng thái cuối cùng ngay khi hệ thống xác nhận/i),
  ).toBeVisible()
  await expect(
    page.getByText(
      /\bSUCCESS\b|\bPENDING\b|backend|URL Return|polling|attempt|idempotency|Mã payment/i,
    ),
  ).toHaveCount(0)
})

test('customer waits for the authoritative result before seeing payment success', async ({
  page,
}) => {
  await installSession(page, { actorType: 'customer' })

  let releasePaymentResponse: (() => void) | undefined
  const paymentResponseReady = new Promise<void>((resolve) => {
    releasePaymentResponse = resolve
  })

  await page.route('**/api/v1/bookings/11/payments**', async (route) => {
    await paymentResponseReady
    await fulfillJson(
      route,
      [payment('SUCCESS')],
      '/api/v1/bookings/11/payments',
    )
  })
  await page.route('**/api/v1/bookings/11', async (route) => {
    await fulfillJson(route, { id: '11' }, '/api/v1/bookings/11')
  })

  await page.goto(
    '/payments/vnpay/return?validSignature=true&paymentId=9&bookingId=11&paymentStatus=PENDING&responseCode=00&transactionStatus=00',
  )

  await expect(
    page.getByText('Đang xác nhận thanh toán'),
  ).toBeVisible()
  releasePaymentResponse?.()
  await expect(
    page.getByText('Thanh toán thành công'),
  ).toBeVisible()
  await expect(
    page.getByText('Chưa thể kiểm tra tự động'),
  ).toHaveCount(0)
})

test('customer sees a failed payment when the authoritative history says failed', async ({
  page,
}) => {
  await installSession(page, { actorType: 'customer' })

  await page.route('**/api/v1/bookings/11/payments**', async (route) => {
    await fulfillJson(
      route,
      [payment('FAILED')],
      '/api/v1/bookings/11/payments',
    )
  })
  await page.route('**/api/v1/bookings/11', async (route) => {
    await fulfillJson(route, { id: '11' }, '/api/v1/bookings/11')
  })

  await page.goto(
    '/payments/vnpay/return?validSignature=true&paymentId=9&bookingId=11&paymentStatus=SUCCESS&responseCode=00&transactionStatus=00',
  )

  await expect(
    page.getByText('Thanh toán không thành công'),
  ).toBeVisible()
  await expect(
    page.getByText(/giao dịch chưa được ghi nhận/i),
  ).toBeVisible()
})

test('a signed-out customer is sent to login before checking a pending VNPay payment', async ({
  page,
}) => {
  await page.goto(
    '/payments/vnpay/return?validSignature=true&paymentId=38&bookingId=38&paymentStatus=PENDING&responseCode=00&transactionStatus=00',
  )

  await expect(
    page.getByRole('heading', { name: 'Kết quả thanh toán' }),
  ).toBeVisible()
  await expect(
    page.getByText('Cần đăng nhập để kiểm tra'),
  ).toBeVisible()

  await page.getByRole('link', { name: 'Đăng nhập để kiểm tra' }).click()

  await expect(page).toHaveURL(/\/login$/)
  await expect
    .poll(() => page.evaluate(() => history.state.usr?.returnTo))
    .toBe('/bookings/38')
  await expect(
    page.getByRole('heading', { name: 'Đăng nhập' }),
  ).toBeVisible()
})

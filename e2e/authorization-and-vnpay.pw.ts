import { expect, test } from '@playwright/test'

import { fulfillJson, installSession } from './helpers'

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
    page.getByText(/khoản thanh toán chưa xuất hiện trong lịch sử/i),
  ).toBeVisible()
  await expect(
    page.getByText(
      /\bSUCCESS\b|\bPENDING\b|backend|URL Return|polling|attempt|idempotency|Mã payment/i,
    ),
  ).toHaveCount(0)
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

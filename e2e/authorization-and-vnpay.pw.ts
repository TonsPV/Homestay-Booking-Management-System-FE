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

test('VNPay Return is temporary without authoritative history', async ({
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
    page.getByText('Thanh toán VNPay thành công'),
  ).toBeVisible()
  await expect(
    page.getByText(/kết quả tạm thời trên URL Return/i),
  ).toBeVisible()
})

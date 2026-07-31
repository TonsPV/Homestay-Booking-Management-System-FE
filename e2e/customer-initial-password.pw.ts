import { expect, test } from '@playwright/test'

import { fulfillJson, installSession } from './helpers'

test('admin sets an initial password for an eligible customer', async ({
  page,
}) => {
  const customer = {
    createdAt: '2026-07-29T00:00:00.000Z',
    email: null,
    fullName: 'Khách tại quầy',
    id: '301',
    phone: '+84901234567',
    status: 'ACTIVE',
    updatedAt: '2026-07-29T00:00:00.000Z',
  }

  await installSession(page, { actorType: 'user', role: 'ADMIN' })
  await page.route('**/api/v1/customers**', async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        data: [customer],
        message: 'OK',
        meta: {
          pagination: {
            limit: 20,
            page: 1,
            total: 1,
            totalPages: 1,
          },
        },
        path: '/api/v1/customers',
        requestId: 'req-customers',
        statusCode: 200,
        success: true,
        timestamp: '2026-07-29T00:00:00.000Z',
      }),
      contentType: 'application/json',
      status: 200,
    })
  })
  await page.route(
    '**/api/v1/management/customers/301/initial-password',
    async (route) => {
      expect(route.request().method()).toBe('PATCH')
      expect(route.request().postDataJSON()).toEqual({
        password: 'InitialPassword123!',
      })
      await fulfillJson(
        route,
        { passwordConfigured: true },
        '/api/v1/management/customers/301/initial-password',
      )
    },
  )

  await page.goto('/management/customers')
  await page
    .getByRole('button', { name: 'Đặt mật khẩu ban đầu' })
    .first()
    .click()
  await page
    .getByLabel(/^Mật khẩu ban đầu/)
    .fill('InitialPassword123!')
  await page
    .getByLabel(/^Xác nhận mật khẩu/)
    .fill('InitialPassword123!')
  await page.getByRole('button', { name: 'Xác nhận mật khẩu' }).click()

  await expect(
    page.getByText('Khách tại quầy có thể dùng thông tin liên hệ để đăng nhập.'),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Đặt mật khẩu ban đầu' }),
  ).toHaveCount(0)
})

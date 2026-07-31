import { expect, test, type Page } from '@playwright/test'

import { envelope, fulfillJson, installSession } from './helpers'

const timestamp = '2026-07-29T00:00:00.000Z'

async function installTargetSession(
  page: Page,
  principal: Record<string, unknown>,
) {
  await page.addInitScript(
    ({ storedPrincipal }) => {
      window.sessionStorage.setItem(
        'hbms.auth.session.v1',
        JSON.stringify({
          session: {
            accessToken: 'affected-account-token',
            expiresAt: Date.now() + 3_600_000,
            persistence: 'session',
            principal: storedPrincipal,
            tokenType: 'Bearer',
          },
          version: 1,
        }),
      )
    },
    { storedPrincipal: principal },
  )
}

async function fulfillUnauthorized(route: Parameters<Parameters<Page['route']>[1]>[0]) {
  await route.fulfill({
    body: JSON.stringify({
      error: 'Unauthorized',
      message: 'Tài khoản đã bị khóa.',
      path: '/api/v1/auth/me',
      requestId: 'req-account-locked',
      statusCode: 401,
      success: false,
      timestamp,
    }),
    contentType: 'application/json',
    status: 401,
  })
}

test('locking a staff account revokes its session on the next request', async ({
  page,
}) => {
  await installSession(page, { actorType: 'user', role: 'ADMIN' })
  const staff = {
    actorType: 'user',
    createdAt: timestamp,
    email: 'locked-staff@example.com',
    fullName: 'Nhân viên cần khóa',
    id: '301',
    phone: '+84901111333',
    role: 'STAFF',
    status: 'ACTIVE',
    updatedAt: timestamp,
  }
  let locked = false

  await page.route('**/api/v1/users**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname

    if (request.method() === 'PATCH' && path.endsWith('/users/301/status')) {
      expect(request.postDataJSON()).toEqual({ status: 'LOCKED' })
      locked = true
      staff.status = 'LOCKED'
      await fulfillJson(route, staff, path)
      return
    }

    await route.fulfill({
      body: JSON.stringify({
        ...envelope([staff], '/api/v1/users'),
        meta: {
          pagination: {
            limit: 20,
            page: 1,
            total: 1,
            totalPages: 1,
          },
        },
      }),
      contentType: 'application/json',
      status: 200,
    })
  })

  const targetPage = await page.context().newPage()
  await installTargetSession(targetPage, { ...staff })
  await targetPage.route('**/api/v1/auth/me', async (route) => {
    if (locked) {
      await fulfillUnauthorized(route)
      return
    }

    await fulfillJson(
      route,
      { actorType: 'user', user: staff },
      '/api/v1/auth/me',
    )
  })
  await targetPage.route(
    '**/api/v1/management/dashboard/summary**',
    async (route) => {
      await fulfillJson(
        route,
        {
          bookings: {
            cancelled: 0,
            checkedIn: 0,
            checkedOut: 0,
            confirmed: 0,
            pendingPayment: 0,
          },
          fromDate: '2026-07-01',
          generatedAt: timestamp,
          occupancy: {
            occupancyRate: 0,
            roomNightsAvailable: 0,
            roomNightsReserved: 0,
          },
          payments: { refundPending: 0, requiresReview: 0 },
          revenue: { manual: 0, total: 0, vnpay: 0 },
          rooms: {
            cleaning: 0,
            maintenance: 0,
            occupied: 0,
            ready: 0,
          },
          toDate: '2026-07-29',
          totalRefunded: 0,
        },
        '/api/v1/management/dashboard/summary',
      )
    },
  )

  await targetPage.goto('/management')
  await expect(
    targetPage.getByRole('heading', { name: 'Tổng quan vận hành' }),
  ).toBeVisible()

  await page.goto('/management/users')
  page.on('dialog', (dialog) => dialog.accept())
  const staffRow = page.getByRole('row').filter({
    hasText: 'Nhân viên cần khóa',
  })
  await staffRow.getByRole('button', { name: 'Khóa' }).click()
  await expect(page.getByText('Đã khóa tài khoản nhân viên.')).toBeVisible()

  await targetPage.reload()
  await expect(targetPage).toHaveURL(/\/management\/login$/)
  await expect(
    targetPage.getByRole('heading', { name: 'Đăng nhập quản lý' }),
  ).toBeVisible()
  expect(locked).toBe(true)
})

test('locking a customer account revokes its session on the next request', async ({
  page,
}) => {
  await installSession(page, { actorType: 'user', role: 'ADMIN' })
  const customer = {
    actorType: 'customer',
    createdAt: timestamp,
    email: 'locked-customer@example.com',
    fullName: 'Khách hàng cần khóa',
    id: '401',
    phone: '+84902222444',
    status: 'ACTIVE',
    updatedAt: timestamp,
  }
  let locked = false

  await page.route('**/api/v1/customers**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname

    if (
      request.method() === 'PATCH' &&
      path.endsWith('/customers/401/status')
    ) {
      expect(request.postDataJSON()).toEqual({ status: 'LOCKED' })
      locked = true
      customer.status = 'LOCKED'
      await fulfillJson(route, customer, path)
      return
    }

    await route.fulfill({
      body: JSON.stringify({
        ...envelope([customer], '/api/v1/customers'),
        meta: {
          pagination: {
            limit: 20,
            page: 1,
            total: 1,
            totalPages: 1,
          },
        },
      }),
      contentType: 'application/json',
      status: 200,
    })
  })

  const targetPage = await page.context().newPage()
  await installTargetSession(targetPage, { ...customer })
  await targetPage.route('**/api/v1/auth/me', async (route) => {
    if (locked) {
      await fulfillUnauthorized(route)
      return
    }

    await fulfillJson(
      route,
      { actorType: 'customer', customer },
      '/api/v1/auth/me',
    )
  })
  await targetPage.route('**/api/v1/bookings**', async (route) => {
    await fulfillJson(route, [], '/api/v1/bookings')
  })

  await targetPage.goto('/bookings')
  await expect(
    targetPage.getByRole('heading', { name: 'Đặt phòng của tôi' }),
  ).toBeVisible()

  await page.goto('/management/customers')
  page.on('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Khóa tài khoản' }).click()
  await expect(
    page.getByRole('button', { name: 'Mở khóa' }),
  ).toBeVisible()

  await targetPage.reload()
  await expect(targetPage).toHaveURL(/\/login$/)
  await expect(
    targetPage.getByRole('heading', { name: 'Chào mừng bạn trở lại' }),
  ).toBeVisible()
  expect(locked).toBe(true)
})

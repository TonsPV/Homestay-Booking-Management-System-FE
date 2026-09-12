import { expect, test } from '@playwright/test'

import { envelope, installSession } from './helpers'

interface ManagedUser {
  createdAt: string
  email: string
  fullName: string
  id: string
  phone: string | null
  role: 'ADMIN' | 'STAFF'
  status: 'ACTIVE' | 'LOCKED'
  updatedAt: string
}

function adminFixture(): ManagedUser {
  return {
    createdAt: '2026-07-29T00:00:00.000Z',
    email: 'staff@example.com',
    fullName: 'Nhân viên kiểm thử',
    id: '201',
    phone: '+84900000000',
    role: 'ADMIN',
    status: 'ACTIVE',
    updatedAt: '2026-07-29T00:00:00.000Z',
  }
}

test('admin creates, edits and locks a STAFF account without role mutation', async ({
  page,
}) => {
  const users = [adminFixture()]

  await installSession(page, { actorType: 'user', role: 'ADMIN' })
  await page.route('**/api/v1/users**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname

    if (request.method() === 'GET' && path.endsWith('/users')) {
      await route.fulfill({
        body: JSON.stringify({
          ...envelope(users, '/api/v1/users'),
          meta: {
            pagination: {
              limit: 20,
              page: 1,
              total: users.length,
              totalPages: 1,
            },
          },
        }),
        contentType: 'application/json',
        status: 200,
      })
      return
    }

    if (request.method() === 'POST' && path.endsWith('/users')) {
      const body = request.postDataJSON() as Record<string, unknown>
      expect(body).not.toHaveProperty('role')

      const created: ManagedUser = {
        createdAt: '2026-07-29T01:00:00.000Z',
        email: String(body.email),
        fullName: String(body.fullName),
        id: '301',
        phone: typeof body.phone === 'string' ? body.phone : null,
        role: 'STAFF',
        status: 'ACTIVE',
        updatedAt: '2026-07-29T01:00:00.000Z',
      }
      users.push(created)
      await route.fulfill({
        body: JSON.stringify(envelope(created, '/api/v1/users', 201)),
        contentType: 'application/json',
        status: 201,
      })
      return
    }

    const user = users.find((item) => path.includes(`/users/${item.id}`))
    expect(user).toBeTruthy()

    if (request.method() === 'PATCH' && path.endsWith('/status')) {
      const body = request.postDataJSON() as { status: 'ACTIVE' | 'LOCKED' }
      user!.status = body.status
      user!.updatedAt = '2026-07-29T03:00:00.000Z'
    } else {
      const body = request.postDataJSON() as Record<string, unknown>
      expect(body).not.toHaveProperty('role')
      Object.assign(user!, body, {
        updatedAt: '2026-07-29T02:00:00.000Z',
      })
    }

    await route.fulfill({
      body: JSON.stringify(envelope(user, path)),
      contentType: 'application/json',
      status: 200,
    })
  })

  await page.goto('/management/users')
  const adminRow = page.getByRole('row').filter({
    hasText: 'Nhân viên kiểm thử',
  })
  await expect(adminRow.getByRole('button', { name: 'Khóa' })).toBeDisabled()

  await page.getByRole('button', { name: 'Tạo nhân viên' }).click()
  await page.getByLabel('Họ và tên').fill('Nhân viên lễ tân')
  await page
    .getByLabel('Email')
    .fill('reception@homestay-green.test')
  await page.getByLabel('Số điện thoại').fill('+84901234567')
  await page.getByLabel(/^Mật khẩu/).fill('StaffPassword123!')
  await page.getByLabel('Xác nhận mật khẩu').fill('StaffPassword123!')
  await page
    .getByRole('button', { name: 'Tạo nhân viên', exact: true })
    .last()
    .click()

  await expect(
    page.getByText('Đã tạo tài khoản nhân viên.'),
  ).toBeVisible()
  let staffRow = page.getByRole('row').filter({
    hasText: 'Nhân viên lễ tân',
  })
  await expect(staffRow).toContainText('Nhân viên')

  await staffRow.getByRole('button', { name: 'Chỉnh sửa' }).click()
  await expect(page.getByText(/Vai trò hiện tại: Nhân viên/)).toBeVisible()
  await page.getByLabel('Họ và tên').fill('Nhân viên lễ tân mới')
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()

  await expect(
    page.getByText('Đã cập nhật tài khoản nhân viên.'),
  ).toBeVisible()
  staffRow = page.getByRole('row').filter({
    hasText: 'Nhân viên lễ tân mới',
  })
  await expect(staffRow).toBeVisible()

  await staffRow.getByRole('button', { name: 'Khóa' }).click()
  await page
    .getByRole('dialog', { name: 'Khóa tài khoản nhân viên?' })
    .getByRole('button', { name: 'Khóa tài khoản' })
    .click()
  await expect(staffRow).toContainText('Đã khóa')
})

test('explains how to resolve a duplicate staff email', async ({
  page,
}) => {
  await installSession(page, { actorType: 'user', role: 'ADMIN' })
  await page.route('**/api/v1/users**', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        body: JSON.stringify({
          code: 'USER_EMAIL_CONFLICT',
          message: 'Email đã được sử dụng bởi tài khoản khác.',
          path: '/api/v1/users',
          requestId: 'req-user-conflict',
          statusCode: 409,
          success: false,
          timestamp: '2026-07-29T00:00:00.000Z',
        }),
        contentType: 'application/json',
        status: 409,
      })
      return
    }

    await route.fulfill({
      body: JSON.stringify({
        ...envelope([], '/api/v1/users'),
        meta: {
          pagination: {
            limit: 20,
            page: 1,
            total: 0,
            totalPages: 0,
          },
        },
      }),
      contentType: 'application/json',
      status: 200,
    })
  })

  await page.goto('/management/users')
  await page.getByRole('button', { name: 'Tạo nhân viên' }).click()
  await page.getByLabel('Họ và tên').fill('Nhân viên trùng email')
  await page.getByLabel('Email').fill('staff@example.com')
  await page.getByLabel(/^Mật khẩu/).fill('StaffPassword123!')
  await page.getByLabel('Xác nhận mật khẩu').fill('StaffPassword123!')
  await page
    .getByRole('button', { name: 'Tạo nhân viên', exact: true })
    .last()
    .click()

  await expect(
    page.getByText(
      'Thông tin tài khoản đã tồn tại. Vui lòng kiểm tra lại email và số điện thoại.',
    ),
  ).toBeVisible()
  await expect(page.getByText(/req-user-conflict/)).toHaveCount(0)
})

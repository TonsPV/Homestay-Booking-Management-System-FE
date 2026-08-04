import { expect, test } from '@playwright/test'

import { fulfillJson, installSession } from './helpers'

test('admin completes the amenity soft-delete lifecycle', async ({ page }) => {
  await installSession(page, { actorType: 'user', role: 'ADMIN' })
  const amenities = [
    {
      createdAt: '2026-07-27T00:00:00.000Z',
      deletedAt: null,
      description: 'Kết nối không dây',
      id: '1',
      name: 'Wi-Fi',
      updatedAt: '2026-07-27T00:00:00.000Z',
    },
  ]
  let submittedBody: Record<string, unknown> | undefined

  await page.route('**/api/v1/admin/amenities**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname

    if (request.method() === 'POST') {
      submittedBody = request.postDataJSON()
      const created = {
        ...submittedBody,
        createdAt: '2026-07-27T01:00:00.000Z',
        deletedAt: null,
        id: '2',
        updatedAt: '2026-07-27T01:00:00.000Z',
      }
      amenities.push(created as (typeof amenities)[number])
      await fulfillJson(route, created, '/api/v1/admin/amenities', 201)
      return
    }

    const amenity = amenities.find((item) =>
      path.includes(`/amenities/${item.id}`),
    )

    if (request.method() === 'PATCH' && path.endsWith('/restore')) {
      amenity!.deletedAt = null
      amenity!.updatedAt = '2026-07-27T04:00:00.000Z'
      await fulfillJson(route, amenity, path)
      return
    }

    if (request.method() === 'PATCH') {
      Object.assign(amenity!, request.postDataJSON(), {
        updatedAt: '2026-07-27T02:00:00.000Z',
      })
      await fulfillJson(route, amenity, path)
      return
    }

    if (request.method() === 'DELETE') {
      amenity!.deletedAt = '2026-07-27T03:00:00.000Z'
      await fulfillJson(route, amenity, path)
      return
    }

    const visibleAmenities =
      url.searchParams.get('includeDeleted') === 'true'
      ? amenities
      : amenities.filter((item) => item.deletedAt === null)
    await fulfillJson(route, visibleAmenities, '/api/v1/admin/amenities')
  })

  await page.goto('/management/amenities')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Tiện nghi' }),
  ).toBeVisible()
  await expect(page.getByText('Wi-Fi', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Thêm tiện nghi' }).click()
  await page.getByLabel('Tên tiện nghi').fill('Điều hòa')
  await page.getByLabel('Mô tả').fill('Điều hòa hai chiều')
  await page.getByRole('button', { name: 'Tạo tiện nghi' }).click()

  await expect.poll(() => submittedBody).toEqual({
    description: 'Điều hòa hai chiều',
    name: 'Điều hòa',
  })
  await expect(page.getByText('Đã tạo tiện nghi.')).toBeVisible()
  await expect(page.getByText('Điều hòa', { exact: true })).toBeVisible()

  let amenityCard = page.getByRole('article', {
    name: 'Tiện nghi Điều hòa',
  })
  await amenityCard.getByRole('button', { name: 'Chỉnh sửa' }).click()
  await page.getByLabel('Tên tiện nghi').fill('Điều hòa trung tâm')
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect(page.getByText('Đã cập nhật tiện nghi.')).toBeVisible()

  amenityCard = page.getByRole('article', {
    name: 'Tiện nghi Điều hòa trung tâm',
  })
  page.on('dialog', (dialog) => dialog.accept())
  await amenityCard.getByRole('button', { name: 'Xóa' }).click()
  await expect(page.getByText('Đã xóa tiện nghi.')).toBeVisible()
  await expect(amenityCard).toHaveCount(0)

  await page.getByLabel('Hiện mục đã xóa').check()
  amenityCard = page.getByRole('article', {
    name: 'Tiện nghi Điều hòa trung tâm',
  })
  await expect(amenityCard).toContainText('Đã xóa')
  await amenityCard.getByRole('button', { name: 'Khôi phục' }).click()
  await expect(page.getByText('Đã khôi phục tiện nghi.')).toBeVisible()
  await expect(amenityCard).toContainText('Đang hoạt động')
  await expect(page).toHaveTitle('Quản lý tiện nghi | Homestay Green')
})

test('explains how to resolve a conflict when an amenity is still in use', async ({
  page,
}) => {
  await installSession(page, { actorType: 'user', role: 'ADMIN' })
  const amenity = {
    createdAt: '2026-07-27T00:00:00.000Z',
    deletedAt: null,
    description: 'Kết nối không dây',
    id: '1',
    name: 'Wi-Fi',
    updatedAt: '2026-07-27T00:00:00.000Z',
  }

  await page.route('**/api/v1/admin/amenities**', async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({
        body: JSON.stringify({
          errorCode: 'AMENITY_IN_USE',
          message: 'Không thể xóa tiện nghi đang được loại phòng sử dụng.',
          path: '/api/v1/admin/amenities/1',
          requestId: 'req-amenity-in-use',
          statusCode: 409,
          success: false,
          timestamp: '2026-07-29T00:00:00.000Z',
        }),
        contentType: 'application/json',
        status: 409,
      })
      return
    }

    await fulfillJson(route, [amenity], '/api/v1/admin/amenities')
  })

  await page.goto('/management/amenities')
  page.on('dialog', (dialog) => dialog.accept())
  await page
    .getByRole('article', { name: 'Tiện nghi Wi-Fi' })
    .getByRole('button', { name: 'Xóa' })
    .click()

  await expect(
    page.getByText(
      'Không thể xóa tiện nghi vì đang được sử dụng. Hãy gỡ tiện nghi khỏi các loại phòng liên quan rồi thử lại.',
    ),
  ).toBeVisible()
  await expect(page.getByText(/req-amenity-in-use/)).toHaveCount(0)
})

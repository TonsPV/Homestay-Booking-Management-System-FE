import { expect, test, type Page } from '@playwright/test'

import {
  dashboardSummary,
  fulfillJson,
  principalFor,
} from './helpers'

async function openManagementSection(page: Page, name: string) {
  const links = page.getByRole('link', { exact: true, name })
  let visibleLink = null

  for (const link of await links.all()) {
    if (await link.isVisible()) {
      visibleLink = link
      break
    }
  }

  if (!visibleLink) {
    await page
      .getByRole('button', { name: 'Mở menu quản lý' })
      .click()

    for (const link of await links.all()) {
      if (await link.isVisible()) {
        visibleLink = link
        break
      }
    }
  }

  await expect(visibleLink).not.toBeNull()
  await visibleLink!.click()
}

test('admin login continues through amenity, room type, room, image cover and calendar block', async ({
  page,
}) => {
  const principal = principalFor({ actorType: 'user', role: 'ADMIN' })
  const amenities: Array<Record<string, unknown>> = []
  const roomTypes: Array<Record<string, unknown>> = []
  const rooms: Array<Record<string, any>> = []
  let assignedAmenityIds: string[] = []
  let blockedDates: Array<Record<string, unknown>> = []

  await page.route('https://room-assets.invalid/**', (route) => route.abort())
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname
    const method = request.method()

    if (path.endsWith('/auth/users/login')) {
      await fulfillJson(
        route,
        {
          accessToken: 'admin-inventory-token',
          actorType: 'user',
          expiresIn: 3600,
          tokenType: 'Bearer',
          user: {
            createdAt: principal.createdAt,
            email: principal.email,
            fullName: principal.fullName,
            id: principal.id,
            phone: principal.phone,
            role: 'ADMIN',
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

    if (path.endsWith('/admin/amenities')) {
      if (method === 'POST') {
        const amenity = {
          ...request.postDataJSON(),
          createdAt: '2026-07-29T01:00:00.000Z',
          deletedAt: null,
          id: '11',
          updatedAt: '2026-07-29T01:00:00.000Z',
        }
        amenities.push(amenity)
        await fulfillJson(route, amenity, path, 201)
        return
      }

      await fulfillJson(route, amenities, path)
      return
    }

    if (path.endsWith('/admin/room-types/21/amenities') && method === 'PUT') {
      assignedAmenityIds = request.postDataJSON().amenityIds
      const roomType = roomTypes[0]
      roomType.amenities = amenities.filter((amenity) =>
        assignedAmenityIds.includes(String(amenity.id)),
      )
      await fulfillJson(route, roomType, path)
      return
    }

    if (path.endsWith('/amenities')) {
      await fulfillJson(route, amenities, path)
      return
    }

    if (path.endsWith('/admin/room-types')) {
      if (method === 'POST') {
        const roomType = {
          ...request.postDataJSON(),
          amenities: [],
          createdAt: '2026-07-29T01:10:00.000Z',
          deletedAt: null,
          id: '21',
          updatedAt: '2026-07-29T01:10:00.000Z',
        }
        roomTypes.push(roomType)
        await fulfillJson(route, roomType, path, 201)
        return
      }

      await fulfillJson(route, roomTypes, path)
      return
    }

    if (path.endsWith('/room-types')) {
      await fulfillJson(route, roomTypes, path)
      return
    }

    if (path.endsWith('/management/rooms/31/calendar')) {
      await fulfillJson(route, blockedDates, path)
      return
    }

    if (path.endsWith('/management/rooms/31/blocks') && method === 'POST') {
      expect(request.postDataJSON()).toEqual({
        from: '2099-05-10',
        reason: 'Bảo trì định kỳ',
        to: '2099-05-12',
      })
      blockedDates = ['2099-05-10', '2099-05-11'].map(
        (stayDate, index) => ({
          booking: null,
          id: String(801 + index),
          reason: 'Bảo trì định kỳ',
          status: 'BLOCKED',
          stayDate,
        }),
      )
      await fulfillJson(route, blockedDates, path, 201)
      return
    }

    if (path.endsWith('/management/rooms/31') && method === 'GET') {
      await fulfillJson(route, rooms[0], path)
      return
    }

    if (path.endsWith('/management/rooms') && method === 'GET') {
      await fulfillJson(route, rooms, path)
      return
    }

    if (path.endsWith('/rooms') && method === 'POST') {
      expect(request.postDataJSON()).toMatchObject({
        roomNumber: 'G101',
        roomTypeId: '21',
        status: 'READY',
      })
      const room = {
        ...request.postDataJSON(),
        createdAt: '2026-07-29T01:20:00.000Z',
        id: '31',
        images: [
          {
            id: '70',
            imageUrl: 'https://room-assets.invalid/initial.jpg',
            isCover: true,
            sortOrder: 0,
          },
        ],
        roomType: roomTypes[0],
        updatedAt: '2026-07-29T01:20:00.000Z',
      }
      rooms.push(room)
      await fulfillJson(route, room, path, 201)
      return
    }

    if (path.endsWith('/rooms/31/images') && method === 'POST') {
      const image = {
        id: '71',
        imageUrl: 'https://room-assets.invalid/garden.jpg',
        isCover: false,
        sortOrder: 1,
      }
      rooms[0].images.push(image)
      await fulfillJson(route, image, path, 201)
      return
    }

    if (path.endsWith('/room-images/71/set-cover') && method === 'PATCH') {
      rooms[0].images = rooms[0].images.map(
        (image: Record<string, unknown>) => ({
          ...image,
          isCover: image.id === '71',
        }),
      )
      await fulfillJson(route, rooms[0].images[1], path)
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
  await expect(
    page.getByRole('heading', { name: 'Tổng quan vận hành' }),
  ).toBeVisible()

  await openManagementSection(page, 'Tiện nghi')
  await page.getByRole('button', { name: 'Thêm tiện nghi' }).click()
  await page.getByLabel('Tên tiện nghi').fill('Vườn riêng')
  await page.getByLabel('Mô tả').fill('Không gian xanh riêng tư')
  await page.getByRole('button', { name: 'Tạo tiện nghi' }).click()
  await expect(page.getByText('Đã tạo tiện nghi.')).toBeVisible()

  await openManagementSection(page, 'Loại phòng')
  await page.getByRole('button', { name: 'Thêm loại phòng' }).click()
  await page.getByLabel('Tên loại phòng').fill('Garden Suite')
  await page.getByLabel('Số khách tối đa').fill('4')
  await page.getByLabel('Giá cơ bản').fill('1250000')
  await page.getByLabel('Mô tả').fill('Suite hướng vườn.')
  await page.getByRole('button', { name: 'Tạo loại phòng' }).click()
  const roomTypeCard = page.getByRole('article', {
    name: 'Loại phòng Garden Suite',
  })
  await roomTypeCard.getByRole('button', { name: 'Tiện nghi' }).click()
  await page.getByLabel('Vườn riêng').check()
  await page.getByRole('button', { name: 'Lưu tiện nghi' }).click()
  await expect.poll(() => assignedAmenityIds).toEqual(['11'])

  await openManagementSection(page, 'Phòng')
  await page.getByRole('button', { name: 'Thêm phòng' }).click()
  await page.getByLabel('Số phòng').fill('G101')
  await page.getByLabel('Tên phòng').fill('Suite Vườn Xanh')
  await page.locator('select[name="roomTypeId"]').selectOption('21')
  await page.getByLabel('Mô tả').fill('Không gian yên tĩnh nhìn ra vườn.')
  await page.getByRole('button', { name: 'Tạo phòng' }).click()
  await expect(page.getByText('Đã tạo phòng.')).toBeVisible()
  await page.getByRole('button', { name: 'Xem chi tiết' }).click()

  await page.getByRole('button', { name: 'Quản lý ảnh' }).click()
  await page.getByLabel('Tệp ảnh').setInputFiles({
    buffer: Buffer.from('mock-room-image'),
    mimeType: 'image/png',
    name: 'garden-suite.png',
  })
  await page.getByLabel('Thứ tự').fill('1')
  await page.getByRole('button', { name: 'Tải ảnh lên' }).click()
  await expect(page.getByText('Đã tải ảnh lên phòng.')).toBeVisible()
  await page.getByRole('button', { name: 'Đặt làm bìa' }).click()
  await expect(page.getByText('Đã đặt ảnh bìa mới.')).toBeVisible()
  await page.getByRole('button', { name: 'Đóng' }).click()

  await page.getByLabel('Từ ngày').nth(1).fill('2099-05-10')
  await page.getByLabel('Đến ngày').nth(1).fill('2099-05-12')
  await page.getByLabel('Lý do').fill('Bảo trì định kỳ')
  await page.getByRole('button', { name: 'Khóa ngày' }).click()
  await expect(page.getByText('Đã khóa 2 đêm.')).toBeVisible()
  await expect(page.getByText('Bảo trì định kỳ')).toHaveCount(2)
})

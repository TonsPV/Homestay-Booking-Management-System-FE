import { expect, test } from '@playwright/test'

import { fulfillJson, installSession } from './helpers'

const roomType = {
  amenities: [
    { id: '3', name: 'Wi-Fi' },
    { id: '9', name: 'Hồ bơi' },
  ],
  basePrice: '900000.00',
  createdAt: '2026-07-24T00:00:00.000Z',
  description: 'Phòng dành cho gia đình.',
  id: '5',
  maxGuests: 4,
  name: 'Family Suite',
  updatedAt: '2026-07-24T00:00:00.000Z',
}

const baseRoom = {
  createdAt: '2026-07-24T00:00:00.000Z',
  description: 'Không gian yên tĩnh.',
  id: '10',
  images: [
    {
      id: '70',
      imageUrl: 'https://room-assets.invalid/broken-cover.jpg',
      isCover: true,
      sortOrder: 0,
    },
  ],
  name: 'Suite Vườn',
  roomNumber: 'A101',
  roomType,
  roomTypeId: roomType.id,
  status: 'READY',
  updatedAt: '2026-07-24T00:00:00.000Z',
}

const galleryRoom = {
  ...baseRoom,
  images: [
    {
      id: '71',
      imageUrl: '/images/home/hero.webp',
      isCover: true,
      sortOrder: 0,
    },
    {
      id: '72',
      imageUrl: '/images/home/experience.webp',
      isCover: false,
      sortOrder: 1,
    },
    {
      id: '73',
      imageUrl: '/images/home/closing.webp',
      isCover: false,
      sortOrder: 2,
    },
  ],
}

test('public search sends exact filters, handles a broken image and opens detail', async ({
  page,
}) => {
  let capturedAmenityIds: string[] = []

  await page.route('https://room-assets.invalid/**', (route) => route.abort())
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())

    if (url.pathname.endsWith('/room-types')) {
      await fulfillJson(route, [roomType], url.pathname)
      return
    }

    if (url.pathname.endsWith('/amenities')) {
      await fulfillJson(route, roomType.amenities, url.pathname)
      return
    }

    if (url.pathname.endsWith('/rooms') && request.method() === 'GET') {
      await fulfillJson(route, [baseRoom], url.pathname)
      return
    }

    if (url.pathname.endsWith('/rooms/search')) {
      expect(url.searchParams.get('checkIn')).toBe('2099-01-10')
      expect(url.searchParams.get('checkOut')).toBe('2099-01-12')
      expect(url.searchParams.get('guests')).toBe('2')
      capturedAmenityIds = url.searchParams.getAll('amenityIds')
      await fulfillJson(route, [baseRoom], url.pathname)
      return
    }

    if (url.pathname.endsWith('/rooms/10')) {
      await fulfillJson(route, baseRoom, url.pathname)
      return
    }

    await route.fallback()
  })

  await page.goto('/rooms')
  const filterToggle = page.getByRole('button', { name: /Bộ lọc/ })
  if (await page.evaluate(() => window.matchMedia('(max-width: 1023px)').matches)) {
    await filterToggle.click()
    await expect(filterToggle).toHaveAttribute('aria-expanded', 'true')
  }
  await expect(page.getByText('Tiện ích mong muốn')).toBeVisible()
  await page.getByLabel('Wi-Fi').check()
  await page.getByLabel('Nhận phòng').fill('2099-01-10')
  await page.getByLabel('Trả phòng').fill('2099-01-12')
  await page.getByText('1 khách', { exact: true }).click()
  await page.getByRole('button', { name: 'Tăng số khách' }).click()
  await page.getByRole('button', { name: 'Xong' }).click()
  await page.getByRole('button', { name: 'Tìm phòng trống' }).click()
  await page.getByLabel('Hồ bơi').check()
  await page.getByRole('button', { name: 'Áp dụng bộ lọc' }).click()

  await expect.poll(() => capturedAmenityIds).toEqual(['3', '9'])
  await expect(page.getByText('Không thể tải ảnh phòng')).toBeVisible()
  await page.getByRole('button', { name: 'Xem chi tiết' }).click()

  await expect(page).toHaveURL(
    /\/rooms\/10\?checkIn=2099-01-10&checkOut=2099-01-12&guests=2$/,
  )
  await expect(page.getByRole('heading', { name: 'Suite Vườn' })).toBeVisible()
  await expect(page.getByText('Không thể tải ảnh phòng')).toBeVisible()
})

test('public room detail presents a multi-image gallery and booking context', async ({
  page,
}) => {
  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url())

    if (url.pathname.endsWith('/rooms/10')) {
      await fulfillJson(route, galleryRoom, url.pathname)
      return
    }

    await route.fallback()
  })

  await page.goto('/rooms/10?checkIn=2099-01-10&checkOut=2099-01-12&guests=2')

  await expect(page.getByRole('heading', { name: 'Suite Vườn' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Hình ảnh' })).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Mở bộ xem ảnh Suite Vườn' }),
  ).toBeVisible()
  await expect(
    page.getByRole('group', { name: 'Chọn ảnh phòng' }).getByRole('button'),
  ).toHaveCount(3)
  await expect(page.getByText(/Kỳ lưu trú 2 đêm/)).toBeVisible()

  const secondImage = page.getByRole('button', {
    name: 'Chọn ảnh 2 của Suite Vườn',
  })
  await secondImage.click()
  await expect(secondImage).toHaveAttribute('aria-pressed', 'true')

  await page
    .getByRole('button', { name: 'Mở bộ xem ảnh Suite Vườn' })
    .click()
  await expect(page.getByRole('dialog')).toContainText('2 / 3')
  await page.getByRole('button', { name: 'Đóng' }).click()
})

test('admin handles room status, calendar conflict and image operations', async ({
  page,
}) => {
  await installSession(page, { actorType: 'user', role: 'ADMIN' })

  let room = structuredClone(baseRoom)
  let calendarReads = 0
  let blockAttempts = 0
  let calendarEntries = [
    {
      booking: { bookingCode: 'HBMS-RESERVED', id: '501' },
      id: '801',
      reason: null,
      status: 'RESERVED',
      stayDate: '2099-01-10',
    },
  ]

  await page.route('https://room-assets.invalid/**', (route) => route.abort())
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const method = request.method()
    const url = new URL(request.url())
    const path = url.pathname

    if (path.endsWith('/auth/me')) {
      await route.fallback()
      return
    }

    if (path.endsWith('/room-types') && method === 'GET') {
      await fulfillJson(route, [roomType], path)
      return
    }

    if (path.endsWith('/management/rooms/10/calendar')) {
      calendarReads += 1
      await fulfillJson(route, calendarEntries, path)
      return
    }

    if (path.endsWith('/management/rooms/10/blocks') && method === 'POST') {
      blockAttempts += 1

      if (blockAttempts === 1) {
        await route.fulfill({
          body: JSON.stringify({
            error: 'Conflict',
            message: 'Phòng đã được đặt hoặc bị khóa trong khoảng ngày này.',
            path,
            requestId: 'req-room-conflict',
            statusCode: 409,
            success: false,
            timestamp: '2026-07-24T00:00:00.000Z',
          }),
          contentType: 'application/json',
          status: 409,
        })
        return
      }

      const blockedEntries = ['2099-01-11', '2099-01-12'].map(
        (stayDate, index) => ({
          booking: null,
          id: String(900 + index),
          reason: 'Bảo trì điều hòa',
          status: 'BLOCKED',
          stayDate,
        }),
      )
      calendarEntries = [calendarEntries[0], ...blockedEntries]
      await fulfillJson(route, blockedEntries, path, 201)
      return
    }

    if (path.endsWith('/management/rooms/10/blocks') && method === 'DELETE') {
      calendarEntries = calendarEntries.filter(
        (entry) => entry.status !== 'BLOCKED',
      )
      await fulfillJson(route, { removedCount: 2 }, path)
      return
    }

    if (path.endsWith('/management/rooms/10') && method === 'GET') {
      await fulfillJson(route, room, path)
      return
    }

    if (path.endsWith('/rooms/10/status') && method === 'PATCH') {
      room = { ...room, status: request.postDataJSON().status }
      await fulfillJson(route, room, path)
      return
    }

    if (path.endsWith('/rooms/10/images') && method === 'POST') {
      const image = {
        id: '71',
        imageUrl: 'https://room-assets.invalid/new-room.jpg',
        isCover: false,
        sortOrder: 1,
      }
      room = { ...room, images: [...room.images, image] }
      await fulfillJson(route, image, path, 201)
      return
    }

    if (path.endsWith('/room-images/71/set-cover') && method === 'PATCH') {
      room = {
        ...room,
        images: room.images.map((image) => ({
          ...image,
          isCover: image.id === '71',
        })),
      }
      await fulfillJson(route, room.images[1], path)
      return
    }

    if (path.endsWith('/room-images/71') && method === 'DELETE') {
      const deletedImage = room.images.find((image) => image.id === '71')
      room = {
        ...room,
        images: room.images.filter((image) => image.id !== '71'),
      }
      await fulfillJson(route, deletedImage, path)
      return
    }

    await route.fallback()
  })

  await page.goto('/management/rooms/10')
  await expect(
    page.getByRole('heading', { name: 'A101 · Suite Vườn' }),
  ).toBeVisible()

  await page
    .getByRole('combobox', { name: 'Trạng thái phòng A101' })
    .selectOption('MAINTENANCE')
  await page.getByRole('button', { name: 'Lưu trạng thái' }).click()
  await expect(page.getByText('Bảo trì').first()).toBeVisible()

  await page.getByLabel('Từ ngày').nth(1).fill('2099-01-11')
  await page.getByLabel('Đến ngày').nth(1).fill('2099-01-13')
  await page.getByLabel('Lý do').fill('Bảo trì điều hòa')
  await page.getByRole('button', { name: 'Khóa ngày' }).click()

  await expect(
    page.getByText(
      'Khoảng ngày này đã có đặt phòng hoặc vừa được cập nhật. Vui lòng kiểm tra lịch và chọn lại.',
    ),
  ).toBeVisible()
  await expect.poll(() => calendarReads).toBeGreaterThan(1)

  await page.getByRole('button', { name: 'Khóa ngày' }).click()
  await expect(page.getByText('Đã khóa 2 đêm.')).toBeVisible()
  await expect(
    page.locator('a:visible').filter({ hasText: 'HBMS-RESERVED' }),
  ).toBeVisible()
  await expect(page.getByText('Đã khóa').first()).toBeVisible()

  await page.getByRole('button', { name: 'Mở khóa khoảng đang xem' }).click()
  await expect(page.getByText('Đã mở khóa 2 đêm.')).toBeVisible()
  await expect(
    page.locator('a:visible').filter({ hasText: 'HBMS-RESERVED' }),
  ).toBeVisible()
  await expect(page.getByText('Đã khóa')).toHaveCount(0)

  await page.getByRole('button', { name: 'Quản lý ảnh' }).click()
  await page.getByLabel('Tệp ảnh').setInputFiles({
    buffer: Buffer.from('mock-room-image'),
    mimeType: 'image/png',
    name: 'garden-room.png',
  })
  await page.getByRole('button', { name: 'Tải ảnh lên' }).click()
  await expect(page.getByText('Đã tải ảnh lên phòng.')).toBeVisible()

  await page.getByRole('button', { name: 'Đặt làm bìa' }).last().click()
  await expect(page.getByText('Đã đặt ảnh bìa mới.')).toBeVisible()

  await page.getByRole('button', { name: 'Xóa' }).last().click()
  await page
    .getByRole('dialog', { name: 'Xóa ảnh này?' })
    .getByRole('button', { name: 'Xóa ảnh' })
    .click()
  await expect(page.getByText('Đã xóa ảnh khỏi phòng.')).toBeVisible()
})

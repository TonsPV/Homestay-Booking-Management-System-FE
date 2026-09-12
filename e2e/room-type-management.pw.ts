import { expect, test } from '@playwright/test'

import { fulfillJson, installSession } from './helpers'

test('public RoomType routes redirect into the room catalog', async ({
  page,
}) => {
  await page.route('**/api/v1/rooms**', async (route) => {
    await fulfillJson(route, [], '/api/v1/rooms')
  })
  await page.route('**/api/v1/room-types**', async (route) => {
    await fulfillJson(route, [], '/api/v1/room-types')
  })

  await page.goto('/room-types')
  await expect(page).toHaveURL(/\/rooms$/)

  await page.goto('/room-types/7')
  await expect(page).toHaveURL(/\/rooms\?roomTypeId=7$/)
})

test('admin completes RoomType CRUD, exact amenity assignment and restore', async ({
  page,
}) => {
  await installSession(page, { actorType: 'user', role: 'ADMIN' })
  const amenities = [
    {
      createdAt: '2026-07-29T00:00:00.000Z',
      description: 'Kết nối không dây',
      id: '11',
      name: 'Wi-Fi',
      updatedAt: '2026-07-29T00:00:00.000Z',
    },
  ]
  const roomTypes: Array<{
    amenities: typeof amenities
    basePrice: string
    createdAt: string
    deletedAt: string | null
    description: string | null
    id: string
    maxGuests: number
    name: string
    updatedAt: string
  }> = []
  let assignedAmenityIds: string[] | undefined

  await page.route('**/api/v1/amenities**', async (route) => {
    await fulfillJson(route, amenities, '/api/v1/amenities')
  })
  await page.route('**/api/v1/admin/room-types**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname

    if (request.method() === 'POST') {
      const body = request.postDataJSON()
      expect(body.basePrice).toBe('950000.50')
      const roomType = {
        ...body,
        amenities: [],
        createdAt: '2026-07-29T01:00:00.000Z',
        deletedAt: null,
        id: '21',
        updatedAt: '2026-07-29T01:00:00.000Z',
      }
      roomTypes.push(roomType)
      await fulfillJson(route, roomType, path, 201)
      return
    }

    const roomType = roomTypes.find((item) =>
      path.includes(`/room-types/${item.id}`),
    )

    if (request.method() === 'PUT' && path.endsWith('/amenities')) {
      assignedAmenityIds = request.postDataJSON().amenityIds
      roomType!.amenities = amenities.filter((amenity) =>
        assignedAmenityIds!.includes(amenity.id),
      )
      await fulfillJson(route, roomType, path)
      return
    }

    if (request.method() === 'PATCH' && path.endsWith('/restore')) {
      roomType!.deletedAt = null
      await fulfillJson(route, roomType, path)
      return
    }

    if (request.method() === 'PATCH') {
      Object.assign(roomType!, request.postDataJSON())
      await fulfillJson(route, roomType, path)
      return
    }

    if (request.method() === 'DELETE') {
      roomType!.deletedAt = '2026-07-29T03:00:00.000Z'
      await fulfillJson(route, roomType, path)
      return
    }

    const visibleRoomTypes =
      url.searchParams.get('includeDeleted') === 'true'
        ? roomTypes
        : roomTypes.filter((item) => item.deletedAt === null)
    await fulfillJson(route, visibleRoomTypes, '/api/v1/admin/room-types')
  })

  await page.goto('/management/room-types')
  await page.getByRole('button', { name: 'Thêm loại phòng' }).click()
  await page.getByLabel('Tên loại phòng').fill('Phòng gia đình')
  await page.getByLabel('Số khách tối đa').fill('4')
  await page.getByLabel('Giá cơ bản').fill('950000.50')
  await page.getByLabel('Mô tả').fill('Phòng rộng cho gia đình.')
  await page.getByRole('button', { name: 'Tạo loại phòng' }).click()
  await expect(page.getByText('Đã tạo loại phòng.')).toBeVisible()

  let roomTypeCard = page.getByRole('article', {
    name: 'Loại phòng Phòng gia đình',
  })
  await roomTypeCard.getByRole('button', { name: 'Tiện nghi' }).click()
  await page.getByLabel('Wi-Fi').check()
  await page.getByRole('button', { name: 'Lưu tiện nghi' }).click()
  await expect.poll(() => assignedAmenityIds).toEqual(['11'])
  await expect(
    page.getByText('Đã cập nhật tiện nghi loại phòng.'),
  ).toBeVisible()
  await expect(roomTypeCard).toContainText('Wi-Fi')

  await roomTypeCard.getByRole('button', { name: 'Chỉnh sửa' }).click()
  await page.getByLabel('Tên loại phòng').fill('Phòng gia đình xanh')
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect(page.getByText('Đã cập nhật loại phòng.')).toBeVisible()

  roomTypeCard = page.getByRole('article', {
    name: 'Loại phòng Phòng gia đình xanh',
  })
  await roomTypeCard.getByRole('button', { name: 'Xóa' }).click()
  await page
    .getByRole('dialog', { name: 'Xóa loại phòng này?' })
    .getByRole('button', { name: 'Xóa loại phòng' })
    .click()
  await expect(page.getByText('Đã xóa loại phòng.')).toBeVisible()
  await expect(roomTypeCard).toHaveCount(0)

  await page.getByLabel('Hiện mục đã xóa').check()
  roomTypeCard = page.getByRole('article', {
    name: 'Loại phòng Phòng gia đình xanh',
  })
  await expect(roomTypeCard).toContainText('Đã xóa')
  await roomTypeCard.getByRole('button', { name: 'Khôi phục' }).click()
  await expect(page.getByText('Đã khôi phục loại phòng.')).toBeVisible()
  await expect(roomTypeCard).toContainText('Đang hoạt động')
})

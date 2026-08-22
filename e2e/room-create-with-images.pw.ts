import { expect, test } from '@playwright/test'

import { fulfillJson, installSession } from './helpers'

function roomFixture(id: string) {
  return {
    calendarSummary: {
      asOfDate: '2026-08-05',
      nextEvent: null,
      todayStatus: 'AVAILABLE',
    },
    createdAt: '2026-08-05T01:00:00.000Z',
    description: 'Không gian yên tĩnh.',
    id,
    images: [],
    name: 'Suite Vườn',
    roomNumber: 'G101',
    roomType: {
      amenities: [],
      basePrice: '1250000.00',
      bedType: null,
      beds: [],
      description: null,
      id: '21',
      maxGuests: 4,
      name: 'Garden Suite',
    },
    roomTypeId: '21',
    status: 'READY',
    updatedAt: '2026-08-05T01:00:00.000Z',
  }
}

async function installRoomCreateApi(
  page: Parameters<typeof installSession>[0],
  options: { failFile?: string } = {},
) {
  const uploads: Array<{
    fileName: string
    isCover: boolean
    sortOrder: number
  }> = []
  const room = roomFixture('31')
  let createCount = 0
  let failed = false

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname

    if (path.endsWith('/room-types') && request.method() === 'GET') {
      await fulfillJson(
        route,
        [
          {
            basePrice: '1250000.00',
            description: null,
            id: '21',
            maxGuests: 4,
            name: 'Garden Suite',
          },
        ],
        path,
      )
      return
    }

    if (path.endsWith('/management/rooms') && request.method() === 'GET') {
      await fulfillJson(route, [room], path)
      return
    }

    if (path.endsWith('/rooms') && request.method() === 'POST') {
      expect(request.postDataJSON()).toMatchObject({
        roomNumber: 'G101',
        roomTypeId: '21',
        status: 'READY',
      })
      createCount += 1
      await fulfillJson(route, room, path, 201)
      return
    }

    if (path.endsWith('/rooms/31/images') && request.method() === 'POST') {
      const body = request.postData() ?? ''
      const fileName = body.match(/filename="([^"]+)"/)?.[1] ?? ''
      const isCover =
        body.match(/name="isCover"\r?\n\r?\n(true|false)/)?.[1] === 'true'
      const sortOrder = Number(
        body.match(/name="sortOrder"\r?\n\r?\n(\d+)/)?.[1] ?? '-1',
      )
      uploads.push({ fileName, isCover, sortOrder })

      if (options.failFile === fileName && !failed) {
        failed = true
        await fulfillJson(route, { errorCode: 'COMMON_INTERNAL_ERROR' }, path, 500)
        return
      }

      await fulfillJson(
        route,
        {
          id: String(70 + uploads.length),
          imageUrl: `https://room-assets.invalid/${fileName}`,
          isCover,
          sortOrder,
        },
        path,
        201,
      )
      return
    }

    if (
      path.endsWith('/management/rooms/31/calendar') &&
      request.method() === 'GET'
    ) {
      await fulfillJson(route, [], path)
      return
    }

    if (path.endsWith('/management/rooms/31') && request.method() === 'GET') {
      await fulfillJson(route, room, path)
      return
    }

    await route.fallback()
  })

  return { getCreateCount: () => createCount, room, uploads }
}

test('admin creates a room and uploads selected images in order', async ({
  page,
}) => {
  await installSession(page, { actorType: 'user', role: 'ADMIN' })
  const api = await installRoomCreateApi(page)

  await page.goto('/management/rooms')
  await page.getByRole('button', { name: 'Thêm phòng' }).click()
  await page.getByLabel('Số phòng').fill('G101')
  await page.getByLabel('Tên phòng').fill('Suite Vườn')
  await page.locator('select[name="roomTypeId"]').selectOption('21')
  await page.getByLabel('Chọn ảnh từ máy').setInputFiles([
    { buffer: Buffer.from('first'), mimeType: 'image/png', name: 'first.png' },
    {
      buffer: Buffer.from('cover'),
      mimeType: 'image/png',
      name: 'cover.png',
    },
    { buffer: Buffer.from('third'), mimeType: 'image/webp', name: 'third.webp' },
  ])
  await page.getByRole('button', { name: 'Đặt cover.png làm ảnh bìa' }).click()
  await page.getByRole('button', { name: 'Đưa cover.png lên' }).click()
  await page.getByRole('button', { name: 'Tạo phòng' }).click()

  await expect.poll(api.getCreateCount).toBe(1)
  await expect.poll(() => api.uploads).toEqual([
    { fileName: 'cover.png', isCover: true, sortOrder: 0 },
    { fileName: 'first.png', isCover: false, sortOrder: 1 },
    { fileName: 'third.webp', isCover: false, sortOrder: 2 },
  ])
  await expect(page).toHaveURL(/\/management\/rooms\/31$/)
})

test('admin retries only failed images after a partial room creation', async ({
  page,
}) => {
  await installSession(page, { actorType: 'user', role: 'ADMIN' })
  const api = await installRoomCreateApi(page, { failFile: 'second.png' })

  await page.goto('/management/rooms')
  await page.getByRole('button', { name: 'Thêm phòng' }).click()
  await page.getByLabel('Số phòng').fill('G101')
  await page.getByLabel('Tên phòng').fill('Suite Vườn')
  await page.locator('select[name="roomTypeId"]').selectOption('21')
  await page.getByLabel('Chọn ảnh từ máy').setInputFiles([
    { buffer: Buffer.from('cover'), mimeType: 'image/png', name: 'cover.png' },
    {
      buffer: Buffer.from('second'),
      mimeType: 'image/png',
      name: 'second.png',
    },
    { buffer: Buffer.from('third'), mimeType: 'image/webp', name: 'third.webp' },
  ])
  await page.getByRole('button', { name: 'Tạo phòng' }).click()

  await expect(
    page.getByText(
      'Phòng đã được tạo, nhưng 1 trong 3 ảnh chưa tải lên.',
    ),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Thử tải lại 1 ảnh lỗi' })).toBeVisible()
  expect(api.getCreateCount()).toBe(1)
  expect(api.uploads.map((upload) => upload.fileName)).toEqual([
    'cover.png',
    'second.png',
    'third.webp',
  ])

  await page.getByRole('button', { name: 'Thử tải lại 1 ảnh lỗi' }).click()
  await expect(page).toHaveURL(/\/management\/rooms\/31$/)
  expect(api.getCreateCount()).toBe(1)
  expect(api.uploads.map((upload) => upload.fileName)).toEqual([
    'cover.png',
    'second.png',
    'third.webp',
    'second.png',
  ])
})

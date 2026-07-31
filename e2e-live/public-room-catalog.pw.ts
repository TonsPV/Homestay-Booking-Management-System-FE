import { expect, test } from '@playwright/test'

test('public room catalog reads the Backend test runtime', async ({ page }) => {
  const roomTypesResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/api/v1/room-types') &&
      response.request().method() === 'GET',
  )
  const roomsResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/api/v1/rooms') &&
      response.request().method() === 'GET',
  )

  await page.goto('/rooms')

  const [roomTypes, rooms] = await Promise.all([
    roomTypesResponse,
    roomsResponse,
  ])

  expect(roomTypes.ok()).toBe(true)
  expect(rooms.ok()).toBe(true)
  await expect(
    page.getByRole('heading', { name: 'Danh sách phòng' }),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Có lỗi xảy ra' })).toHaveCount(
    0,
  )
})

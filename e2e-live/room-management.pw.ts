import { expect, test } from '@playwright/test'

const adminIdentifier = process.env.HBMS_LIVE_ADMIN_IDENTIFIER
const password = process.env.HBMS_LIVE_AUTH_PASSWORD
const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
)

test('admin completes a live Room status, calendar, image and public search journey', async ({
  page,
}) => {
  test.skip(
    !adminIdentifier || !password,
    'Live Room management fixtures were not provided.',
  )
  test.setTimeout(120_000)

  const suffix = Date.now()
  const roomTypeName = `Live Room Type ${suffix}`
  const roomNumber = `L${String(suffix).slice(-8)}`
  const roomName = `Live Garden Room ${suffix}`

  await page.goto('/management/login')
  await page
    .getByLabel('Email hoặc số điện thoại')
    .fill(adminIdentifier!)
  await page.getByLabel('Mật khẩu').fill(password!)
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await expect(page).toHaveURL(/\/management$/)

  await page.goto('/management/room-types')
  await page.getByRole('button', { name: 'Thêm loại phòng' }).click()
  await page.getByLabel('Tên loại phòng').fill(roomTypeName)
  await page.getByLabel('Số khách tối đa').fill('2')
  await page.getByLabel('Giá cơ bản').fill('650000')
  await page.getByLabel('Mô tả').fill('Fixture cho live Room journey.')
  await page.getByRole('button', { name: 'Tạo loại phòng' }).click()
  await expect(page.getByText('Đã tạo loại phòng.')).toBeVisible()

  await page.goto('/management/rooms')
  await page.getByRole('button', { name: 'Thêm phòng' }).click()
  await page.getByLabel('Số phòng').fill(roomNumber)
  await page.getByLabel('Tên phòng').fill(roomName)
  const managementRoomTypeSelect = page.getByLabel('Loại phòng').first()
  const roomTypeId = await managementRoomTypeSelect
    .locator('option')
    .filter({ hasText: roomTypeName })
    .getAttribute('value')
  expect(roomTypeId).not.toBeNull()
  await managementRoomTypeSelect.selectOption(roomTypeId!)
  await page.getByLabel('Mô tả').fill('Phòng tạo từ live browser journey.')
  await page.getByRole('button', { name: 'Tạo phòng' }).click()
  await expect(page.getByText('Đã tạo phòng.')).toBeVisible()

  await page.getByLabel('Tìm phòng quản lý').fill(roomNumber)
  await page.getByRole('button', { name: 'Lọc' }).click()
  await expect(
    page.getByRole('heading', { name: `${roomNumber} · ${roomName}` }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Xem chi tiết' }).click()

  await page
    .getByRole('combobox', { name: `Trạng thái phòng ${roomNumber}` })
    .selectOption('MAINTENANCE')
  await page.getByRole('button', { name: 'Lưu trạng thái' }).click()
  await expect(
    page.getByText('Đã cập nhật trạng thái phòng.'),
  ).toBeVisible()
  await expect(page.getByText('Bảo trì').first()).toBeVisible()

  await page.getByLabel('Từ ngày').nth(1).fill('2099-03-10')
  await page.getByLabel('Đến ngày').nth(1).fill('2099-03-12')
  await page.getByLabel('Lý do').fill('Live calendar maintenance')
  await page.getByRole('button', { name: 'Khóa ngày' }).click()
  await expect(page.getByText('Đã khóa 2 đêm.')).toBeVisible()
  await expect(page.getByText('Đã khóa').first()).toBeVisible()

  await page
    .getByRole('button', { name: 'Mở khóa khoảng đang xem' })
    .click()
  await expect(page.getByText('Đã mở khóa 2 đêm.')).toBeVisible()
  await expect(page.getByText('Đã khóa')).toHaveCount(0)

  await page.getByRole('button', { name: 'Quản lý ảnh' }).click()
  await page.getByLabel('Tệp ảnh').setInputFiles({
    buffer: tinyPng,
    mimeType: 'image/png',
    name: 'live-room-cover.png',
  })
  await page.getByLabel('Thứ tự').fill('0')
  await page.getByRole('button', { name: 'Tải ảnh lên' }).click()
  await expect(page.getByText('Đã tải ảnh lên phòng.')).toBeVisible()

  await page.getByLabel('Tệp ảnh').setInputFiles({
    buffer: tinyPng,
    mimeType: 'image/png',
    name: 'live-room-secondary.png',
  })
  await page.getByLabel('Thứ tự').fill('1')
  await page.getByRole('button', { name: 'Tải ảnh lên' }).click()
  await expect(page.getByText('Đã tải ảnh lên phòng.')).toBeVisible()

  await page.getByRole('button', { name: 'Đặt làm bìa' }).click()
  await expect(page.getByText('Đã đặt ảnh bìa mới.')).toBeVisible()

  page.on('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Xóa' }).last().click()
  await expect(page.getByText('Đã xóa ảnh khỏi phòng.')).toBeVisible()

  await page.getByRole('button', { name: 'Đóng' }).click()
  await page
    .getByRole('combobox', { name: `Trạng thái phòng ${roomNumber}` })
    .selectOption('READY')
  await page.getByRole('button', { name: 'Lưu trạng thái' }).click()
  await expect(
    page.getByText('Đã cập nhật trạng thái phòng.'),
  ).toBeVisible()

  await page.goto('/rooms/search')
  await page.getByLabel('Ngày nhận phòng').fill('2099-03-10')
  await page.getByLabel('Ngày trả phòng').fill('2099-03-12')
  await page.getByLabel('Số khách').fill('2')
  await page.getByLabel('Loại phòng').selectOption(roomTypeId!)
  await page.getByRole('button', { name: 'Tìm kiếm' }).click()
  await expect(page.getByText(roomName)).toBeVisible()
  await page.getByRole('button', { name: 'Xem chi tiết' }).click()
  await expect(page.getByRole('heading', { name: roomName })).toBeVisible()

  await page.goto('/management/rooms')
  await page.getByLabel('Tìm phòng quản lý').fill(roomNumber)
  await page.getByRole('button', { name: 'Lọc' }).click()
  await page.getByRole('button', { name: 'Xóa' }).click()
  await expect(page.getByText('Đã xóa phòng.')).toBeVisible()
})

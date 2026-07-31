import { expect, test } from '@playwright/test'

const adminIdentifier = process.env.HBMS_LIVE_ADMIN_IDENTIFIER
const password = process.env.HBMS_LIVE_AUTH_PASSWORD

test('admin completes a live RoomType CRUD and amenity assignment journey', async ({
  page,
}) => {
  test.skip(
    !adminIdentifier || !password,
    'Live RoomType management fixtures were not provided.',
  )

  const suffix = Date.now()
  const amenityName = `Live RT Amenity ${suffix}`
  const roomTypeName = `Live RoomType ${suffix}`
  const updatedName = `${roomTypeName} Updated`

  await page.goto('/management/login')
  await page
    .getByLabel('Email hoặc số điện thoại')
    .fill(adminIdentifier!)
  await page.getByLabel('Mật khẩu').fill(password!)
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await expect(page).toHaveURL(/\/management$/)

  await page.goto('/management/amenities')
  await page.getByRole('button', { name: 'Thêm tiện nghi' }).click()
  await page.getByLabel('Tên tiện nghi').fill(amenityName)
  await page.getByRole('button', { name: 'Tạo tiện nghi' }).click()
  await expect(page.getByText('Đã tạo tiện nghi.')).toBeVisible()

  await page.goto('/management/room-types')
  await page.getByRole('button', { name: 'Thêm loại phòng' }).click()
  await page.getByLabel('Tên loại phòng').fill(roomTypeName)
  await page.getByLabel('Số khách tối đa').fill('3')
  await page.getByLabel('Giá cơ bản').fill('875000.50')
  await page.getByLabel('Mô tả').fill('Loại phòng từ live browser journey.')
  await page.getByRole('button', { name: 'Tạo loại phòng' }).click()
  await expect(page.getByText('Đã tạo loại phòng.')).toBeVisible()

  await page.getByLabel('Tìm loại phòng').fill(roomTypeName)
  await page.getByRole('button', { name: 'Tìm kiếm' }).click()
  let roomTypeCard = page.getByRole('article', {
    name: `Loại phòng ${roomTypeName}`,
  })
  await roomTypeCard.getByRole('button', { name: 'Tiện nghi' }).click()
  await page.getByLabel(amenityName).check()
  await page.getByRole('button', { name: 'Lưu tiện nghi' }).click()
  await expect(
    page.getByText('Đã cập nhật tiện nghi loại phòng.'),
  ).toBeVisible()
  await expect(roomTypeCard).toContainText(amenityName)

  await roomTypeCard.getByRole('button', { name: 'Chỉnh sửa' }).click()
  await page.getByLabel('Tên loại phòng').fill(updatedName)
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect(page.getByText('Đã cập nhật loại phòng.')).toBeVisible()

  roomTypeCard = page.getByRole('article', {
    name: `Loại phòng ${updatedName}`,
  })
  page.on('dialog', (dialog) => dialog.accept())
  await roomTypeCard.getByRole('button', { name: 'Xóa' }).click()
  await expect(page.getByText('Đã xóa loại phòng.')).toBeVisible()
  await expect(roomTypeCard).toHaveCount(0)

  await page.getByLabel('Hiện mục đã xóa').check()
  roomTypeCard = page.getByRole('article', {
    name: `Loại phòng ${updatedName}`,
  })
  await expect(roomTypeCard).toContainText('Đã xóa')
  await roomTypeCard.getByRole('button', { name: 'Khôi phục' }).click()
  await expect(page.getByText('Đã khôi phục loại phòng.')).toBeVisible()
  await expect(roomTypeCard).toContainText('Đang hoạt động')
})

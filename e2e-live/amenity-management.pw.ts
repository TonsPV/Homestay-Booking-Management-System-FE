import { expect, test } from '@playwright/test'

const adminIdentifier = process.env.HBMS_LIVE_ADMIN_IDENTIFIER
const password = process.env.HBMS_LIVE_AUTH_PASSWORD

test('admin completes a live Amenity CRUD and restore journey', async ({
  page,
}) => {
  test.skip(
    !adminIdentifier || !password,
    'Live amenity management fixtures were not provided.',
  )

  const name = `Live E2E Amenity ${Date.now()}`
  const updatedName = `${name} Updated`

  await page.goto('/management/login')
  await page
    .getByLabel('Email hoặc số điện thoại')
    .fill(adminIdentifier!)
  await page.getByLabel('Mật khẩu').fill(password!)
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await expect(page).toHaveURL(/\/management$/)

  await page.goto('/management/amenities')
  await page.getByRole('button', { name: 'Thêm tiện nghi' }).click()
  await page.getByLabel('Tên tiện nghi').fill(name)
  await page
    .getByLabel('Mô tả')
    .fill('Tiện nghi được tạo bởi live browser journey.')
  await page.getByRole('button', { name: 'Tạo tiện nghi' }).click()
  await expect(page.getByText('Đã tạo tiện nghi.')).toBeVisible()

  await page.getByLabel('Tìm tiện nghi').fill(name)
  await page.getByRole('button', { name: 'Tìm kiếm' }).click()
  let amenityCard = page.getByRole('article', {
    name: `Tiện nghi ${name}`,
  })
  await amenityCard.getByRole('button', { name: 'Chỉnh sửa' }).click()
  await page.getByLabel('Tên tiện nghi').fill(updatedName)
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect(page.getByText('Đã cập nhật tiện nghi.')).toBeVisible()

  await page.getByRole('button', { name: 'Thêm tiện nghi' }).click()
  await page.getByLabel('Tên tiện nghi').fill(updatedName)
  await page.getByRole('button', { name: 'Tạo tiện nghi' }).click()
  await expect(
    page.getByText(/Ten tien nghi da ton tai/),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Hủy' }).click()

  amenityCard = page.getByRole('article', {
    name: `Tiện nghi ${updatedName}`,
  })
  page.on('dialog', (dialog) => dialog.accept())
  await amenityCard.getByRole('button', { name: 'Xóa' }).click()
  await expect(page.getByText('Đã xóa tiện nghi.')).toBeVisible()
  await expect(amenityCard).toHaveCount(0)

  await page.getByLabel('Hiện mục đã xóa').check()
  amenityCard = page.getByRole('article', {
    name: `Tiện nghi ${updatedName}`,
  })
  await expect(amenityCard).toContainText('Đã xóa')
  await amenityCard.getByRole('button', { name: 'Khôi phục' }).click()
  await expect(page.getByText('Đã khôi phục tiện nghi.')).toBeVisible()
  await expect(amenityCard).toContainText('Đang hoạt động')
})

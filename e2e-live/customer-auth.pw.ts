import { expect, test } from '@playwright/test'

test('customer registers, logs in, restores the session, and logs out', async ({
  page,
}) => {
  const uniqueSuffix = String(Date.now() % 10_000_000).padStart(7, '0')
  const phone = `090${uniqueSuffix}`
  const password = 'StrongPassword123!'
  const updatedPassword = 'UpdatedPassword456!'

  await page.goto('/register')
  await page.getByLabel('Họ và tên').fill('Khách hàng kiểm thử')
  await page.getByLabel('Số điện thoại').fill(phone)
  await page.getByLabel(/^Mật khẩu/).fill(password)
  await page.getByLabel('Xác nhận mật khẩu').fill(password)
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click()

  await expect(page.getByText('Tài khoản của bạn đã sẵn sàng.')).toBeVisible()
  await page.getByRole('link', { name: 'Đăng nhập ngay' }).click()

  await page.getByLabel('Email hoặc số điện thoại').fill(phone)
  await page.getByLabel('Mật khẩu').fill(password)
  await page.getByRole('button', { name: 'Đăng nhập' }).click()

  await expect(page).toHaveURL(/\/bookings$/)
  await expect(
    page.getByRole('heading', { name: 'Đặt phòng của tôi' }),
  ).toBeVisible()

  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Đặt phòng của tôi' }),
  ).toBeVisible()
  await expect(page.getByText('Khách hàng kiểm thử')).toBeVisible()

  await page.goto('/account')
  await page.getByLabel('Họ và tên').fill('Khách hàng đã cập nhật')
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect(page.getByText('Đã lưu thay đổi hồ sơ.')).toBeVisible()

  await page.getByLabel('Mật khẩu hiện tại').fill(password)
  await page.getByLabel(/^Mật khẩu mới/).fill(updatedPassword)
  await page.getByLabel('Xác nhận mật khẩu mới').fill(updatedPassword)
  await page.getByRole('button', { name: 'Đổi mật khẩu' }).click()
  await expect(page).toHaveURL(/\/login\?notice=password-changed$/)
  await expect(
    page.getByText(
      'Đổi mật khẩu thành công. Vui lòng đăng nhập lại bằng mật khẩu mới.',
    ),
  ).toBeVisible()

  await page.getByLabel('Email hoặc số điện thoại').fill(phone)
  await page.getByLabel('Mật khẩu').fill(updatedPassword)
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await expect(page).toHaveURL(/\/bookings$/)

  await page.getByRole('button', { name: 'Đăng xuất' }).click()

  await expect(page).toHaveURL(/\/login$/)
  await expect(
    page.getByRole('heading', { name: 'Chào mừng bạn trở lại' }),
  ).toBeVisible()
})

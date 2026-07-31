import { expect, test } from '@playwright/test'

const adminIdentifier = process.env.HBMS_LIVE_ADMIN_IDENTIFIER
const counterCustomerPhone =
  process.env.HBMS_LIVE_COUNTER_CUSTOMER_PHONE
const password = process.env.HBMS_LIVE_AUTH_PASSWORD

test('admin sets the live counter customer initial password', async ({
  page,
}) => {
  test.skip(
    !adminIdentifier || !counterCustomerPhone || !password,
    'Live customer management fixtures were not provided.',
  )

  await page.goto('/management/login')
  await page
    .getByLabel('Email hoặc số điện thoại')
    .fill(adminIdentifier!)
  await page.getByLabel('Mật khẩu').fill(password!)
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  await expect(page).toHaveURL(/\/management$/)

  await page.goto('/management/customers')
  await page.getByLabel('Tìm khách hàng').fill(counterCustomerPhone!)
  await page.getByRole('button', { name: 'Tìm kiếm' }).click()
  const customerTable = page.getByRole('table')
  await expect(
    customerTable.getByText('Live E2E Counter Customer'),
  ).toBeVisible()

  await customerTable
    .getByRole('button', { name: 'Đặt mật khẩu ban đầu' })
    .click()
  await page.getByLabel(/^Mật khẩu ban đầu/).fill(password!)
  await page.getByLabel(/^Xác nhận mật khẩu/).fill(password!)
  await page.getByRole('button', { name: 'Xác nhận mật khẩu' }).click()
  await expect(
    page.getByText(
      'Live E2E Counter Customer có thể dùng thông tin liên hệ để đăng nhập.',
    ),
  ).toBeVisible()

  page.on('dialog', (dialog) => dialog.accept())
  await customerTable
    .getByRole('button', { name: 'Khóa tài khoản' })
    .click()
  await expect(customerTable.getByText('Đã khóa')).toBeVisible()
  await customerTable.getByRole('button', { name: 'Mở khóa' }).click()
  await expect(customerTable.getByText('Đang hoạt động')).toBeVisible()

  await page.getByRole('button', { name: 'Đăng xuất' }).click()
  await page.goto('/login')
  await page
    .getByLabel('Email hoặc số điện thoại')
    .fill(counterCustomerPhone!)
  await page.getByLabel('Mật khẩu').fill(password!)
  await page.getByRole('button', { name: 'Đăng nhập' }).click()

  await expect(page).toHaveURL(/\/bookings$/)
  await expect(
    page.getByRole('heading', { name: 'Đặt phòng của tôi' }),
  ).toBeVisible()
})

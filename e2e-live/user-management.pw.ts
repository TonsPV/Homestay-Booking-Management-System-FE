import { expect, test } from '@playwright/test'

const adminIdentifier = process.env.HBMS_LIVE_ADMIN_IDENTIFIER
const password = process.env.HBMS_LIVE_AUTH_PASSWORD

async function login(
  page: import('@playwright/test').Page,
  identifier: string,
  expectSuccess = true,
) {
  await page.goto('/management/login')
  await page.getByLabel('Email hoặc số điện thoại').fill(identifier)
  await page.getByLabel('Mật khẩu').fill(password!)
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
  if (expectSuccess) {
    await expect(page).toHaveURL(/\/management$/)
  }
}

test('admin manages a live STAFF account and STAFF remains unauthorized', async ({
  page,
}) => {
  test.skip(
    !adminIdentifier || !password,
    'Live user management fixtures were not provided.',
  )

  const suffix = Date.now()
  const staffEmail = `live-staff-${suffix}@homestay-green.test`
  const phoneSuffix = String(suffix % 100_000_000).padStart(8, '0')
  const staffPhone = `09${phoneSuffix}`

  await login(page, adminIdentifier!)
  await page.goto('/management/users')

  await page.getByRole('button', { name: 'Tạo nhân viên' }).click()
  await page.getByLabel('Họ và tên').fill('Live E2E Staff')
  await page.getByLabel('Email').fill(staffEmail)
  await page.getByLabel(/^Mật khẩu/).fill(password!)
  await page.getByLabel('Xác nhận mật khẩu').fill(password!)
  await page
    .getByRole('button', { name: 'Tạo nhân viên', exact: true })
    .last()
    .click()
  await expect(
    page.getByText('Đã tạo tài khoản nhân viên.'),
  ).toBeVisible()

  let staffRow = page.getByRole('row').filter({ hasText: staffEmail })
  await staffRow.getByRole('button', { name: 'Chỉnh sửa' }).click()
  await page.getByLabel('Họ và tên').fill('Live E2E Staff Updated')
  await page.getByLabel('Số điện thoại').fill(staffPhone)
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect(
    page.getByText('Đã cập nhật tài khoản nhân viên.'),
  ).toBeVisible()
  staffRow = page.getByRole('row').filter({ hasText: staffEmail })
  await expect(staffRow).toContainText(`+84${staffPhone.slice(1)}`)

  await page.getByRole('button', { name: 'Đăng xuất' }).click()
  await login(page, staffEmail)
  await page.goto('/management/users')
  await expect(page).toHaveURL(/\/forbidden$/)
  await expect(
    page.getByRole('heading', { name: 'Bạn không có quyền truy cập' }),
  ).toBeVisible()

  await page.goto('/management')
  await page.getByRole('button', { name: 'Đăng xuất' }).click()
  await login(page, adminIdentifier!)
  await page.goto('/management/users')
  await page.getByLabel('Tìm nhân viên').fill(staffEmail)
  await page.getByRole('button', { name: 'Tìm kiếm' }).click()

  staffRow = page.getByRole('row').filter({ hasText: staffEmail })
  page.on('dialog', (dialog) => dialog.accept())
  await staffRow.getByRole('button', { name: 'Khóa' }).click()
  await expect(staffRow).toContainText('Đã khóa')

  await page.getByRole('button', { name: 'Đăng xuất' }).click()
  await login(page, staffEmail, false)
  await expect(
    page.getByText(/Tai khoan bi khoa/),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/management\/login$/)
})

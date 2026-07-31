import { expect, test } from '@playwright/test'

const password = process.env.HBMS_LIVE_AUTH_PASSWORD
const accounts = [
  {
    identifier: process.env.HBMS_LIVE_STAFF_IDENTIFIER,
    role: 'STAFF',
  },
  {
    identifier: process.env.HBMS_LIVE_ADMIN_IDENTIFIER,
    role: 'ADMIN',
  },
] as const

for (const account of accounts) {
  test(`${account.role} loads a live dashboard summary and changes its range`, async ({
    page,
  }) => {
    test.skip(
      !account.identifier || !password,
      'Live management credentials were not provided.',
    )

    await page.goto('/management/login')
    await page
      .getByLabel('Email hoặc số điện thoại')
      .fill(account.identifier!)
    await page.getByLabel('Mật khẩu').fill(password!)
    await page.getByRole('button', { name: 'Đăng nhập' }).click()

    await expect(page).toHaveURL(/\/management$/)
    await expect(
      page.getByRole('heading', { name: 'Tổng quan vận hành' }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Chỉ số chính' }),
    ).toBeVisible()

    await page.getByLabel('Từ ngày').fill('2026-07-01')
    await page.getByLabel('Đến ngày').fill('2026-07-29')
    await page.getByRole('button', { name: 'Áp dụng' }).click()

    await expect(page.getByText('01/07/2026 – 29/07/2026')).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Có lỗi xảy ra' }),
    ).toHaveCount(0)
  })
}

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
  test(`${account.role} logs in through the live Backend and logs out`, async ({
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

    await page.reload()
    await expect(
      page.getByRole('heading', { name: 'Tổng quan vận hành' }),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Đăng xuất' }).click()

    await expect(page).toHaveURL(/\/management\/login$/)
    await expect(
      page.getByRole('heading', { name: 'Đăng nhập quản lý' }),
    ).toBeVisible()
  })
}

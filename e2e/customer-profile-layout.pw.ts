import { expect, test, type Locator } from '@playwright/test'

import { fulfillJson, installSession } from './helpers'

const customer = {
  createdAt: '2026-07-29T00:00:00.000Z',
  email: 'layout-customer@example.com',
  fullName: 'Khách kiểm tra bố cục',
  id: '103',
  phone: '+84858501102',
  status: 'ACTIVE',
  updatedAt: '2026-07-29T00:00:00.000Z',
}

async function requiredBox(
  locator: Locator,
  description: string,
) {
  const box = await locator.boundingBox()

  if (!box) {
    throw new Error(`Không tìm thấy vùng ${description}.`)
  }

  return box
}

test('customer profile places account context beside settings on desktop and stacks it on mobile', async ({
  page,
}) => {
  await installSession(page, { actorType: 'customer' })
  await page.route('**/api/v1/customers/me', async (route) => {
    await fulfillJson(
      route,
      customer,
      new URL(route.request().url()).pathname,
    )
  })

  await page.setViewportSize({ height: 1_000, width: 1_440 })
  await page.goto('/account')

  const summary = page.locator('aside[aria-labelledby="account-summary-title"]')
  const contactCard = page
    .getByRole('heading', { name: 'Thông tin liên hệ' })
    .locator('..')
  const passwordCard = page
    .getByRole('heading', { name: 'Đổi mật khẩu' })
    .locator('..')

  await expect(summary).toBeVisible()
  await expect(contactCard).toBeVisible()
  await expect(passwordCard).toBeVisible()

  const desktopSummary = await requiredBox(summary, 'tóm tắt tài khoản')
  const desktopContact = await requiredBox(contactCard, 'thông tin liên hệ')
  const desktopPassword = await requiredBox(passwordCard, 'đổi mật khẩu')

  expect(desktopContact.x).toBeGreaterThan(
    desktopSummary.x + desktopSummary.width,
  )
  expect(desktopPassword.x).toBeGreaterThan(desktopContact.x)
  expect(Math.abs(desktopContact.y - desktopPassword.y)).toBeLessThanOrEqual(1)
  expect(
    Math.abs(desktopContact.height - desktopPassword.height),
  ).toBeLessThanOrEqual(1)

  await page.setViewportSize({ height: 900, width: 375 })

  const mobileSummary = await requiredBox(summary, 'tóm tắt tài khoản trên mobile')
  const mobileContact = await requiredBox(
    contactCard,
    'thông tin liên hệ trên mobile',
  )
  const mobilePassword = await requiredBox(
    passwordCard,
    'đổi mật khẩu trên mobile',
  )
  const saveProfile = await requiredBox(
    page.getByRole('button', { name: 'Lưu thay đổi' }),
    'nút lưu hồ sơ trên mobile',
  )

  expect(mobileSummary.y).toBeLessThan(mobileContact.y)
  expect(mobileContact.y).toBeLessThan(mobilePassword.y)
  expect(Math.abs(mobileContact.x - mobilePassword.x)).toBeLessThanOrEqual(1)
  expect(saveProfile.width).toBeGreaterThan(mobileContact.width - 64)
})

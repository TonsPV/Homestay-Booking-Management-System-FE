import { expect, test, type Page } from "@playwright/test";

import { installSession } from "./helpers";

async function expectNoDocumentOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
}

test("public and auth shells remain usable on desktop and mobile", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "Tìm một nơi để thật sự nghỉ ngơi.",
    }),
  ).toBeVisible();
  await expect(page).toHaveTitle("Trang chủ | Homestay Green");
  await expectNoDocumentOverflow(page);

  const menuButton = page.getByRole("button", { name: "Mở menu" });

  if (await menuButton.isVisible()) {
    await menuButton.click();
    await expect(
      page.getByRole("navigation", {
        name: "Điều hướng chính trên thiết bị di động",
      }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menuButton).toBeFocused();
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");
  }

  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Chào mừng bạn trở lại" }),
  ).toBeVisible();
  await expect(page).toHaveTitle("Đăng nhập khách hàng | Homestay Green");
  await expect(page.locator("main")).toHaveCount(1);
  await expectNoDocumentOverflow(page);
});

test("staff POS navigation is responsive and separate from management", async ({
  page,
}) => {
  await installSession(page, { actorType: "user", role: "STAFF" });
  await page.goto("/staff");

  await expect(page).toHaveURL(/\/staff\/counter$/);

  await expect(page.locator("#main-content")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Nhân viên", exact: true }),
  ).toHaveCount(0);

  await expect(
    page.getByRole("link", { name: "Homestay Green - Quầy lễ tân" }),
  ).toBeVisible();
  await expect(
    page.locator("nav:visible").filter({ hasText: "Đặt phòng" }),
  ).toBeVisible();

  await expectNoDocumentOverflow(page);
});

test("public shell has no horizontal overflow at required viewports", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium");

  await page.goto("/");

  for (const width of [360, 390, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ height: 900, width });
    await expectNoDocumentOverflow(page);
  }
});

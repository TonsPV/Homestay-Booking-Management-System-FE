import { expect, test } from "@playwright/test";

import { fulfillJson } from "./helpers";

test("homepage search remains accessible and navigates correctly", async ({
  page,
}) => {
  await page.route("**/api/v1/rooms**", async (route) => {
    await fulfillJson(
      route,
      [
        {
          createdAt: "2026-07-29T00:00:00.000Z",
          description: "Phòng có ban công và ánh sáng tự nhiên.",
          id: "21",
          images: [],
          name: "Phòng ban công",
          roomNumber: "A1",
          roomType: {
            amenities: [],
            basePrice: "750000",
            description: null,
            id: "11",
            maxGuests: 3,
            name: "Deluxe",
          },
          roomTypeId: "11",
          status: "READY",
          updatedAt: "2026-07-29T00:00:00.000Z",
        },
      ],
      "/api/v1/rooms",
    );
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByLabel("Nhận phòng")).toBeVisible();
  await expect(page.getByLabel("Trả phòng")).toBeVisible();
  await expect(page.getByLabel("Số khách")).toBeVisible();

  await page.getByRole("button", { name: "Tìm phòng" }).click();

  await expect(page.getByText("Vui lòng chọn ngày nhận phòng.")).toBeVisible();
  await expect(page.getByText("Vui lòng chọn ngày trả phòng.")).toBeVisible();
  await expect(page.getByLabel("Nhận phòng")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.getByLabel("Trả phòng")).toHaveAttribute(
    "aria-invalid",
    "true",
  );

  await page.getByLabel("Nhận phòng").fill("2026-08-10");
  await page.getByLabel("Trả phòng").fill("2026-08-12");
  await page.getByLabel("Số khách").fill("3");
  await page.getByRole("button", { name: "Tìm phòng" }).click();

  await expect(page).toHaveURL(
    /\/rooms\/search\?checkIn=2026-08-10&checkOut=2026-08-12&guests=3$/,
  );
});

test("mobile menu closes with Escape and returns focus", async ({
  isMobile,
  page,
}) => {
  test.skip(!isMobile, "Mobile navigation is only rendered below lg");
  await page.route("**/api/v1/rooms**", async (route) => {
    await fulfillJson(route, [], "/api/v1/rooms");
  });
  await page.goto("/");

  const menuButton = page.locator('button[aria-controls="public-mobile-menu"]');
  await expect(menuButton).toHaveAccessibleName("Mở menu");
  await menuButton.click();
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  await expect(menuButton).toHaveAccessibleName("Đóng menu");

  await page.keyboard.press("Escape");
  await expect(menuButton).toHaveAttribute("aria-expanded", "false");
  await expect(menuButton).toHaveAccessibleName("Mở menu");
  await expect(menuButton).toBeFocused();
});

test("homepage remains usable at 320px with reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ height: 720, width: 320 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/v1/rooms**", async (route) => {
    await fulfillJson(route, [], "/api/v1/rooms");
  });
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tìm phòng" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

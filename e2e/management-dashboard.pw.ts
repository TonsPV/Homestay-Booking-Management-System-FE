import { expect, test } from "@playwright/test";

import { envelope, installSession } from "./helpers";

/* Phase 0: the Backend no longer exposes GET /management/dashboard/summary,
 * so the dashboard capability is DORMANT in the frontend:
 * - /management/dashboard is unrouted;
 * - the admin landing is /management/bookings;
 * - navigation exposes no dashboard entry;
 * - no request may be sent to the nonexistent endpoint (it would 404). */
test("dashboard stays dormant: unrouted, unreachable, and never requested", async ({
  page,
}) => {
  await installSession(page, { actorType: "user", role: "ADMIN" });

  let dashboardRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/management/dashboard")) {
      dashboardRequests += 1;
    }
  });

  await page.route("**/api/v1/management/bookings**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    await route.fulfill({
      body: JSON.stringify({
        ...envelope([], path),
        meta: {
          pagination: {
            limit: 20,
            page: 1,
            total: 0,
            totalPages: 0,
          },
        },
      }),
      contentType: "application/json",
      status: 200,
    });
  });

  await page.goto("/management/bookings");

  await expect(page).toHaveURL(/\/management\/bookings$/);
  await expect(
    page.getByRole("heading", { name: "Danh sách đặt phòng" }),
  ).toBeVisible();

  await expect(page.getByRole("link", { name: "Tổng quan" })).toHaveCount(0);
  expect(dashboardRequests).toBe(0);
});

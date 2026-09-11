import { expect, test } from "@playwright/test";

import { envelope, fulfillJson, installSession } from "./helpers";

test("a current-session 401 clears private access and returns to management login", async ({
  page,
}) => {
  await installSession(page, { actorType: "user", role: "STAFF" });
  await page.route("**/api/v1/management/payments**", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        error: "Unauthorized",
        message: "Phiên đăng nhập không còn hợp lệ.",
        path: "/api/v1/management/payments",
        requestId: "req-expired-session",
        statusCode: 401,
        success: false,
        timestamp: "2026-07-29T00:00:00.000Z",
      }),
      contentType: "application/json",
      status: 401,
    });
  });

  await page.goto("/staff/payments");

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Đăng nhập", exact: true }),
  ).toBeVisible();
});

test("login 429 preserves the form and exposes the Retry-After cooldown", async ({
  page,
}) => {
  await page.route("**/api/v1/auth/customers/login", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        error: "Too Many Requests",
        message: "Bạn thao tác quá nhanh.",
        path: "/api/v1/auth/customers/login",
        requestId: "req-login-rate-limit",
        statusCode: 429,
        success: false,
        timestamp: "2026-07-29T00:00:00.000Z",
      }),
      contentType: "application/json",
      headers: {
        "Access-Control-Expose-Headers": "Retry-After",
        "Retry-After": "30",
      },
      status: 429,
    });
  });

  await page.goto("/login");
  await page.getByLabel("Email hoặc số điện thoại").fill("guest@example.com");
  await page
    .getByRole("textbox", { name: "Mật khẩu", exact: true })
    .fill("StrongPassword123!");
  await page.getByRole("button", { name: "Đăng nhập" }).click();

  await expect(page.getByText(/Bạn đã thao tác quá nhiều lần/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Thử lại sau/ }),
  ).toBeDisabled();
  await expect(page.getByLabel("Email hoặc số điện thoại")).toHaveValue(
    "guest@example.com",
  );
});

for (const failure of ["network", "malformed"] as const) {
  test(`room list recovers from a ${failure} response`, async ({ page }) => {
    let roomReads = 0;

    await page.route("**/api/v1/room-types**", async (route) => {
      await fulfillJson(route, [], "/api/v1/room-types");
    });
    await page.route("**/api/v1/rooms?**", async (route) => {
      roomReads += 1;

      if (failure === "network") {
        await route.abort("internetdisconnected");
        return;
      }

      await route.fulfill({
        body: "not-json",
        contentType: "application/json",
        status: 200,
      });
    });

    await page.goto("/rooms");

    await expect(
      page.getByRole("heading", { name: "Không thể tải nội dung" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Thử lại" })).toBeVisible();
    expect(roomReads).toBeGreaterThanOrEqual(1);
  });
}

test("a Backend 403 remains an explicit permission state without clearing session", async ({
  page,
}) => {
  await installSession(page, { actorType: "user", role: "STAFF" });
  await page.route("**/api/v1/management/payments**", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        error: "Forbidden",
        message: "Bạn không có quyền xem dữ liệu thanh toán.",
        path: "/api/v1/management/payments",
        requestId: "req-payment-forbidden",
        statusCode: 403,
        success: false,
        timestamp: "2026-07-29T00:00:00.000Z",
      }),
      contentType: "application/json",
      status: 403,
    });
  });

  await page.goto("/staff/payments");

  await expect(
    page.getByText("Bạn không có quyền thực hiện thao tác này."),
  ).toBeVisible();
  await expect(page.getByText(/req-payment-forbidden/)).toHaveCount(0);
  await expect(page).toHaveURL(/\/staff\/payments$/);
  const logoutButton = page.getByRole("button", { name: "Đăng xuất" }).first();

  await expect(logoutButton).toBeVisible();
});

test("a Backend 409 becomes an actionable operation error without diagnostics", async ({
  page,
}) => {
  await installSession(page, { actorType: "user", role: "ADMIN" });
  await page.route("**/api/v1/admin/amenities**", async (route) => {
    if (route.request().method() === "DELETE") {
      await route.fulfill({
        body: JSON.stringify({
          error: "Conflict",
          errorCode: "AMENITY_IN_USE",
          message: "Tiện nghi vẫn đang được sử dụng.",
          path: "/api/v1/admin/amenities/1",
          requestId: "req-amenity-conflict",
          statusCode: 409,
          success: false,
          timestamp: "2026-07-29T00:00:00.000Z",
        }),
        contentType: "application/json",
        status: 409,
      });
      return;
    }

    await route.fulfill({
      body: JSON.stringify(
        envelope(
          [
            {
              createdAt: "2026-07-29T00:00:00.000Z",
              deletedAt: null,
              description: null,
              id: "1",
              name: "Wi-Fi",
              updatedAt: "2026-07-29T00:00:00.000Z",
            },
          ],
          "/api/v1/admin/amenities",
        ),
      ),
      contentType: "application/json",
      status: 200,
    });
  });

  await page.goto("/management/amenities");
  page.on("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("article", { name: "Tiện nghi Wi-Fi" })
    .getByRole("button", { name: "Xóa" })
    .click();

  await expect(
    page.getByText(
      "Không thể xóa tiện nghi vì đang được sử dụng. Hãy gỡ tiện nghi khỏi các loại phòng liên quan rồi thử lại.",
    ),
  ).toBeVisible();
  await expect(page.getByText(/req-amenity-conflict/)).toHaveCount(0);
});

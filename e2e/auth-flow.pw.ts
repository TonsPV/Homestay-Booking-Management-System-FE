import { expect, test } from "@playwright/test";

import { dashboardSummary, envelope, fulfillJson, principalFor } from "./helpers";

test("anonymous customer route redirects to the customer login", async ({
  page,
}) => {
  await page.goto("/bookings");

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Đăng nhập", exact: true }),
  ).toBeVisible();
});

test("customer login uses the customer actor and opens bookings", async ({
  page,
}) => {
  const principal = principalFor({ actorType: "customer" });

  await page.route("**/api/v1/auth/customers/login", async (route) => {
    expect(route.request().method()).toBe("POST");
    expect(route.request().postDataJSON()).toEqual({
      identifier: principal.email,
      password: "StrongPassword123!",
    });
    await fulfillJson(
      route,
      {
        accessToken: "customer-access-token",
        actorType: "customer",
        customer: {
          createdAt: principal.createdAt,
          email: principal.email,
          fullName: principal.fullName,
          id: principal.id,
          phone: principal.phone,
          status: principal.status,
          updatedAt: principal.updatedAt,
        },
        expiresIn: 3600,
        tokenType: "Bearer",
      },
      "/api/v1/auth/customers/login",
    );
  });
  await page.route("**/api/v1/bookings**", async (route) => {
    await fulfillJson(route, [], "/api/v1/bookings");
  });

  await page.goto("/login");
  await page.getByLabel("Email hoặc số điện thoại").fill(principal.email);
  await page.getByLabel("Mật khẩu").fill("StrongPassword123!");
  await page.getByRole("button", { name: "Đăng nhập" }).click();

  await expect(page).toHaveURL(/\/bookings$/);
  await expect(
    page.getByRole("heading", { name: "Đặt phòng của tôi" }),
  ).toBeVisible();
});

for (const role of ["STAFF", "ADMIN"] as const) {
  test(`${role} login uses the user actor and opens its workspace`, async ({
    page,
  }) => {
    const principal = principalFor({ actorType: "user", role });

    /* The unified login flow tries the customer endpoint first and falls
     * back to the user endpoint on 401; both must be mocked so no request
     * reaches the real backend. */
    await page.route("**/api/v1/auth/customers/login", async (route) => {
      await route.fulfill({
        body: JSON.stringify({
          error: "Unauthorized",
          errorCode: "COMMON_UNAUTHORIZED",
          message: "Thong tin dang nhap khong hop le.",
          path: "/api/v1/auth/customers/login",
          requestId: "req-e2e-401",
          statusCode: 401,
          success: false,
          timestamp: "2026-07-24T00:00:00.000Z",
        }),
        contentType: "application/json",
        status: 401,
      });
    });
    await page.route("**/api/v1/auth/users/login", async (route) => {
      expect(route.request().method()).toBe("POST");
      await fulfillJson(
        route,
        {
          accessToken: `${role.toLowerCase()}-access-token`,
          actorType: "user",
          expiresIn: 3600,
          tokenType: "Bearer",
          user: {
            createdAt: principal.createdAt,
            email: principal.email,
            fullName: principal.fullName,
            id: principal.id,
            phone: principal.phone,
            role,
            status: principal.status,
            updatedAt: principal.updatedAt,
          },
        },
        "/api/v1/auth/users/login",
      );
    });
    await page.route(
      "**/api/v1/management/dashboard/summary**",
      async (route) => {
        const url = new URL(route.request().url());
        await fulfillJson(
          route,
          dashboardSummary(
            url.searchParams.get("from") ?? "2026-07-01",
            url.searchParams.get("to") ?? "2026-07-29",
          ),
          url.pathname,
        );
      },
    );
    /* ADMIN lands on the bookings workflow (dashboard is dormant in
     * Phase 0); the list endpoint must be mocked or the request reaches
     * the real backend and the fake token gets the session revoked. */
    await page.route("**/api/v1/management/bookings**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      await route.fulfill({
        body: JSON.stringify({
          ...envelope([], path),
          meta: {
            pagination: { limit: 20, page: 1, total: 0, totalPages: 0 },
          },
        }),
        contentType: "application/json",
        status: 200,
      });
    });

    await page.goto("/management/login");
    await page.getByLabel("Email hoặc số điện thoại").fill(principal.email);
    await page.getByLabel("Mật khẩu").fill("StrongPassword123!");
    await page.getByRole("button", { name: "Đăng nhập" }).click();

    const expectedPath =
      role === "STAFF" ? "/staff/counter" : "/management/bookings";
    const expectedHeading =
      role === "STAFF" ? "Tạo booking" : "Danh sách đặt phòng";

    await expect(page).toHaveURL(new RegExp(`${expectedPath}$`));
    await expect(
      page.getByRole("heading", { name: expectedHeading }).first(),
    ).toBeVisible();
  });
}

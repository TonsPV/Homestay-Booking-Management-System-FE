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

test("registration password controls remain aligned and can be toggled repeatedly", async ({
  page,
}) => {
  await page.goto("/register");

  const password = page.getByLabel(/^Mật khẩu/);
  const confirmation = page.getByLabel(/^Xác nhận mật khẩu/);
  const revealControls = page.getByRole("button", {
    name: "Hiện mật khẩu",
  });

  await expect(revealControls).toHaveCount(2);
  await expect(password).toHaveAttribute("type", "password");
  await expect(confirmation).toHaveAttribute("type", "password");

  const passwordBox = await password.boundingBox();
  const revealBox = await revealControls.nth(0).boundingBox();
  if (!passwordBox || !revealBox) {
    throw new Error("Không tìm thấy ô mật khẩu hoặc nút hiển thị mật khẩu.");
  }
  expect(revealBox.x).toBeGreaterThan(passwordBox.x);
  expect(revealBox.x + revealBox.width).toBeLessThanOrEqual(
    passwordBox.x + passwordBox.width + 1,
  );
  expect(revealBox.y).toBeGreaterThanOrEqual(passwordBox.y);
  expect(revealBox.y + revealBox.height).toBeLessThanOrEqual(
    passwordBox.y + passwordBox.height + 1,
  );

  await revealControls.nth(0).click();
  await expect(password).toHaveAttribute("type", "text");
  await expect(
    page.getByRole("button", { name: "Ẩn mật khẩu" }),
  ).toHaveCount(1);

  await page.getByRole("button", { name: "Ẩn mật khẩu" }).click();
  await expect(password).toHaveAttribute("type", "password");
  await expect(revealControls).toHaveCount(2);

  await revealControls.nth(1).click();
  await expect(confirmation).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Ẩn mật khẩu" }).click();
  await expect(confirmation).toHaveAttribute("type", "password");
  await expect(revealControls).toHaveCount(2);
});

test("customer login uses the customer actor and opens the public home page", async ({
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
  await page.route("**/api/v1/rooms**", async (route) => {
    await fulfillJson(route, [], "/api/v1/rooms");
  });

  await page.goto("/login");
  await page.getByLabel("Email hoặc số điện thoại").fill(principal.email);
  await page.getByRole("textbox", { name: "Mật khẩu", exact: true }).fill("StrongPassword123!");
  await page.getByRole("button", { name: "Đăng nhập" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

for (const role of ["STAFF", "ADMIN"] as const) {
  test(`${role} login uses the user actor and opens its workspace`, async ({
    page,
  }) => {
    const principal = principalFor({ actorType: "user", role });

    let customerLoginRequests = 0;
    await page.route("**/api/v1/auth/customers/login", async (route) => {
      customerLoginRequests += 1;
      await route.abort();
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
    await page.route("**/api/v1/auth/me", async (route) => {
      await fulfillJson(
        route,
        {
          actorType: "user",
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
        "/api/v1/auth/me",
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
    await page.getByRole("textbox", { name: "Mật khẩu", exact: true }).fill("StrongPassword123!");
    await page.getByRole("button", { name: "Đăng nhập" }).click();

    const expectedPath =
      role === "STAFF" ? "/staff/counter" : "/management/bookings";
    const expectedHeading =
      role === "STAFF" ? "Tạo booking" : "Danh sách đặt phòng";

    await expect(page).toHaveURL(new RegExp(`${expectedPath}$`));
    await expect(
      page.getByRole("heading", { name: expectedHeading }).first(),
    ).toBeVisible();
    expect(customerLoginRequests).toBe(0);

    if (role === "ADMIN") {
      await page.goto("/staff/counter");
      await expect(page).toHaveURL(/\/forbidden$/);
    }
  });
}

import { expect, test } from "@playwright/test";

import { dashboardSummary, fulfillJson, installSession } from "./helpers";

for (const role of ["ADMIN"] as const) {
  test(`${role} reads and filters the management dashboard`, async ({
    page,
  }) => {
    await installSession(page, { actorType: "user", role });

    const requestedRanges: Array<{ from: string | null; to: string | null }> =
      [];

    await page.route(
      "**/api/v1/management/dashboard/summary**",
      async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        const from = url.searchParams.get("from");
        const to = url.searchParams.get("to");

        expect(request.method()).toBe("GET");
        expect(request.headers().authorization).toBe("Bearer e2e-access-token");
        requestedRanges.push({ from, to });
        await fulfillJson(
          route,
          dashboardSummary(from ?? "2026-07-01", to ?? "2026-07-29"),
          url.pathname,
        );
      },
    );

    await page.goto("/management/dashboard");

    await expect(
      page.getByRole("heading", { name: "Tổng quan vận hành" }),
    ).toBeVisible();
    await expect(page.getByText("2.000.000 ₫")).toBeVisible();
    await expect(
      page.getByRole("progressbar", {
        name: "Công suất phòng 62,5%",
      }),
    ).toHaveAttribute("aria-valuenow", "62.5");
    await expect(
      page.getByRole("link", { name: /^Cần đối soát/ }),
    ).toHaveAttribute("href", "/management/payments?status=REQUIRES_REVIEW");

    await page.getByLabel("Từ ngày").fill("2026-06-01");
    await page.getByLabel("Đến ngày").fill("2026-06-30");
    await page.getByRole("button", { name: "Áp dụng" }).click();

    await expect
      .poll(() => requestedRanges.at(-1))
      .toEqual({ from: "2026-06-01", to: "2026-06-30" });
    await expect(page.getByText("01/06/2026 – 30/06/2026")).toBeVisible();
  });
}

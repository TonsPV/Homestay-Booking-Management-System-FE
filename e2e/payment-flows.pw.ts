import { expect, test } from "@playwright/test";

import {
  dashboardSummary,
  envelope,
  fulfillJson,
  installSession,
} from "./helpers";

const booking = {
  bookingCode: "HBMS-PAY-901",
  cancelledAt: null,
  cancellationReason: null,
  checkInDate: "2099-02-10",
  checkOutDate: "2099-02-12",
  contactEmail: "customer@example.com",
  contactName: "Khách kiểm thử",
  contactPhone: "+84900000000",
  createdAt: "2026-07-24T00:00:00.000Z",
  createdByUser: null,
  createdByUserId: null,
  customer: {
    fullName: "Khách kiểm thử",
    id: "101",
    phone: "+84900000000",
  },
  customerId: "101",
  customerNote: null,
  guestCount: 2,
  id: "901",
  paymentExpiresAt: "2099-02-01T00:15:00.000Z",
  paymentStatus: "UNPAID",
  room: {
    id: "10",
    name: "Suite Vườn",
    roomNumber: "A101",
    roomType: { id: "5", name: "Family Suite" },
  },
  roomId: "10",
  status: "PENDING_PAYMENT",
  totalAmount: "1800000.00",
  updatedAt: "2026-07-24T00:00:00.000Z",
};

function payment(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    amount: "1800000.00",
    bookingId: "901",
    createdAt: "2026-07-24T00:00:00.000Z",
    createdByUser: null,
    createdByUserId: null,
    currency: "VND",
    expiresAt: null,
    gatewayName: null,
    gatewayReference: null,
    gatewayResponseCode: null,
    gatewayTransactionDate: null,
    gatewayTransactionId: null,
    gatewayTransactionStatus: null,
    id: "91",
    method: "VNPAY",
    paidAt: null,
    refundedAt: null,
    refundedByUser: null,
    refundedByUserId: null,
    refundGatewayTransactionId: null,
    refundLastQueriedAt: null,
    refundMessage: null,
    refundPreviousStatus: null,
    refundReason: null,
    refundRequestId: null,
    refundRequestedAt: null,
    refundResponseCode: null,
    refundTransactionStatus: null,
    status: "PENDING",
    updatedAt: "2026-07-24T00:00:00.000Z",
    ...overrides,
  };
}

test("customer payment is created once and waits for confirmed history", async ({
  page,
}) => {
  await installSession(page, { actorType: "customer" });
  let createCount = 0;
  let idempotencyKey: string | null = null;
  let authoritativePayment = payment();
  const customerBooking = {
    ...booking,
    paymentExpiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
  };

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;

    if (path.endsWith("/auth/me")) {
      await route.fallback();
      return;
    }

    if (path.endsWith("/bookings/901") && request.method() === "GET") {
      await fulfillJson(route, customerBooking, path);
      return;
    }

    if (path.endsWith("/bookings/901/payments")) {
      if (request.method() === "GET") {
        await fulfillJson(
          route,
          createCount === 0 ? [] : [authoritativePayment],
          path,
        );
        return;
      }

      createCount += 1;
      idempotencyKey = request.headers()["idempotency-key"] ?? null;
      await new Promise((resolve) => setTimeout(resolve, 150));
      authoritativePayment = payment({
        gatewayReference: "P91",
        paidAt: "2026-07-24T00:01:00.000Z",
        status: "SUCCESS",
      });
      await fulfillJson(
        route,
        {
          expiresAt: "2099-02-01T00:15:00.000Z",
          payment: payment(),
          paymentUrl:
            "http://127.0.0.1:5173/payments/vnpay/return?validSignature=true&paymentId=91&bookingId=901&paymentStatus=PENDING&responseCode=00&transactionStatus=00",
        },
        path,
        201,
      );
      return;
    }

    await route.fallback();
  });

  await page.goto("/bookings/901");
  await page.getByRole("button", { name: "Thanh toán qua VNPay" }).dblclick();

  await expect(page).toHaveURL(/\/payments\/vnpay\/return/);
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.localStorage.getItem("hbms:payments:vnpay:current"),
      ),
    )
    .not.toBeNull();
  await expect(page.getByText("Thanh toán thành công")).toBeVisible();
  await expect(
    page.getByText(/Khoản thanh toán đã được ghi nhận/i),
  ).toBeVisible();
  await expect(
    page.getByText(
      /\bSUCCESS\b|\bPENDING\b|backend|URL Return|polling|attempt|idempotency|Mã payment/i,
    ),
  ).toHaveCount(0);
  expect(createCount).toBe(1);
  expect(idempotencyKey).toMatch(/^vnpay-/);
});

test("admin sees stale refunds, reconciles pending VNPay, and refunds manual payment once", async ({
  page,
}) => {
  await installSession(page, { actorType: "user", role: "ADMIN" });
  let reconcileCount = 0;
  let refundCount = 0;
  let refundKey: string | null = null;
  const pendingRefund = payment({
    id: "92",
    refundRequestId: "R92",
    refundRequestedAt: "2026-07-01T00:00:00.000Z",
    status: "REFUND_PENDING",
  });
  const manualPayment = payment({
    id: "93",
    method: "CASH",
    paidAt: "2026-07-24T00:02:00.000Z",
    status: "SUCCESS",
  });
  let payments = [pendingRefund, manualPayment];

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;

    if (path.endsWith("/auth/me")) {
      await route.fallback();
      return;
    }

    if (path.endsWith("/management/payments") && request.method() === "GET") {
      await route.fulfill({
        body: JSON.stringify({
          ...envelope(payments, path),
          meta: {
            pagination: {
              limit: 20,
              page: 1,
              total: payments.length,
              totalPages: 1,
            },
            staleRefundCount: 1,
          },
        }),
        contentType: "application/json",
        status: 200,
      });
      return;
    }

    if (
      path.endsWith("/management/payments/92/reconcile-refund") &&
      request.method() === "POST"
    ) {
      reconcileCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 150));
      const reconciled = {
        ...pendingRefund,
        refundedAt: "2026-07-24T00:03:00.000Z",
        status: "REFUNDED",
      };
      payments = [reconciled, manualPayment];
      await fulfillJson(route, reconciled, path);
      return;
    }

    if (
      path.endsWith("/management/payments/93/refund") &&
      request.method() === "POST"
    ) {
      refundCount += 1;
      refundKey = request.headers()["idempotency-key"] ?? null;
      expect(request.postDataJSON()).toEqual({
        reason: "Khách đổi kế hoạch",
      });
      await new Promise((resolve) => setTimeout(resolve, 150));
      const refunded = {
        ...manualPayment,
        refundedAt: "2026-07-24T00:04:00.000Z",
        refundReason: "Khách đổi kế hoạch",
        status: "REFUNDED",
      };
      payments = [payments[0], refunded];
      await fulfillJson(route, refunded, path);
      return;
    }

    await route.fallback();
  });

  await page.goto("/management/payments");
  await expect(page.getByText(/1 giao dịch cần được kiểm tra/i)).toBeVisible();

  await page
    .getByRole("button", {
      name: "Đối soát hoàn tiền giao dịch #92",
    })
    .dblclick();
  await expect(page.getByText("Đối soát hoàn tiền thành công")).toBeVisible();
  expect(reconcileCount).toBe(1);

  await page.getByRole("button", { name: "Hoàn tiền giao dịch #93" }).click();
  await page.getByLabel("Lý do hoàn tiền").fill("Khách đổi kế hoạch");
  await page.getByRole("button", { name: "Xác nhận hoàn tiền" }).dblclick();
  await expect(page.getByText("Hoàn tiền thành công")).toBeVisible();
  expect(refundCount).toBe(1);
  expect(refundKey).toMatch(/^refund-/);
});

test("staff sees only cash and bank-transfer payments at the counter", async ({
  page,
}) => {
  await installSession(page, { actorType: "user", role: "STAFF" });

  await page.route("**/api/v1/management/payments?**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    await fulfillJson(
      route,
      [
        payment({ id: "92", status: "REFUND_PENDING" }),
        payment({ id: "93", method: "CASH", status: "SUCCESS" }),
        payment({ id: "94", method: "BANK_TRANSFER", status: "SUCCESS" }),
      ],
      path,
    );
  });

  await page.goto("/staff/payments?method=VNPAY");

  await expect(page).toHaveURL(/\/staff\/payments$/);
  await expect(page.getByText("Tiền mặt").first()).toBeVisible();
  await expect(page.getByText("Chuyển khoản").first()).toBeVisible();
  await expect(page.getByText(/Giao dịch #92/)).toHaveCount(0);
  await expect(
    page.getByRole("option", { name: "VNPay" }),
  ).toHaveCount(0);

  await expect(
    page.getByRole("button", { name: /Hoàn tiền giao dịch/ }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Đối soát hoàn tiền giao dịch/ }),
  ).toHaveCount(0);
});

test("admin refund pending and reconcile refresh payment and cached dashboard state", async ({
  page,
}) => {
  await installSession(page, { actorType: "user", role: "ADMIN" });
  let dashboardReads = 0;
  let currentPayment = payment({
    id: "94",
    paidAt: "2026-07-24T00:02:00.000Z",
    status: "SUCCESS",
  });

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path.endsWith("/auth/me")) {
      await route.fallback();
      return;
    }

    if (path.endsWith("/management/dashboard/summary")) {
      dashboardReads += 1;
      const summary = dashboardSummary(
        url.searchParams.get("from") ?? "2026-07-01",
        url.searchParams.get("to") ?? "2026-07-29",
      );
      summary.payments.refundPending =
        currentPayment.status === "REFUND_PENDING" ? 1 : 0;
      summary.totalRefunded =
        currentPayment.status === "REFUNDED" ? 1_800_000 : 0;
      await fulfillJson(route, summary, path);
      return;
    }

    if (path.endsWith("/management/payments") && request.method() === "GET") {
      await route.fulfill({
        body: JSON.stringify({
          ...envelope([currentPayment], path),
          meta: {
            pagination: {
              limit: 20,
              page: 1,
              total: 1,
              totalPages: 1,
            },
            staleRefundCount: 0,
          },
        }),
        contentType: "application/json",
        status: 200,
      });
      return;
    }

    if (
      path.endsWith("/management/payments/94/refund") &&
      request.method() === "POST"
    ) {
      currentPayment = payment({
        id: "94",
        paidAt: "2026-07-24T00:02:00.000Z",
        refundRequestId: "refund-94",
        refundRequestedAt: "2026-07-29T01:00:00.000Z",
        status: "REFUND_PENDING",
      });
      await fulfillJson(route, currentPayment, path);
      return;
    }

    if (
      path.endsWith("/management/payments/94/reconcile-refund") &&
      request.method() === "POST"
    ) {
      currentPayment = payment({
        id: "94",
        paidAt: "2026-07-24T00:02:00.000Z",
        refundedAt: "2026-07-29T01:05:00.000Z",
        refundRequestId: "refund-94",
        refundRequestedAt: "2026-07-29T01:00:00.000Z",
        status: "REFUNDED",
      });
      await fulfillJson(route, currentPayment, path);
      return;
    }

    await route.fallback();
  });

  await page.goto("/management/dashboard");
  await expect(
    page.getByRole("heading", { name: "Tổng quan vận hành" }),
  ).toBeVisible();
  await expect.poll(() => dashboardReads).toBeGreaterThan(0);
  const initialDashboardReads = dashboardReads;

  await page.getByRole("link", { name: "Quản lý thanh toán" }).click();
  await page.getByRole("button", { name: "Hoàn tiền giao dịch #94" }).click();
  await page.getByLabel("Lý do hoàn tiền").fill("Khách đổi kế hoạch");
  await page.getByRole("button", { name: "Xác nhận hoàn tiền" }).click();
  await expect(
    page.getByText("Yêu cầu hoàn tiền đang được xử lý"),
  ).toBeVisible();

  await page
    .getByRole("button", {
      name: "Đối soát hoàn tiền giao dịch #94",
    })
    .click();
  await expect(page.getByText("Đối soát hoàn tiền thành công")).toBeVisible();

  const overviewLink = page.getByRole("link", {
    exact: true,
    name: "Tổng quan",
  });

  if (!(await overviewLink.isVisible())) {
    await page.getByRole("button", { name: "Mở menu vận hành" }).click();
  }
  await overviewLink.click();

  await expect(
    page.getByRole("heading", { name: "Tổng quan vận hành" }),
  ).toBeVisible();
  await expect
    .poll(() => dashboardReads)
    .toBeGreaterThan(initialDashboardReads);
  await expect(page.getByText("1.800.000 ₫")).toBeVisible();
});

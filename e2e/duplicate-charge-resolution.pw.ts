import { expect, test } from "@playwright/test";

import { envelope, fulfillJson, installSession } from "./helpers";

const booking = {
  bookingCode: "HBMS-DUP-902",
  checkInDate: "2099-03-10",
  checkOutDate: "2099-03-12",
  contactName: "Khách kiểm thử",
  contactPhone: "+849****0000",
  id: "902",
  paymentStatus: "PAID",
  status: "CONFIRMED",
  totalAmount: "1800000.00",
};

function payment(
  overrides: Partial<Record<string, unknown>> = {},
) {
  return {
    amount: "1800000.00",
    bookingId: booking.id,
    createdAt: "2026-07-24T00:00:00.000Z",
    createdByUser: null,
    createdByUserId: null,
    currency: "VND",
    expiresAt: null,
    gatewayName: "VNPay",
    gatewayReference: "P95",
    gatewayResponseCode: "00",
    gatewayTransactionDate: "20260724000102",
    gatewayTransactionId: "TXN95",
    gatewayTransactionStatus: "00",
    id: "95",
    method: "VNPAY",
    paidAt: "2026-07-24T00:01:00.000Z",
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
    reviewCanonicalPaymentId: "90",
    reviewReason: "ANOTHER_SUCCESSFUL_PAYMENT",
    status: "REQUIRES_REVIEW",
    updatedAt: "2026-07-24T00:00:00.000Z",
    ...overrides,
  };
}

test("admin resolves a duplicate successful payment through the review queue", async ({
  page,
}) => {
  await installSession(page, { actorType: "user", role: "ADMIN" });

  let resolveCount = 0;
  let resolveKeys: Array<string | null> = [];
  let refundAttempts = 0;
  const duplicate = payment();
  const canonical = payment({
    id: "90",
    reviewCanonicalPaymentId: null,
    reviewReason: null,
    status: "SUCCESS",
  });
  let payments = [duplicate, canonical];

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
            staleRefundCount: 0,
          },
        }),
        contentType: "application/json",
        status: 200,
      });
      return;
    }

    /* The duplicate payment MUST go to the dedicated endpoint, never the
     * generic refund endpoint. */
    if (
      path.endsWith("/management/payments/95/resolve-duplicate-charge") &&
      request.method() === "POST"
    ) {
      resolveCount += 1;
      resolveKeys.push(request.headers()["idempotency-key"] ?? null);
      await new Promise((resolve) => setTimeout(resolve, 150));
      payments = [
        payment({
          refundPreviousStatus: "REQUIRES_REVIEW",
          refundReason: "Duplicate VNPay charge resolution.",
          refundRequestId: "R95",
          refundRequestedAt: "2026-07-29T01:00:00.000Z",
          status: "REFUNDED",
        }),
        canonical,
      ];
      await fulfillJson(route, payments[0], path);
      return;
    }

    if (
      path.endsWith("/management/payments/95/refund") &&
      request.method() === "POST"
    ) {
      refundAttempts += 1;
      await fulfillJson(route, duplicate, path, 409);
      return;
    }

    await route.fallback();
  });

  await page.goto("/management/payments");

  /* The review row shows the duplicate-specific reason, not a generic one.
   * Both viewport layouts render the row; keep the visible one only. */
  await expect(
    page
      .getByText("Trùng thanh toán cho cùng đặt phòng")
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
  await expect(
    page
      .getByText(/Đã phát hiện khoản thanh toán trùng cho cùng một đặt phòng/)
      .filter({ visible: true })
      .first(),
  ).toBeVisible();

  /* Standard refund must be unavailable for the duplicate charge. */
  await expect(
    page.getByRole("button", { name: "Hoàn tiền giao dịch #95" }),
  ).toHaveCount(0);

  /* Open the resolution dialog and verify the money context before
   * confirming: duplicate, canonical successful payment, amount. */
  await page
    .getByRole("button", { name: "Xử lý giao dịch trùng #95" })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByText("Giao dịch trùng", { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByText("#95", { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByText("Giao dịch chính (thành công)", { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByText("#90", { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByText("1.800.000 ₫", { exact: true }).first(),
  ).toBeVisible();

  /* Double click the confirm to prove a single submit reaches the API. */
  await dialog
    .getByRole("button", { name: "Xác nhận hoàn giao dịch trùng" })
    .dblclick();

  await expect(page.getByText("Đã xử lý giao dịch trùng")).toBeVisible();
  await expect(
    page.getByText(/Khoản thu trùng đã được xử lý/),
  ).toBeVisible();
  expect(resolveCount).toBe(1);
  expect(refundAttempts).toBe(0);

  const [resolveKey] = resolveKeys;
  expect(resolveKey).toMatch(/^duplicate-/);
  expect(resolveKey!.length).toBeLessThanOrEqual(100);

  /* Authoritative data is refetched: the row reflects REFUNDED. */
  await expect(
    page.getByText("Đã hoàn tiền").filter({ visible: true }).first(),
  ).toBeVisible();
});

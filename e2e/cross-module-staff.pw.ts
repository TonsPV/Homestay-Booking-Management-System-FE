import { expect, test, type Page } from "@playwright/test";

import { dashboardSummary, fulfillJson, principalFor } from "./helpers";

async function openStaffSection(page: Page, name: string) {
  const links = page.getByRole("link", { exact: true, name });

  for (const link of await links.all()) {
    if (await link.isVisible()) {
      await link.click();
      return;
    }
  }

  await page.getByRole("button", { name: "Mở menu vận hành" }).click();

  for (const link of await links.all()) {
    if (await link.isVisible()) {
      await link.click();
      return;
    }
  }

  throw new Error(`Không tìm thấy tác vụ tại quầy ${name}.`);
}

test("staff login continues through counter booking, manual payment, check-in and check-out", async ({
  page,
}) => {
  const principal = principalFor({ actorType: "user", role: "STAFF" });
  let payments: Array<Record<string, unknown>> = [];
  let bookingCreated = false;
  let booking = {
    bookingCode: "HBMS-STAFF-902",
    cancelledAt: null,
    cancellationReason: null,
    checkInDate: "2099-03-10",
    checkOutDate: "2099-03-12",
    contactEmail: null,
    contactName: "Khách tại quầy",
    contactPhone: "0901234567",
    createdAt: "2026-07-29T00:00:00.000Z",
    createdByUser: { fullName: principal.fullName, id: principal.id },
    createdByUserId: principal.id,
    customer: {
      fullName: "Khách tại quầy",
      id: "302",
      phone: "0901234567",
    },
    customerId: "302",
    customerNote: null,
    guestCount: 2,
    id: "902",
    paymentExpiresAt: "2099-03-01T00:15:00.000Z",
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
    updatedAt: "2026-07-29T00:00:00.000Z",
  };

  function managementBooking() {
    const allowedTarget =
      booking.status === "PENDING_PAYMENT"
        ? "CANCELLED"
        : booking.status === "CONFIRMED"
          ? "CHECKED_IN"
          : booking.status === "CHECKED_IN"
            ? "CHECKED_OUT"
            : undefined;

    return {
      ...booking,
      credentialCapabilities: {
        canSetInitialPassword: false,
        reasonCode: "CUSTOMER_INITIAL_PASSWORD_ALREADY_CONFIGURED",
      },
      transitionCapabilities: [
        "PENDING_PAYMENT",
        "CONFIRMED",
        "CHECKED_IN",
        "CHECKED_OUT",
        "CANCELLED",
      ].map((targetStatus) => ({
        allowed:
          targetStatus === booking.status || targetStatus === allowedTarget,
        reasonCode:
          targetStatus === booking.status || targetStatus === allowedTarget
            ? null
            : "BOOKING_TRANSITION_NOT_ALLOWED",
        targetStatus,
      })),
    };
  }

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path.endsWith("/auth/users/login")) {
      await fulfillJson(
        route,
        {
          accessToken: "staff-cross-module-token",
          actorType: "user",
          expiresIn: 3600,
          tokenType: "Bearer",
          user: {
            createdAt: principal.createdAt,
            email: principal.email,
            fullName: principal.fullName,
            id: principal.id,
            phone: principal.phone,
            role: "STAFF",
            status: principal.status,
            updatedAt: principal.updatedAt,
          },
        },
        path,
      );
      return;
    }

    if (path.endsWith("/management/dashboard/summary")) {
      await fulfillJson(
        route,
        dashboardSummary(
          url.searchParams.get("from") ?? "2026-07-01",
          url.searchParams.get("to") ?? "2026-07-29",
        ),
        path,
      );
      return;
    }

    if (
      path.endsWith("/management/rooms/available") &&
      request.method() === "GET"
    ) {
      await fulfillJson(
        route,
        bookingCreated
          ? []
          : [
              {
                createdAt: "2026-07-29T00:00:00.000Z",
                description: "Phòng gia đình nhìn ra vườn.",
                id: "10",
                images: [],
                name: "Suite Vườn",
                roomNumber: "A101",
                roomType: {
                  amenities: [],
                  basePrice: "900000.00",
                  description: null,
                  id: "5",
                  maxGuests: 4,
                  name: "Family Suite",
                },
                roomTypeId: "5",
                status: "READY",
                updatedAt: "2026-07-29T00:00:00.000Z",
              },
            ],
        path,
      );
      return;
    }

    if (path.endsWith("/management/rooms") && request.method() === "GET") {
      await fulfillJson(
        route,
        [
          {
            calendarSummary: {
              asOfDate: "2026-08-02",
              nextEvent: bookingCreated
                ? {
                    booking: {
                      bookingCode: booking.bookingCode,
                      checkInDate: booking.checkInDate,
                      checkOutDate: booking.checkOutDate,
                      id: booking.id,
                    },
                    reason: null,
                    status: "RESERVED",
                    stayDate: booking.checkInDate,
                  }
                : null,
              todayStatus: "AVAILABLE",
            },
            createdAt: "2026-07-29T00:00:00.000Z",
            description: "Phòng gia đình nhìn ra vườn.",
            id: "10",
            images: [],
            name: "Suite Vườn",
            roomNumber: "A101",
            roomType: {
              amenities: [],
              basePrice: "900000.00",
              description: null,
              id: "5",
              maxGuests: 4,
              name: "Family Suite",
            },
            roomTypeId: "5",
            status: "READY",
            updatedAt: "2026-07-29T00:00:00.000Z",
          },
        ],
        path,
      );
      return;
    }

    if (path.endsWith("/management/bookings") && request.method() === "POST") {
      bookingCreated = true;
      await fulfillJson(route, managementBooking(), path, 201);
      return;
    }

    if (
      path.endsWith("/management/bookings/902") &&
      request.method() === "GET"
    ) {
      await fulfillJson(route, managementBooking(), path);
      return;
    }

    if (path.endsWith("/management/bookings/902/payments")) {
      if (request.method() === "GET") {
        await fulfillJson(route, payments, path);
        return;
      }

      const payment = {
        amount: "1800000.00",
        bookingId: "902",
        createdAt: "2026-07-29T00:01:00.000Z",
        createdByUser: {
          fullName: principal.fullName,
          id: principal.id,
        },
        createdByUserId: principal.id,
        currency: "VND",
        expiresAt: null,
        gatewayName: null,
        gatewayReference: null,
        gatewayResponseCode: null,
        gatewayTransactionDate: null,
        gatewayTransactionId: null,
        gatewayTransactionStatus: null,
        id: "95",
        method: "CASH",
        paidAt: "2026-07-29T00:01:00.000Z",
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
        status: "SUCCESS",
        updatedAt: "2026-07-29T00:01:00.000Z",
      };
      payments = [payment];
      booking = {
        ...booking,
        paymentExpiresAt: null,
        paymentStatus: "PAID",
        status: "CONFIRMED",
        updatedAt: "2026-07-29T00:01:00.000Z",
      };
      await fulfillJson(route, payment, path, 201);
      return;
    }

    if (
      path.endsWith("/management/bookings/902/status") &&
      request.method() === "PATCH"
    ) {
      const body = request.postDataJSON() as {
        status: "CHECKED_IN" | "CHECKED_OUT";
      };
      booking = {
        ...booking,
        status: body.status,
        updatedAt: "2026-07-29T00:02:00.000Z",
      };
      await fulfillJson(route, managementBooking(), path);
      return;
    }

    await route.fallback();
  });

  await page.goto("/management/login");
  await page.getByLabel("Email hoặc số điện thoại").fill(principal.email);
  await page.getByLabel("Mật khẩu").fill("StrongPassword123!");
  await page.getByRole("button", { name: "Đăng nhập" }).click();

  await expect(page).toHaveURL(/\/staff\/counter$/);
  await page.getByLabel("Ngày nhận phòng").fill("2099-03-10");
  await page.getByLabel("Ngày trả phòng").fill("2099-03-12");
  await page.getByLabel("Số khách").fill("2");
  await page.getByRole("radio", { name: /Phòng A101/ }).click();
  await page.getByLabel("Họ tên khách").fill("Khách tại quầy");
  await page.getByLabel("Số điện thoại").fill("0901234567");
  await page.getByRole("button", { name: "Tạo booking" }).click();

  await expect(page).toHaveURL(/\/staff\/bookings\/902$/);
  await openStaffSection(page, "Phòng");
  await expect(
    page.locator("span").filter({ hasText: /^Sẵn sàng đón khách$/ }),
  ).toBeVisible();
  await expect(page.getByText(/Booking gần nhất HBMS-STAFF-902/)).toBeVisible();

  await openStaffSection(page, "Đặt phòng");
  await page.getByLabel("Ngày nhận phòng").fill("2099-03-10");
  await page.getByLabel("Ngày trả phòng").fill("2099-03-12");
  await page.getByLabel("Số khách").fill("2");
  await expect(
    page.getByRole("heading", { name: "Hết phòng trống" }),
  ).toBeVisible();

  await page.goBack();
  await page.goBack();
  await expect(page).toHaveURL(/\/staff\/bookings\/902$/);
  await page.getByRole("button", { name: "Ghi nhận đã thanh toán" }).click();
  await expect(page.getByText("Đã ghi nhận thanh toán")).toBeVisible();
  await expect(
    page
      .locator("span")
      .filter({ hasText: /^Đã xác nhận$/ })
      .first(),
  ).toBeVisible();

  await page
    .getByRole("combobox", { name: "Trạng thái tiếp theo" })
    .selectOption("CHECKED_IN");
  await page.getByRole("button", { name: "Cập nhật trạng thái" }).click();
  await expect(
    page
      .locator("span")
      .filter({ hasText: /^Đã nhận phòng$/ })
      .first(),
  ).toBeVisible();

  await page
    .getByRole("combobox", { name: "Trạng thái tiếp theo" })
    .selectOption("CHECKED_OUT");
  await page.getByRole("button", { name: "Cập nhật trạng thái" }).click();
  await expect(
    page
      .locator("span")
      .filter({ hasText: /^Đã trả phòng$/ })
      .first(),
  ).toBeVisible();
});

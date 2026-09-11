import { expect, test } from "@playwright/test";

import { envelope, fulfillJson, installSession } from "./helpers";

test("staff creates a counter booking and Backend decides lifecycle transitions", async ({
  page,
}) => {
  await installSession(page, { actorType: "user", role: "STAFF" });

  let submittedCreate: Record<string, unknown> | undefined;
  let submittedCreateIntent: string | null = null;
  let submittedStatus: Record<string, unknown> | undefined;
  let booking = {
    bookingCode: "HBMS-COUNTER-901",
    cancelledAt: null as string | null,
    cancellationReason: null as string | null,
    checkInDate: "2099-02-10",
    checkOutDate: "2099-02-12",
    contactEmail: null,
    contactName: "Khách tại quầy",
    contactPhone: "0901234567",
    credentialCapabilities: {
      canSetInitialPassword: true,
      reasonCode: null,
    },
    createdAt: "2026-07-24T00:00:00.000Z",
    createdByUser: { fullName: "Nhân viên kiểm thử", id: "201" },
    createdByUserId: "201",
    customer: {
      fullName: "Khách tại quầy",
      id: "301",
      phone: "0901234567",
    },
    customerId: "301",
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
    transitionCapabilities: [
      {
        allowed: true,
        reasonCode: null,
        targetStatus: "PENDING_PAYMENT",
      },
      { allowed: true, reasonCode: null, targetStatus: "CONFIRMED" },
      {
        allowed: false,
        reasonCode: "BOOKING_CHECKIN_REQUIRES_PAYMENT",
        targetStatus: "CHECKED_IN",
      },
      {
        allowed: false,
        reasonCode: "BOOKING_TRANSITION_NOT_ALLOWED",
        targetStatus: "CHECKED_OUT",
      },
      { allowed: true, reasonCode: null, targetStatus: "CANCELLED" },
    ],
    updatedAt: "2026-07-24T00:00:00.000Z",
  };

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path.endsWith("/auth/me")) {
      await route.fallback();
      return;
    }

    if (path.endsWith("/management/rooms/available") && method === "GET") {
      await fulfillJson(
        route,
        [
          {
            createdAt: "2026-07-24T00:00:00.000Z",
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
            updatedAt: "2026-07-24T00:00:00.000Z",
          },
        ],
        path,
      );
      return;
    }

    if (path.endsWith("/management/bookings") && method === "POST") {
      submittedCreate = request.postDataJSON();
      submittedCreateIntent = request.headers()["idempotency-key"] ?? null;
      await fulfillJson(route, booking, path, 201);
      return;
    }

    if (path.endsWith("/management/bookings/901") && method === "GET") {
      await fulfillJson(route, booking, path);
      return;
    }

    if (
      path.endsWith("/management/bookings/901/payments") &&
      method === "GET"
    ) {
      await fulfillJson(route, [], path);
      return;
    }

    if (
      path.endsWith("/management/bookings/901/status") &&
      method === "PATCH"
    ) {
      submittedStatus = request.postDataJSON();

      if (submittedStatus?.status === "CONFIRMED") {
        booking = {
          ...booking,
          paymentExpiresAt: null,
          status: "CONFIRMED",
          transitionCapabilities: [
            {
              allowed: false,
              reasonCode: "BOOKING_TRANSITION_NOT_ALLOWED",
              targetStatus: "PENDING_PAYMENT",
            },
            { allowed: true, reasonCode: null, targetStatus: "CONFIRMED" },
            {
              allowed: false,
              reasonCode: "BOOKING_CHECKIN_REQUIRES_PAYMENT",
              targetStatus: "CHECKED_IN",
            },
            {
              allowed: false,
              reasonCode: "BOOKING_TRANSITION_NOT_ALLOWED",
              targetStatus: "CHECKED_OUT",
            },
            { allowed: true, reasonCode: null, targetStatus: "CANCELLED" },
          ],
        };
        await fulfillJson(route, booking, path);
        return;
      }

      booking = {
        ...booking,
        cancelledAt: "2026-07-24T01:00:00.000Z",
        cancellationReason: String(submittedStatus?.cancellationReason ?? ""),
        status: "CANCELLED",
      };
      await fulfillJson(route, booking, path);
      return;
    }

    await route.fallback();
  });

  await page.goto("/staff/counter");
  await page.getByLabel("Ngày nhận phòng").fill("2099-02-10");
  await page.getByLabel("Ngày trả phòng").fill("2099-02-12");
  await page.getByLabel("Số khách").fill("2");
  await page.getByRole("radio", { name: /Phòng A101/ }).click();
  await page.getByLabel("Họ tên khách").fill("Khách tại quầy");
  await page.getByLabel("Số điện thoại").fill("0901234567");
  await page.getByRole("button", { name: "Tạo booking" }).click();

  await expect(page).toHaveURL(/\/staff\/bookings\/901$/);
  await expect(page.getByText("Chờ thanh toán").first()).toBeVisible();
  await expect(page.getByText("Chưa thanh toán").first()).toBeVisible();
  expect(submittedCreate).toEqual({
    checkInDate: "2099-02-10",
    checkOutDate: "2099-02-12",
    contactName: "Khách tại quầy",
    contactPhone: "0901234567",
    guestCount: 2,
    roomId: "10",
  });
  expect(submittedCreateIntent).toMatch(/^booking-management-/);

  const transitionSelect = page.getByRole("combobox", {
    name: "Trạng thái tiếp theo",
  });
  await expect(
    transitionSelect.locator('option[value="CHECKED_OUT"]'),
  ).toHaveCount(0);
  await expect(
    transitionSelect.locator('option[value="CHECKED_IN"]'),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Cập nhật trạng thái" }),
  ).toBeDisabled();
  expect(submittedStatus).toBeUndefined();

  await transitionSelect.selectOption("CONFIRMED");
  await page.getByRole("button", { name: "Cập nhật trạng thái" }).click();
  await expect(page.getByText("Đã xác nhận").first()).toBeVisible();

  await page
    .getByRole("combobox", { name: "Trạng thái tiếp theo" })
    .selectOption("CANCELLED");
  await page.getByLabel("Lý do hủy").fill("Khách đổi kế hoạch");
  await page.getByRole("button", { name: "Cập nhật trạng thái" }).click();
  await expect(
    page.getByRole("dialog", { name: "Hủy booking HBMS-COUNTER-901?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Xác nhận hủy booking" }).click();

  await expect(page.getByText("Đã cập nhật trạng thái booking.")).toBeVisible();
  expect(submittedStatus).toEqual({
    cancellationReason: "Khách đổi kế hoạch",
    status: "CANCELLED",
  });
});

test("management booking total excludes cancelled bookings", async ({ page }) => {
  await installSession(page, { actorType: "user", role: "ADMIN" });

  const baseBooking = {
    bookingCode: "HBMS-901",
    cancelledAt: null,
    cancellationReason: null,
    checkInDate: "2099-02-10",
    checkOutDate: "2099-02-12",
    contactEmail: null,
    contactName: "Khách kiểm thử",
    contactPhone: "0901234567",
    createdAt: "2026-07-24T00:00:00.000Z",
    createdByUser: null,
    createdByUserId: null,
    credentialCapabilities: {
      canSetInitialPassword: false,
      reasonCode: null,
    },
    customer: {
      fullName: "Khách kiểm thử",
      id: "301",
      phone: "0901234567",
    },
    customerId: "301",
    customerNote: null,
    guestCount: 2,
    paymentExpiresAt: null,
    paymentStatus: "PAID",
    room: {
      id: "10",
      name: "Suite Vườn",
      roomNumber: "A101",
      roomType: { id: "5", name: "Family Suite" },
    },
    roomId: "10",
    transitionCapabilities: [],
    updatedAt: "2026-07-24T00:00:00.000Z",
  };
  const bookings = [
    {
      ...baseBooking,
      id: "901",
      status: "PENDING_PAYMENT",
      totalAmount: "1250000.00",
    },
    {
      ...baseBooking,
      bookingCode: "HBMS-902",
      id: "902",
      status: "CONFIRMED",
      totalAmount: "1450000.00",
    },
    {
      ...baseBooking,
      bookingCode: "HBMS-903",
      id: "903",
      status: "CHECKED_IN",
      totalAmount: "800000.00",
    },
    {
      ...baseBooking,
      bookingCode: "HBMS-904",
      cancelledAt: "2026-07-24T01:00:00.000Z",
      cancellationReason: "Khách đổi kế hoạch",
      id: "904",
      paymentStatus: "UNPAID",
      status: "CANCELLED",
      totalAmount: "900000.00",
    },
  ];

  await page.route("**/api/v1/management/bookings**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    await route.fulfill({
      body: JSON.stringify({
        ...envelope(bookings, path),
        meta: {
          pagination: { limit: 10, page: 1, total: 4, totalPages: 1 },
        },
      }),
      contentType: "application/json",
      status: 200,
    });
  });

  await page.goto("/management/bookings");

  await expect(page.getByText("Tổng tiền đơn chưa hủy")).toBeVisible();
  await expect(page.getByTestId("stat-displayed-total")).toHaveText(
    /3\.500\.000/,
  );
});

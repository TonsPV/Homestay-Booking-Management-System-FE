import { expect, test } from "@playwright/test";

const adminIdentifier = process.env.HBMS_LIVE_ADMIN_IDENTIFIER;
const password = process.env.HBMS_LIVE_AUTH_PASSWORD;

test("live counter and customer booking journeys use Backend state", async ({
  page,
}) => {
  test.skip(
    !adminIdentifier || !password,
    "Live Booking fixtures were not provided.",
  );
  test.setTimeout(120_000);

  const suffix = Date.now();
  const customerPhone = `09${String(suffix).slice(-8)}`;
  const counterPhone = `08${String(suffix + 1).slice(-8)}`;
  const roomTypeName = `Live Booking Type ${suffix}`;
  const roomNumber = `B${String(suffix).slice(-8)}`;
  const roomName = `Live Booking Room ${suffix}`;

  await page.goto("/register");
  await page.getByLabel("Họ và tên").fill(`Live Customer ${suffix}`);
  await page.getByLabel("Số điện thoại").fill(customerPhone);
  await page.getByLabel("Email").fill(`booking-${suffix}@example.com`);
  await page.locator('input[name="password"]').fill(password!);
  await page.locator('input[name="confirmPassword"]').fill(password!);
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  await expect(page.getByText("Đăng ký thành công")).toBeVisible();

  await page.goto("/management/login");
  await page.getByLabel("Email hoặc số điện thoại").fill(adminIdentifier!);
  await page.getByLabel("Mật khẩu").fill(password!);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/management$/);

  await page.goto("/management/room-types");
  await page.getByRole("button", { name: "Thêm loại phòng" }).click();
  await page.getByLabel("Tên loại phòng").fill(roomTypeName);
  await page.getByLabel("Số khách tối đa").fill("2");
  await page.getByLabel("Giá cơ bản").fill("700000");
  await page.getByRole("button", { name: "Tạo loại phòng" }).click();
  await expect(page.getByText("Đã tạo loại phòng.")).toBeVisible();

  await page.goto("/management/rooms");
  await page.getByRole("button", { name: "Thêm phòng" }).click();
  await page.getByLabel("Số phòng").fill(roomNumber);
  await page.getByLabel("Tên phòng").fill(roomName);
  const roomTypeSelect = page.getByLabel("Loại phòng").first();
  const roomTypeId = await roomTypeSelect
    .locator("option")
    .filter({ hasText: roomTypeName })
    .getAttribute("value");
  expect(roomTypeId).not.toBeNull();
  await roomTypeSelect.selectOption(roomTypeId!);
  await page.getByRole("button", { name: "Tạo phòng" }).click();

  await page.getByLabel("Tìm phòng quản lý").fill(roomNumber);
  await page.getByRole("button", { name: "Lọc" }).click();
  await page.getByRole("button", { name: "Xem chi tiết" }).click();
  await expect(page).toHaveURL(/\/management\/rooms\/[1-9][0-9]*$/);
  const roomId = new URL(page.url()).pathname.split("/").at(-1);
  expect(roomId).toMatch(/^[1-9][0-9]*$/);

  await page.goto("/staff/counter");
  await page.getByLabel("Ngày nhận phòng").fill("2099-05-01");
  await page.getByLabel("Ngày trả phòng").fill("2099-05-03");
  await page.getByLabel("Số khách").fill("2");
  await page
    .getByRole("radio", { name: new RegExp(`Phòng ${roomNumber}`) })
    .click();
  await page.getByLabel("Họ tên khách").fill("Live Counter Guest");
  await page.getByLabel("Số điện thoại").fill(counterPhone);
  await page.getByRole("button", { name: "Tạo booking" }).click();
  await expect(
    page
      .locator("span")
      .filter({ hasText: /^Chờ thanh toán$/ })
      .first(),
  ).toBeVisible();
  await expect(
    page
      .locator("span")
      .filter({ hasText: /^Chưa thanh toán$/ })
      .first(),
  ).toBeVisible();

  await page
    .getByRole("combobox", { name: "Trạng thái tiếp theo" })
    .selectOption("CONFIRMED");
  await page.getByRole("button", { name: "Cập nhật trạng thái" }).click();
  await expect(
    page
      .locator("span")
      .filter({ hasText: /^Đã xác nhận$/ })
      .first(),
  ).toBeVisible();

  await page
    .getByRole("combobox", { name: "Trạng thái tiếp theo" })
    .selectOption("CANCELLED");
  await page.getByLabel("Lý do hủy").fill("Kết thúc live counter flow");
  await page.getByRole("button", { name: "Cập nhật trạng thái" }).click();
  await page.getByRole("button", { name: "Xác nhận hủy booking" }).click();
  await expect(page.getByText("Đã cập nhật trạng thái booking.")).toBeVisible();

  await page.goto("/staff/counter");
  await page.getByLabel("Ngày nhận phòng").fill("2099-05-08");
  await page.getByLabel("Ngày trả phòng").fill("2099-05-10");
  await page.getByLabel("Số khách").fill("2");
  await page
    .getByRole("radio", { name: new RegExp(`Phòng ${roomNumber}`) })
    .click();
  await page.getByLabel("Họ tên khách").fill("Live Payment Guest");
  await page.getByLabel("Số điện thoại").fill(`07${String(suffix).slice(-8)}`);
  await page.getByRole("button", { name: "Tạo booking" }).click();
  await expect(page).toHaveURL(/\/management\/bookings\/[1-9][0-9]*$/);
  const paymentBookingId = new URL(page.url()).pathname.split("/").at(-1);
  expect(paymentBookingId).toMatch(/^[1-9][0-9]*$/);

  await page.getByRole("button", { name: "Ghi nhận đã thanh toán" }).dblclick();
  await expect(page.getByText("Đã ghi nhận thanh toán")).toBeVisible();
  await expect(
    page
      .locator("span")
      .filter({ hasText: /^Đã thanh toán$/ })
      .first(),
  ).toBeVisible();

  await page.goto("/management/payments?method=CASH");
  const paymentRow = page.getByRole("row").filter({
    has: page.getByRole("link", { name: `#${paymentBookingId}` }),
  });
  await paymentRow.getByRole("button", { name: /Hoàn tiền giao dịch/ }).click();
  await page
    .getByLabel("Lý do hoàn tiền")
    .fill("Kết thúc live manual payment flow");
  await page.getByRole("button", { name: "Xác nhận hoàn tiền" }).click();
  await expect(page.getByText("Hoàn tiền thành công")).toBeVisible();

  await page.goto(`/management/bookings/${paymentBookingId}`);
  await expect(
    page
      .locator("span")
      .filter({ hasText: /^Đã hoàn tiền$/ })
      .first(),
  ).toBeVisible();
  await expect(
    page
      .locator("span")
      .filter({ hasText: /^Đã hủy$/ })
      .first(),
  ).toBeVisible();

  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await page.goto("/login");
  await page.getByLabel("Email hoặc số điện thoại").fill(customerPhone);
  await page.getByLabel("Mật khẩu").fill(password!);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/bookings$/);

  await page.goto("/rooms/search");
  await page.getByLabel("Ngày nhận phòng").fill("2099-05-05");
  await page.getByLabel("Ngày trả phòng").fill("2099-05-07");
  await page.getByLabel("Số khách").fill("2");
  await page.getByLabel("Loại phòng").selectOption(roomTypeId!);
  await page.getByRole("button", { name: "Tìm kiếm" }).click();
  await expect(page.getByText(roomName)).toBeVisible();
  await page.getByRole("button", { name: "Xem chi tiết" }).click();
  await page.getByRole("button", { name: "Chọn phòng này" }).click();
  await page.getByRole("button", { name: "Tạo đặt phòng" }).click();

  await expect(page).toHaveURL(/\/bookings\/[1-9][0-9]*$/);
  await expect(
    page
      .locator("span")
      .filter({ hasText: /^Chờ thanh toán$/ })
      .first(),
  ).toBeVisible();
  await page.getByLabel("Lý do hủy").fill("Kết thúc live customer flow");
  await page.getByRole("button", { name: "Xác nhận hủy" }).click();
  await expect(page.getByText("Đã hủy đặt phòng.")).toBeVisible();
  await expect(
    page
      .locator("span")
      .filter({ hasText: /^Đã hủy$/ })
      .first(),
  ).toBeVisible();
});

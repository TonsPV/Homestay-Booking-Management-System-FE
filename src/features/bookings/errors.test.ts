import { describe, expect, it } from "vitest";

import { ApiError } from "@/api/errors";

import { getBookingActionError } from "./errors";

function httpError(errorCode?: string) {
  return new ApiError("Backend message", {
    errorCode,
    kind: "http",
    status: 409,
  });
}

describe("getBookingActionError", () => {
  it("translates stable Backend booking codes into clear Vietnamese", () => {
    expect(
      getBookingActionError(httpError("BOOKING_CHECKIN_REQUIRES_PAYMENT")),
    ).toBe("Booking cần được thanh toán trước khi check-in.");
    expect(getBookingActionError(httpError("BOOKING_ROOM_NOT_READY"))).toBe(
      "Phòng chưa ở trạng thái sẵn sàng để check-in.",
    );
    expect(
      getBookingActionError(httpError("BOOKING_CANCELLATION_NOT_ALLOWED")),
    ).toBe("Booking không thể hủy ở trạng thái hiện tại.");
  });

  it("uses a safe fallback for an unknown booking conflict", () => {
    expect(getBookingActionError(httpError())).toBe(
      "Dữ liệu đã thay đổi hoặc xung đột. Vui lòng tải lại và thử lại.",
    );
  });
});

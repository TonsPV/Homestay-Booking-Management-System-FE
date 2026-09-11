import { describe, expect, it } from "vitest";

import { ApiError } from "@/api/errors";

import {
  buildRoomSearchUrl,
  getBookingActionError,
  getCustomerBookingActionError,
  isBookingRoomConflictError,
} from "./errors";

function httpError(errorCode?: string, requestId?: string, status = 409) {
  return new ApiError("Backend message", {
    errorCode,
    kind: "http",
    requestId,
    status,
  });
}

describe("getBookingActionError", () => {
  it("translates stable Backend booking codes into clear Vietnamese", () => {
    expect(
      getBookingActionError(httpError("BOOKING_CHECKIN_REQUIRES_PAYMENT")),
    ).toBe("Đặt phòng cần được thanh toán trước khi nhận phòng.");
    expect(getBookingActionError(httpError("BOOKING_ROOM_NOT_READY"))).toBe(
      "Phòng chưa ở trạng thái sẵn sàng để check-in.",
    );
    expect(
      getBookingActionError(httpError("BOOKING_CANCELLATION_NOT_ALLOWED")),
    ).toBe("Đặt phòng không thể hủy ở trạng thái hiện tại.");
    expect(
      getBookingActionError(httpError("BOOKING_REQUEST_INTENT_CONFLICT")),
    ).toContain("kiểm tra danh sách đặt phòng");
    expect(
      getBookingActionError(
        httpError("BOOKING_ROOM_MISSING_FOR_BOOKING"),
      ),
    ).toContain("không còn liên kết với phòng");
  });

  it("uses a safe fallback for an unknown booking conflict", () => {
    expect(getBookingActionError(httpError())).toBe(
      "Dữ liệu đã thay đổi hoặc xung đột. Vui lòng tải lại và thử lại.",
    );
  });

  it("never exposes backend request IDs or raw messages", () => {
    const systemError = httpError(undefined, "req-sys-500", 500);
    expect(getBookingActionError(systemError)).toBe(
      "Hệ thống đang tạm thời gián đoạn. Vui lòng thử lại sau.",
    );

    const unknownConflict = httpError(undefined, "req-conf-409", 409);
    expect(getBookingActionError(unknownConflict)).toBe(
      "Dữ liệu đã thay đổi hoặc xung đột. Vui lòng tải lại và thử lại.",
    );

    const networkError = new ApiError("Failed to fetch", {
      kind: "network",
      requestId: "req-net-001",
    });
    expect(getBookingActionError(networkError)).toBe(
      "Không thể kết nối hệ thống. Vui lòng kiểm tra đường truyền và thử lại.",
    );
    expect(getBookingActionError(systemError)).not.toContain("req-sys-500");
    expect(getBookingActionError(systemError)).not.toContain("Backend message");
  });
});

describe("getCustomerBookingActionError", () => {
  it("uses customer wording for room availability and does not expose a reference code", () => {
    expect(
      getCustomerBookingActionError(
        httpError("BOOKING_ROOM_UNAVAILABLE", "req-customer-42"),
      ),
    ).toBe(
      "Phòng này không còn trống trong kỳ bạn đã chọn. Hãy chọn ngày hoặc phòng khác.",
    );

    expect(
      getCustomerBookingActionError(httpError(undefined, "req-customer-500", 500)),
    ).not.toContain("Mã tham chiếu");
  });

  it("uses a customer message when availability is returned as a field error", () => {
    expect(
      getCustomerBookingActionError(
        new ApiError("Raw field error", {
          fieldErrors: {
            checkInDate: [
              {
                errorCode: "BOOKING_ROOM_UNAVAILABLE",
                message: "Room is unavailable.",
              },
            ],
          },
          kind: "http",
          status: 409,
        }),
      ),
    ).toBe(
      "Phòng này không còn trống trong kỳ bạn đã chọn. Hãy chọn ngày hoặc phòng khác.",
    );
  });
});

describe("isBookingRoomConflictError", () => {
  it("detects room conflict errors properly", () => {
    expect(
      isBookingRoomConflictError(httpError("BOOKING_ROOM_UNAVAILABLE")),
    ).toBe(true);
    expect(
      isBookingRoomConflictError(httpError("BOOKING_ROOM_NOT_BOOKABLE")),
    ).toBe(true);
    expect(
      isBookingRoomConflictError(httpError("BOOKING_CREATE_CONFLICT")),
    ).toBe(true);
    expect(isBookingRoomConflictError(httpError())).toBe(true);

    // Should not flag idempotency intent conflicts as room conflicts
    expect(
      isBookingRoomConflictError(httpError("BOOKING_REQUEST_INTENT_CONFLICT")),
    ).toBe(false);

    // Non-409 errors
    expect(isBookingRoomConflictError(httpError("BOOKING_CHECKIN_IN_PAST", undefined, 400))).toBe(false);
  });
});

describe("buildRoomSearchUrl", () => {
  it("builds correct URL preserving stay dates and guest count", () => {
    const url = buildRoomSearchUrl({
      checkIn: "2026-08-10",
      checkOut: "2026-08-12",
      guests: 3,
    });
    expect(url).toBe("/rooms?checkIn=2026-08-10&checkOut=2026-08-12&guests=3");
  });

  it("handles missing optional parameters cleanly", () => {
    const url = buildRoomSearchUrl({});
    expect(url).toBe("/rooms");
  });
});

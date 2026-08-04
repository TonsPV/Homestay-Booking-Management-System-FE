import { describe, expect, it } from "vitest";

import { ApiError } from "@/api/errors";

import { getRoomCalendarActionError } from "./errors";

describe("getRoomCalendarActionError", () => {
  it("turns a stable conflict code into a recovery step", () => {
    const message = getRoomCalendarActionError(
      new ApiError("Backend message", {
        errorCode: "COMMON_CONFLICT",
        kind: "http",
        status: 409,
      }),
    );

    expect(message).toBe(
      "Khoảng ngày này đã có đặt phòng hoặc vừa được cập nhật. Vui lòng kiểm tra lịch và chọn lại.",
    );
  });
});

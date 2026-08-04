import { describe, expect, it } from "vitest";

import { ApiError } from "@/api/errors";

import { getPaymentActionError } from "./errors";

describe("getPaymentActionError", () => {
  it("uses an action-oriented conflict message from the stable code", () => {
    expect(
      getPaymentActionError(
        new ApiError("Backend message", {
          errorCode: "COMMON_CONFLICT",
          kind: "http",
          status: 409,
        }),
      ),
    ).toBe(
      "Thanh toán chưa thể hoàn tất vì dữ liệu vừa thay đổi. Vui lòng tải lại lịch sử trước khi thử lại.",
    );
  });

  it("does not expose a gateway rejection message", () => {
    expect(
      getPaymentActionError(
        new ApiError("VNPay response 99: internal gateway detail", {
          errorCode: "PAYMENT_REFUND_REJECTED",
          kind: "http",
          status: 409,
        }),
      ),
    ).toBe(
      "Yêu cầu hoàn tiền đã bị từ chối. Vui lòng kiểm tra giao dịch trước khi thử lại.",
    );
  });
});

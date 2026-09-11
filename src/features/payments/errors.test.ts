import { describe, expect, it } from "vitest";

import { ApiError } from "@/api/errors";

import {
  getCustomerPaymentActionError,
  getPaymentActionError,
} from "./errors";

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

describe("getCustomerPaymentActionError", () => {
  it("replaces idempotency terminology with a clear next step", () => {
    expect(
      getCustomerPaymentActionError(
        new ApiError("Payment idempotency key conflict", {
          errorCode: "PAYMENT_IDEMPOTENCY_KEY_CONFLICT",
          kind: "http",
          status: 409,
        }),
      ),
    ).toBe(
      "Thông tin thanh toán vừa thay đổi. Vui lòng tải lại trang trước khi thử lại.",
    );
  });
});

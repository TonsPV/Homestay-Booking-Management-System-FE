import { describe, expect, it } from "vitest";

import { ApiError } from "@/api/errors";

import {
  getCustomerPasswordActionError,
  getCustomerProfileActionError,
} from "./errors";

function customerError(errorCode: string) {
  return new ApiError("Backend message", {
    errorCode,
    kind: "http",
    status: errorCode === "COMMON_CONFLICT" ? 409 : 400,
  });
}

describe("customer action error messages", () => {
  it("uses the stable conflict code for profile updates", () => {
    expect(
      getCustomerProfileActionError(customerError("COMMON_CONFLICT")),
    ).toBe(
      "Thông tin liên hệ đã được sử dụng hoặc vừa thay đổi. Vui lòng tải lại trước khi chỉnh sửa tiếp.",
    );
  });

  it("distinguishes duplicate contact fields", () => {
    expect(
      getCustomerProfileActionError(customerError("CUSTOMER_EMAIL_IN_USE")),
    ).toBe("Email đã được sử dụng. Vui lòng dùng email khác.");
    expect(
      getCustomerProfileActionError(customerError("CUSTOMER_PHONE_IN_USE")),
    ).toBe("Số điện thoại đã được sử dụng. Vui lòng dùng số khác.");
  });

  it("uses the generic validation recovery message for password errors", () => {
    expect(
      getCustomerPasswordActionError(customerError("COMMON_VALIDATION_FAILED")),
    ).toBe("Thông tin chưa hợp lệ. Vui lòng kiểm tra lại và thử lại.");
  });

  it("explains password-rule errors without reading Backend messages", () => {
    expect(
      getCustomerPasswordActionError(
        customerError("CUSTOMER_CURRENT_PASSWORD_INVALID"),
      ),
    ).toBe("Mật khẩu hiện tại chưa chính xác. Vui lòng kiểm tra lại.");
    expect(
      getCustomerPasswordActionError(
        customerError("CUSTOMER_PASSWORD_REUSE_NOT_ALLOWED"),
      ),
    ).toBe("Mật khẩu mới phải khác mật khẩu hiện tại.");
  });

  it("does not expose an unknown backend message", () => {
    expect(
      getCustomerPasswordActionError(
        new ApiError("HASH_COMPARISON_FAILED", {
          kind: "http",
          status: 400,
        }),
      ),
    ).toBe("Thông tin chưa hợp lệ. Vui lòng kiểm tra lại và thử lại.");
  });
});

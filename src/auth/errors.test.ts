import { describe, expect, it } from "vitest";

import { ApiError } from "@/api/errors";

import { getAuthActionError } from "./errors";

describe("getAuthActionError", () => {
  it("turns the stable unauthorized code into one account-neutral message", () => {
    const error = new ApiError("Backend message", {
      errorCode: "COMMON_UNAUTHORIZED",
      kind: "http",
      status: 401,
    });

    expect(getAuthActionError(error)).toBe(
      "Email, số điện thoại hoặc mật khẩu chưa chính xác. Vui lòng kiểm tra và thử lại.",
    );
  });

  it("does not vary the credential error by account role", () => {
    const error = new ApiError("password_mismatch", {
      errorCode: "COMMON_UNAUTHORIZED",
      kind: "http",
      status: 401,
    });

    expect(getAuthActionError(error)).toBe(
      "Email, số điện thoại hoặc mật khẩu chưa chính xác. Vui lòng kiểm tra và thử lại.",
    );
  });

  it("translates a stable registration conflict without Backend text", () => {
    const error = new ApiError("Backend message", {
      errorCode: "COMMON_CONFLICT",
      kind: "http",
      status: 409,
    });

    expect(getAuthActionError(error)).toBe(
      "Email hoặc số điện thoại đã được sử dụng. Vui lòng đăng nhập hoặc dùng thông tin khác.",
    );
  });
});

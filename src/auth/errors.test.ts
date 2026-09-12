import { describe, expect, it } from "vitest";

import { ApiError } from "@/api/errors";

import { getAuthActionError } from "./errors";

describe("getAuthActionError", () => {
  it("turns the stable unauthorized code into a customer-friendly message", () => {
    const error = new ApiError("Backend message", {
      errorCode: "COMMON_UNAUTHORIZED",
      kind: "http",
      status: 401,
    });

    expect(getAuthActionError(error)).toBe(
      "Email, số điện thoại hoặc mật khẩu chưa chính xác. Nếu đây là tài khoản nhân viên hoặc quản trị viên, hãy đăng nhập tại khu vực vận hành.",
    );
  });

  it("gives operations users a recovery path without exposing Backend details", () => {
    const error = new ApiError("password_mismatch", {
      errorCode: "COMMON_UNAUTHORIZED",
      kind: "http",
      status: 401,
    });

    expect(getAuthActionError(error, "user")).toBe(
      "Email hoặc mật khẩu tài khoản vận hành chưa chính xác. Nếu bạn vừa được cấp tài khoản, hãy liên hệ quản trị viên để kiểm tra hoặc đặt lại mật khẩu.",
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

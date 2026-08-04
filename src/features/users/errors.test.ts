import { describe, expect, it } from "vitest";

import { ApiError } from "@/api/errors";

import { getUserActionError } from "./errors";

describe("getUserActionError", () => {
  it("uses the stable conflict code without inspecting Backend text", () => {
    const error = new ApiError("Backend message", {
      errorCode: "COMMON_CONFLICT",
      kind: "http",
      status: 409,
    });

    expect(getUserActionError(error)).toBe(
      "Thông tin tài khoản đã tồn tại. Vui lòng kiểm tra lại email và số điện thoại.",
    );
  });

  it("keeps the no-code compatibility fallback during a rolling deployment", () => {
    const error = new ApiError("DATABASE_UNIQUE_CONSTRAINT", {
      kind: "http",
      status: 409,
    });

    expect(getUserActionError(error)).toBe(
      "Thông tin tài khoản đã tồn tại. Vui lòng kiểm tra lại email và số điện thoại.",
    );
  });

  it("uses a safe fallback for an unknown code", () => {
    const error = new ApiError("DATABASE_UNIQUE_CONSTRAINT", {
      errorCode: "USER_NEW_CONFLICT",
      kind: "http",
      status: 409,
    });

    expect(getUserActionError(error)).toBe(
      "Dữ liệu đã thay đổi hoặc xung đột. Vui lòng tải lại và thử lại.",
    );
  });
});

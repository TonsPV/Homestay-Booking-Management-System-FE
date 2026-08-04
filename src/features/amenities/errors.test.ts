import { describe, expect, it } from "vitest";

import { ApiError } from "@/api/errors";

import { getAmenityActionError } from "./errors";

describe("getAmenityActionError", () => {
  it("explains how to resolve a stable in-use conflict", () => {
    const message = getAmenityActionError(
      new ApiError("Backend message", {
        errorCode: "AMENITY_IN_USE",
        kind: "http",
        status: 409,
      }),
    );

    expect(message).toContain("đang được sử dụng");
    expect(message).toContain("gỡ tiện nghi");
  });

  it("distinguishes a duplicate name from an in-use delete conflict", () => {
    expect(
      getAmenityActionError(
        new ApiError("Backend message", {
          errorCode: "AMENITY_NAME_ALREADY_EXISTS",
          kind: "http",
          status: 409,
        }),
      ),
    ).toContain("Tên tiện nghi đã tồn tại");
  });
});

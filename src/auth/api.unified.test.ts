import { configureAccessTokenProvider } from "@/api/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getMe, login } from "./api";
import type { LoginResponse } from "./types";

function successfulEnvelope(data: unknown) {
  return new Response(
    JSON.stringify({
      data,
      message: "OK",
      path: "/api/v1/auth",
      requestId: "req-auth",
      statusCode: 200,
      success: true,
      timestamp: "2026-07-26T00:00:00.000Z",
    }),
    { headers: { "Content-Type": "application/json" }, status: 200 },
  );
}

afterEach(() => {
  configureAccessTokenProvider(() => null);
  vi.unstubAllGlobals();
});

describe("unified login response normalization", () => {
  it("preserves role=ADMIN exactly when the canonical endpoint returns ADMIN", async () => {
    const adminLogin: LoginResponse = {
      accessToken: "admin-token",
      actorType: "user",
      expiresIn: 3600,
      tokenType: "Bearer",
      user: {
        createdAt: "2026-08-22T00:00:00.000Z",
        email: "admin@example.com",
        fullName: "Admin",
        id: "admin-1",
        phone: null,
        role: "ADMIN",
        status: "ACTIVE",
        updatedAt: "2026-08-22T00:00:00.000Z",
      },
    };
    const fetchMock = vi.fn().mockResolvedValue(successfulEnvelope(adminLogin));
    vi.stubGlobal("fetch", fetchMock);

    const response = await login({
      identifier: "admin@example.com",
      password: "secret",
    });

    expect(response.actorType).toBe("user");
    expect(response.user?.role).toBe("ADMIN");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      "/api/v1/auth/login",
    );
  });

  it("does NOT downgrade ADMIN to STAFF anywhere in the unified login path", async () => {
    const adminLogin: LoginResponse = {
      accessToken: "admin-token",
      actorType: "user",
      expiresIn: 3600,
      tokenType: "Bearer",
      user: {
        createdAt: "2026-08-22T00:00:00.000Z",
        email: "admin@example.com",
        fullName: "Admin",
        id: "admin-1",
        phone: null,
        role: "ADMIN",
        status: "ACTIVE",
        updatedAt: "2026-08-22T00:00:00.000Z",
      },
    };
    const fetchMock = vi.fn().mockResolvedValue(successfulEnvelope(adminLogin));
    vi.stubGlobal("fetch", fetchMock);

    const response = await login({
      identifier: "admin@example.com",
      password: "secret",
    });

    // role comes straight from response.user.role with no remapping
    expect(response.user?.role).toBe("ADMIN");
    expect(response.user?.role).not.toBe("STAFF");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("preserves role=ADMIN when /auth/me restores the session", async () => {
    const me = {
      actorType: "user",
      user: {
        createdAt: "2026-08-22T00:00:00.000Z",
        email: "admin@example.com",
        fullName: "Admin",
        id: "admin-1",
        phone: null,
        role: "ADMIN" as const,
        status: "ACTIVE" as const,
        updatedAt: "2026-08-22T00:00:00.000Z",
      },
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(successfulEnvelope(me)));
    configureAccessTokenProvider(() => "admin-token");

    const response = await getMe();

    expect(response.actorType).toBe("user");
    if (response.actorType === "user") {
      expect(response.user.role).toBe("ADMIN");
    }
  });
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/errors";

import { LoginForm } from "./LoginForm";

const useAuthMock = vi.hoisted(() => vi.fn());

vi.mock("../useAuth", () => ({
  useAuth: useAuthMock,
}));

function LocationProbe() {
  return <div>location:{useLocation().pathname}</div>;
}

function renderLoginForm({
  resolveRedirect,
}: {
  resolveRedirect?: Parameters<typeof LoginForm>[0]["resolveRedirect"];
} = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LoginForm
          alternateLabel="Khu vực vận hành"
          alternatePath="/management/login"
          description="Đăng nhập để tiếp tục."
          mode="user"
          redirectTo="/management"
          resolveRedirect={resolveRedirect}
          title="Đăng nhập"
        />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAuthMock.mockReset();
});

describe("LoginForm", () => {
  it("announces login errors through an alert live region", async () => {
    useAuthMock.mockReturnValue({
      loginCustomer: vi.fn(),
      loginUser: vi.fn(() =>
        Promise.reject(
          new ApiError("Invalid credentials.", {
            kind: "http",
            status: 401,
          }),
        ),
      ),
    });

    renderLoginForm();

    fireEvent.change(
      screen.getByRole("textbox", { name: /Email hoặc số điện thoại/ }),
      {
        target: { value: "admin@example.com" },
      },
    );
    fireEvent.change(screen.getByLabelText(/Mật khẩu/), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email, số điện thoại hoặc mật khẩu chưa chính xác.",
    );
  });

  it("exposes accessible labels and error descriptions", async () => {
    useAuthMock.mockReturnValue({
      loginCustomer: vi.fn(),
      loginUser: vi.fn(),
    });

    renderLoginForm();

    expect(
      screen.getByRole("textbox", { name: /Email hoặc số điện thoại/ }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Mật khẩu/)).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", {
        name: /Duy trì đăng nhập trên thiết bị này/,
      }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    const identifierError = await screen.findByText(
      "Vui lòng nhập email hoặc số điện thoại.",
    );
    const passwordError = screen.getByText("Vui lòng nhập mật khẩu.");

    expect(screen.getByLabelText(/Email hoặc số điện thoại/)).toHaveAttribute(
      "aria-describedby",
      identifierError.id,
    );
    expect(screen.getByLabelText(/Mật khẩu/)).toHaveAttribute(
      "aria-describedby",
      passwordError.id,
    );
  });

  it("shows a pending label, disables submit, and ignores duplicate submits", async () => {
    const pendingPromise = new Promise<never>(() => {});
    const loginUser = vi.fn(() => pendingPromise);

    useAuthMock.mockReturnValue({
      loginCustomer: vi.fn(),
      loginUser,
    });

    renderLoginForm();

    fireEvent.change(
      screen.getByRole("textbox", { name: /Email hoặc số điện thoại/ }),
      {
        target: { value: "admin@example.com" },
      },
    );
    fireEvent.change(screen.getByLabelText(/Mật khẩu/), {
      target: { value: "password123" },
    });

    const form = screen
      .getByRole("button", { name: "Đăng nhập" })
      .closest("form");
    expect(form).not.toBeNull();

    fireEvent.submit(form!);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Đang đăng nhập..." }),
      ).toBeDisabled();
    });

    fireEvent.submit(form!);
    expect(loginUser).toHaveBeenCalledTimes(1);
  });

  it("uses the authenticated principal to resolve the post-login destination", async () => {
    useAuthMock.mockReturnValue({
      loginCustomer: vi.fn(),
      loginUser: vi.fn(() =>
        Promise.resolve({
          actorType: "user" as const,
          createdAt: "2026-07-26T00:00:00.000Z",
          email: "staff@example.com",
          fullName: "Nhân viên",
          id: "2",
          phone: null,
          role: "STAFF" as const,
          status: "ACTIVE" as const,
          updatedAt: "2026-07-26T00:00:00.000Z",
        }),
      ),
    });

    renderLoginForm({
      resolveRedirect: (principal) =>
        principal.actorType === "user" && principal.role === "STAFF"
          ? "/staff/counter"
          : "/management",
    });

    fireEvent.change(
      screen.getByRole("textbox", { name: /Email hoặc số điện thoại/ }),
      { target: { value: "staff@example.com" } },
    );
    fireEvent.change(screen.getByLabelText(/Mật khẩu/), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(
      await screen.findByText("location:/staff/counter"),
    ).toBeInTheDocument();
  });
});

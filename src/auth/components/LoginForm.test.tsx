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
  locationState,
}: {
  locationState?: unknown;
} = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LoginForm
          description="Đăng nhập để tiếp tục với Homi Stay."
          locationState={locationState}
          title="Đăng nhập"
        />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function fillCredentials(identifier: string, password: string) {
  fireEvent.change(
    screen.getByRole("textbox", { name: /Email hoặc số điện thoại/ }),
    { target: { value: identifier } },
  );
  fireEvent.change(screen.getByLabelText(/Mật khẩu/), {
    target: { value: password },
  });
}

function customerPrincipal() {
  return {
    actorType: "customer" as const,
    createdAt: "2026-07-26T00:00:00.000Z",
    email: "guest@example.com",
    fullName: "Khách",
    id: "1",
    phone: null,
    status: "ACTIVE" as const,
    updatedAt: "2026-07-26T00:00:00.000Z",
  };
}

function userPrincipal(role: "STAFF" | "ADMIN") {
  return {
    actorType: "user" as const,
    createdAt: "2026-07-26T00:00:00.000Z",
    email: `${role.toLowerCase()}@example.com`,
    fullName: role === "STAFF" ? "Nhân viên" : "Quản trị viên",
    id: role === "STAFF" ? "2" : "3",
    phone: null,
    role,
    status: "ACTIVE" as const,
    updatedAt: "2026-07-26T00:00:00.000Z",
  };
}

beforeEach(() => {
  useAuthMock.mockReset();
});

describe("LoginForm", () => {
  it("submits credentials through the one canonical login action", async () => {
    const login = vi.fn(() => new Promise<never>(() => {}));
    useAuthMock.mockReturnValue({ login });

    renderLoginForm();
    fillCredentials("who@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    await waitFor(() => expect(login).toHaveBeenCalledOnce());
    expect(login).toHaveBeenCalledWith(
      { identifier: "who@example.com", password: "password123" },
      "session",
    );
  });

  it("announces one generic credential error without exposing account type", async () => {
    useAuthMock.mockReturnValue({
      login: vi.fn(() =>
        Promise.reject(
          new ApiError("Invalid credentials.", {
            kind: "http",
            status: 401,
          }),
        ),
      ),
    });

    renderLoginForm();
    fillCredentials("who@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email, số điện thoại hoặc mật khẩu chưa chính xác. Vui lòng kiểm tra và thử lại.",
    );
  });

  it("keeps one accessible form without an operations-login branch", async () => {
    useAuthMock.mockReturnValue({ login: vi.fn() });

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
    expect(
      screen.queryByRole("link", { name: "Đăng nhập vận hành" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: /loại tài khoản|vai trò/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Hoặc tiếp tục với Google")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Tiếp tục với Google" }),
    ).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Đăng nhập Google hiện chưa được bật.",
    );

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
    const login = vi.fn(() => pendingPromise);
    useAuthMock.mockReturnValue({ login });

    renderLoginForm();
    fillCredentials("who@example.com", "password123");

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
    expect(login).toHaveBeenCalledTimes(1);
  });

  it("redirects a customer principal to the public home page", async () => {
    useAuthMock.mockReturnValue({
      login: vi.fn(() => Promise.resolve(customerPrincipal())),
    });

    renderLoginForm();
    fillCredentials("guest@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(await screen.findByText("location:/")).toBeInTheDocument();
  });

  it("redirects a staff principal to the staff workspace", async () => {
    const login = vi.fn(() => Promise.resolve(userPrincipal("STAFF")));
    useAuthMock.mockReturnValue({ login });

    renderLoginForm();
    fillCredentials("staff@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(
      await screen.findByText("location:/staff/counter"),
    ).toBeInTheDocument();
    expect(login).toHaveBeenCalledWith(
      { identifier: "staff@example.com", password: "password123" },
      "session",
    );
  });

  it("redirects an admin principal to the management workspace", async () => {
    useAuthMock.mockReturnValue({
      login: vi.fn(() => Promise.resolve(userPrincipal("ADMIN"))),
    });

    renderLoginForm();
    fillCredentials("admin@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(
      await screen.findByText("location:/management/bookings"),
    ).toBeInTheDocument();
  });

  it("honors only a destination the authenticated principal may access", async () => {
    useAuthMock.mockReturnValue({
      login: vi.fn(() => Promise.resolve(customerPrincipal())),
    });

    renderLoginForm({ locationState: { returnTo: "/account" } });
    fillCredentials("guest@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(await screen.findByText("location:/account")).toBeInTheDocument();
  });

  it("falls back to the role workspace when returnTo is not allowed", async () => {
    useAuthMock.mockReturnValue({
      login: vi.fn(() => Promise.resolve(customerPrincipal())),
    });

    renderLoginForm({ locationState: { returnTo: "/management/users" } });
    fillCredentials("guest@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(await screen.findByText("location:/")).toBeInTheDocument();
  });
});

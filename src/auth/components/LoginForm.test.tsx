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
  actor = "customer",
  locationState,
}: {
  actor?: "customer" | "user";
  locationState?: unknown;
} = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LoginForm
          actor={actor}
          description="Truy cập tài khoản Homestay Green của bạn."
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

beforeEach(() => {
  useAuthMock.mockReset();
});

describe("LoginForm", () => {
  it("calls customer login with the entered credentials on the public surface", async () => {
    const loginCustomer = vi.fn(() => new Promise<never>(() => {}));
    useAuthMock.mockReturnValue({ loginCustomer });

    renderLoginForm();
    fillCredentials("who@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    await waitFor(() => expect(loginCustomer).toHaveBeenCalledOnce());
    expect(loginCustomer).toHaveBeenCalledWith(
      { identifier: "who@example.com", password: "password123" },
      "session",
    );
  })

  it("announces login errors through an alert live region", async () => {
    useAuthMock.mockReturnValue({
      loginCustomer: vi.fn(() =>
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
      "Email, số điện thoại hoặc mật khẩu chưa chính xác. Nếu đây là tài khoản nhân viên hoặc quản trị viên, hãy đăng nhập tại khu vực vận hành.",
    );
  });

  it("exposes accessible labels and error descriptions", async () => {
    useAuthMock.mockReturnValue({ loginCustomer: vi.fn() });

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
      screen.getByRole("link", { name: "Đăng nhập vận hành" }),
    ).toHaveAttribute("href", "/management/login");

    // The public form offers the right surface rather than asking people to
    // choose a technical actor type.
    expect(
      screen.queryByRole("combobox", { name: /loại tài khoản|vai trò/i }),
    ).not.toBeInTheDocument();

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
    const loginCustomer = vi.fn(() => pendingPromise);

    useAuthMock.mockReturnValue({ loginCustomer });

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
    expect(loginCustomer).toHaveBeenCalledTimes(1);
  });

  it("redirects a customer principal to the public home page", async () => {
    useAuthMock.mockReturnValue({
      loginCustomer: vi.fn(() =>
        Promise.resolve({
          actorType: "customer" as const,
          createdAt: "2026-07-26T00:00:00.000Z",
          email: "guest@example.com",
          fullName: "Khách",
          id: "1",
          phone: null,
          status: "ACTIVE" as const,
          updatedAt: "2026-07-26T00:00:00.000Z",
        }),
      ),
    });

    renderLoginForm();
    fillCredentials("guest@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(await screen.findByText("location:/")).toBeInTheDocument();
  });

  it("redirects a staff principal to the staff surface", async () => {
    const loginCustomer = vi.fn();
    const loginUser = vi.fn(() =>
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
    );
    useAuthMock.mockReturnValue({ loginCustomer, loginUser });

    renderLoginForm({ actor: "user" });
    fillCredentials("staff@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(
      await screen.findByText("location:/staff/counter"),
    ).toBeInTheDocument();
    expect(loginUser).toHaveBeenCalledWith(
      { identifier: "staff@example.com", password: "password123" },
      "session",
    );
    expect(loginCustomer).not.toHaveBeenCalled();
  });

  it("redirects an admin principal to the management dashboard", async () => {
    useAuthMock.mockReturnValue({
      loginUser: vi.fn(() =>
        Promise.resolve({
          actorType: "user" as const,
          createdAt: "2026-07-26T00:00:00.000Z",
          email: "admin@example.com",
          fullName: "Quản trị",
          id: "3",
          phone: null,
          role: "ADMIN" as const,
          status: "ACTIVE" as const,
          updatedAt: "2026-07-26T00:00:00.000Z",
        }),
      ),
    });

    renderLoginForm({ actor: "user" });
    fillCredentials("admin@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(
      await screen.findByText("location:/management/bookings"),
    ).toBeInTheDocument();
  });

  it("honors returnTo only when the principal is allowed to access it", async () => {
    useAuthMock.mockReturnValue({
      loginCustomer: vi.fn(() =>
        Promise.resolve({
          actorType: "customer" as const,
          createdAt: "2026-07-26T00:00:00.000Z",
          email: "guest@example.com",
          fullName: "Khách",
          id: "1",
          phone: null,
          status: "ACTIVE" as const,
          updatedAt: "2026-07-26T00:00:00.000Z",
        }),
      ),
    });

    renderLoginForm({ locationState: { returnTo: "/account" } });
    fillCredentials("guest@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(await screen.findByText("location:/account")).toBeInTheDocument();
  });

  it("falls back to the workspace home when returnTo is not accessible", async () => {
    useAuthMock.mockReturnValue({
      loginCustomer: vi.fn(() =>
        Promise.resolve({
          actorType: "customer" as const,
          createdAt: "2026-07-26T00:00:00.000Z",
          email: "guest@example.com",
          fullName: "Khách",
          id: "1",
          phone: null,
          status: "ACTIVE" as const,
          updatedAt: "2026-07-26T00:00:00.000Z",
        }),
      ),
    });

    // customer cannot land on a management deep link
    renderLoginForm({ locationState: { returnTo: "/management/users" } });
    fillCredentials("guest@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    await waitFor(() =>
      expect(screen.queryByText("location:/management/users")).toBeNull(),
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { ApiError } from "@/api/errors";

import type { ManagementBooking } from "../types";
import { ManagementBookingDetailPage } from "./ManagementBookingDetailPage";

const booking: ManagementBooking = {
  id: "42",
  bookingCode: "BK-2026-0042",
  customerId: "12",
  roomId: "8",
  createdByUserId: "7",
  checkInDate: "2026-08-01",
  checkOutDate: "2026-08-03",
  guestCount: 2,
  contactName: "Nguyễn Minh",
  contactPhone: "0901234567",
  contactEmail: "minh@example.com",
  totalAmount: "1800000.00",
  status: "PENDING_PAYMENT",
  paymentStatus: "UNPAID",
  paymentExpiresAt: "2026-07-25T08:00:00.000Z",
  customerNote: null,
  cancelledAt: null,
  cancellationReason: null,
  customer: {
    id: "12",
    fullName: "Nguyễn Minh",
    phone: "0901234567",
  },
  room: {
    id: "8",
    roomNumber: "A102",
    name: "Phòng hướng vườn",
    roomType: {
      id: "2",
      name: "Phòng đôi",
    },
  },
  createdByUser: {
    id: "7",
    fullName: "Lễ tân ca sáng",
  },
  createdAt: "2026-07-24T07:00:00.000Z",
  updatedAt: "2026-07-24T07:00:00.000Z",
  credentialCapabilities: {
    canSetInitialPassword: true,
    reasonCode: null,
  },
  transitionCapabilities: [
    { targetStatus: "PENDING_PAYMENT", allowed: true, reasonCode: null },
    { targetStatus: "CONFIRMED", allowed: true, reasonCode: null },
    {
      targetStatus: "CHECKED_IN",
      allowed: false,
      reasonCode: "BOOKING_TRANSITION_NOT_ALLOWED",
    },
    {
      targetStatus: "CHECKED_OUT",
      allowed: false,
      reasonCode: "BOOKING_TRANSITION_NOT_ALLOWED",
    },
    { targetStatus: "CANCELLED", allowed: true, reasonCode: null },
  ],
};

const defaultTransitionCapabilities = booking.transitionCapabilities.map(
  (capability) => ({ ...capability }),
);

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  refetch: vi.fn(),
  reset: vi.fn(),
  isReconciling: false,
  isStateUnknown: false,
  retryReconciliation: vi.fn(),
  updateError: null as ApiError | null,
}));

vi.mock("@/features/payments/components/ManagementBookingPaymentPanel", () => ({
  ManagementBookingPaymentPanel: () => (
    <section aria-label="Thanh toán booking" />
  ),
}));

vi.mock("@/features/chat/components/ChatPanel", () => ({
  ChatPanel: () => null,
}));

vi.mock("@/features/customers/components/InitialCustomerPasswordForm", () => ({
  InitialCustomerPasswordForm: ({
    onSuccess,
  }: {
    onSuccess: (customer: ManagementBooking["customer"]) => void;
  }) => (
    <section aria-label="Đặt mật khẩu ban đầu cho khách">
      <button onClick={() => onSuccess(booking.customer)} type="button">
        Hoàn tất đặt mật khẩu
      </button>
    </section>
  ),
}));

vi.mock("../hooks", () => ({
  useManagementBooking: () => ({
    data: booking,
    error: null,
    isError: false,
    isPending: false,
    refetch: mocks.refetch,
  }),
  useUpdateBookingStatus: () => ({
    error: mocks.updateError,
    isError: mocks.updateError !== null,
    isPending: false,
    isReconciling: mocks.isReconciling,
    isStateUnknown: mocks.isStateUnknown,
    mutate: mocks.mutate,
    reset: mocks.reset,
    retryReconciliation: mocks.retryReconciliation,
  }),
}));

describe("ManagementBookingDetailPage cancellation safety", () => {
  beforeEach(() => {
    booking.status = "PENDING_PAYMENT";
    booking.paymentStatus = "UNPAID";
    booking.transitionCapabilities = defaultTransitionCapabilities.map(
      (capability) => ({ ...capability }),
    );
    mocks.mutate.mockReset();
    mocks.refetch.mockReset();
    mocks.reset.mockReset();
    mocks.isReconciling = false;
    mocks.isStateUnknown = false;
    mocks.retryReconciliation.mockReset();
    mocks.updateError = null;
  });

  it("requires an explicit contextual confirmation before cancelling", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/management/bookings/42"]}>
        <Routes>
          <Route
            element={<ManagementBookingDetailPage />}
            path="/management/bookings/:bookingId"
          />
        </Routes>
      </MemoryRouter>,
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Trạng thái tiếp theo" }),
      "CANCELLED",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Lý do hủy" }),
      "Khách đổi kế hoạch",
    );
    await user.click(
      screen.getByRole("button", { name: "Cập nhật trạng thái" }),
    );

    expect(mocks.mutate).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog", {
      name: `Hủy booking ${booking.bookingCode}?`,
    });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(booking.contactName)).toBeInTheDocument();
    expect(
      within(dialog).getByText(/A102 · Phòng hướng vườn/),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Khách đổi kế hoạch")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Xác nhận hủy booking" }),
    );

    expect(mocks.mutate).toHaveBeenCalledWith(
      {
        id: booking.id,
        input: {
          status: "CANCELLED",
          cancellationReason: "Khách đổi kế hoạch",
        },
      },
      expect.objectContaining({
        onSuccess: expect.any(Function),
      }),
    );
  }, 15_000);

  it("lets staff open the initial-password task from a counter booking", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/management/bookings/42"]}>
        <Routes>
          <Route
            element={<ManagementBookingDetailPage />}
            path="/management/bookings/:bookingId"
          />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", { name: "Đặt mật khẩu ban đầu" }),
    );

    expect(
      screen.getByRole("region", {
        name: "Đặt mật khẩu ban đầu cho khách",
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Hoàn tất đặt mật khẩu" }),
    );
    expect(mocks.refetch).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("button", { name: "Đặt mật khẩu ban đầu" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("đã có thể đăng nhập");
  });

  it("submits a transition allowed by the Backend capability", async () => {
    const user = userEvent.setup();
    mocks.mutate.mockImplementation(
      (_variables, options?: { onSuccess?: () => void }) =>
        options?.onSuccess?.(),
    );
    render(
      <MemoryRouter initialEntries={["/management/bookings/42"]}>
        <Routes>
          <Route
            element={<ManagementBookingDetailPage />}
            path="/management/bookings/:bookingId"
          />
        </Routes>
      </MemoryRouter>,
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Trạng thái tiếp theo" }),
      "CONFIRMED",
    );
    await user.click(
      screen.getByRole("button", { name: "Cập nhật trạng thái" }),
    );

    expect(mocks.mutate).toHaveBeenCalledWith(
      {
        id: booking.id,
        input: {
          status: "CONFIRMED",
          cancellationReason: undefined,
        },
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(
      screen.getByText("Đã cập nhật trạng thái booking."),
    ).toBeInTheDocument();
  });

  it("hides unrelated transitions and explains a dynamically blocked action", () => {
    booking.transitionCapabilities = booking.transitionCapabilities.map(
      (capability) =>
        capability.targetStatus === "CONFIRMED"
          ? {
              ...capability,
              allowed: false,
              reasonCode: "BOOKING_CONFIRMATION_REQUIRES_PAYMENT",
            }
          : capability,
    );

    render(
      <MemoryRouter initialEntries={["/management/bookings/42"]}>
        <Routes>
          <Route
            element={<ManagementBookingDetailPage />}
            path="/management/bookings/:bookingId"
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("option", { name: /Đã trả phòng/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /Đã xác nhận — chưa khả dụng/ }),
    ).toBeDisabled();
    expect(
      screen.getByText(
        "Đặt phòng trực tuyến cần được thanh toán trước khi xác nhận.",
      ),
    ).toBeInTheDocument();
  });

  it("fails closed while a rolling Backend response has no transition capabilities", () => {
    const legacyBooking = booking as unknown as {
      transitionCapabilities?: ManagementBooking["transitionCapabilities"];
    };
    const originalCapabilities = legacyBooking.transitionCapabilities;
    delete legacyBooking.transitionCapabilities;

    try {
      render(
        <MemoryRouter initialEntries={["/management/bookings/42"]}>
          <Routes>
            <Route
              element={<ManagementBookingDetailPage />}
              path="/management/bookings/:bookingId"
            />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent(
        "Chức năng cập nhật trạng thái đang được đồng bộ.",
      );
    } finally {
      legacyBooking.transitionCapabilities = originalCapabilities;
    }
  });

  it("shows a safe fallback for an unsupported booking state transition", () => {
    mocks.updateError = new ApiError(
      "Khong the chuyen booking tu PENDING_PAYMENT sang CHECKED_OUT.",
      { kind: "http", status: 409 },
    );

    render(
      <MemoryRouter initialEntries={["/management/bookings/42"]}>
        <Routes>
          <Route
            element={<ManagementBookingDetailPage />}
            path="/management/bookings/:bookingId"
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Dữ liệu đã thay đổi hoặc xung đột. Vui lòng tải lại và thử lại.",
    );
  });

  it("keeps state-changing controls disabled during authoritative reconciliation", () => {
    mocks.isReconciling = true;

    render(
      <MemoryRouter initialEntries={["/management/bookings/42"]}>
        <Routes>
          <Route
            element={<ManagementBookingDetailPage />}
            path="/management/bookings/:bookingId"
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("combobox", { name: "Trạng thái tiếp theo" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Cập nhật trạng thái" }),
    ).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Đang kiểm tra trạng thái booking mới nhất",
    );
  });

  it("keeps every transition fail-closed when authoritative refresh fails", async () => {
    const user = userEvent.setup();
    mocks.isStateUnknown = true;
    const view = render(
      <MemoryRouter initialEntries={["/management/bookings/42"]}>
        <Routes>
          <Route
            element={<ManagementBookingDetailPage />}
            path="/management/bookings/:bookingId"
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("combobox", { name: "Trạng thái tiếp theo" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Cập nhật trạng thái" }),
    ).toBeDisabled();
    await user.click(
      screen.getByRole("button", { name: "Thử tải lại trạng thái" }),
    );
    expect(mocks.retryReconciliation).toHaveBeenCalledWith(booking.id);

    mocks.isStateUnknown = false;
    view.rerender(
      <MemoryRouter initialEntries={["/management/bookings/42"]}>
        <Routes>
          <Route
            element={<ManagementBookingDetailPage />}
            path="/management/bookings/:bookingId"
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("combobox", { name: "Trạng thái tiếp theo" }),
    ).toBeEnabled();
  });

  it("cannot retry cancellation from a stale open dialog", async () => {
    const user = userEvent.setup();
    const view = render(
      <MemoryRouter initialEntries={["/management/bookings/42"]}>
        <Routes>
          <Route
            element={<ManagementBookingDetailPage />}
            path="/management/bookings/:bookingId"
          />
        </Routes>
      </MemoryRouter>,
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Trạng thái tiếp theo" }),
      "CANCELLED",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Lý do hủy" }),
      "Khách đổi kế hoạch",
    );
    await user.click(
      screen.getByRole("button", { name: "Cập nhật trạng thái" }),
    );

    mocks.isStateUnknown = true;
    view.rerender(
      <MemoryRouter initialEntries={["/management/bookings/42"]}>
        <Routes>
          <Route
            element={<ManagementBookingDetailPage />}
            path="/management/bookings/:bookingId"
          />
        </Routes>
      </MemoryRouter>,
    );

    const confirm = screen.getByRole("button", {
      name: "Xác nhận hủy booking",
    });
    expect(confirm).toBeDisabled();
    await user.click(confirm);
    expect(mocks.mutate).not.toHaveBeenCalled();
  });

  it("closes stale cancel confirmation after authoritative cancellation", async () => {
    const user = userEvent.setup();
    const view = render(
      <MemoryRouter initialEntries={["/management/bookings/42"]}>
        <Routes>
          <Route
            element={<ManagementBookingDetailPage />}
            path="/management/bookings/:bookingId"
          />
        </Routes>
      </MemoryRouter>,
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Trạng thái tiếp theo" }),
      "CANCELLED",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Lý do hủy" }),
      "Khách đổi kế hoạch",
    );
    await user.click(
      screen.getByRole("button", { name: "Cập nhật trạng thái" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Xác nhận hủy booking" }),
    );
    expect(mocks.mutate).toHaveBeenCalledTimes(1);

    booking.status = "CANCELLED";
    booking.transitionCapabilities = booking.transitionCapabilities.map(
      (capability) =>
        capability.targetStatus === "CANCELLED"
          ? { ...capability, allowed: false }
          : capability,
    );
    view.rerender(
      <MemoryRouter initialEntries={["/management/bookings/42"]}>
        <Routes>
          <Route
            element={<ManagementBookingDetailPage />}
            path="/management/bookings/:bookingId"
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mocks.mutate).toHaveBeenCalledTimes(1);
  });
});

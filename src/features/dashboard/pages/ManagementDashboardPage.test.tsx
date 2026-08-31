import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DashboardSummary } from "../types";

import { ManagementDashboardPage } from "./ManagementDashboardPage";
import * as hooks from "../hooks";

vi.mock("../hooks", async (importOriginal) => {
  const original = await importOriginal<typeof hooks>();

  return { ...original, useDashboardSummary: vi.fn() };
});

const summary: DashboardSummary = {
  bookings: {
    cancelled: 2,
    checkedIn: 3,
    checkedOut: 5,
    confirmed: 4,
    pendingPayment: 1,
  },
  fromDate: "2026-08-01",
  generatedAt: "2026-08-22T07:30:00.000Z",
  occupancy: {
    occupancyRate: 62.5,
    roomNightsAvailable: 200,
    roomNightsReserved: 125,
  },
  payments: { refundPending: 0, requiresReview: 0 },
  revenue: { manual: 35_000_000, total: 84_000_000, vnpay: 49_000_000 },
  rooms: { cleaning: 2, maintenance: 1, occupied: 3, ready: 12 },
  toDate: "2026-08-22",
  totalRefunded: 0,
};

function renderPage(data?: DashboardSummary) {
  vi.mocked(hooks.useDashboardSummary).mockReturnValue({
    data,
    error: null,
    isError: false,
    isFetching: false,
    isPending: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof hooks.useDashboardSummary>);

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ManagementDashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ManagementDashboardPage information hierarchy", () => {
  it("leads with a hero Revenue KPI using size/weight, not semantic color", () => {
    renderPage(summary);

    expect(
      screen.getByRole("heading", { name: "Tổng quan vận hành" }),
    ).toBeInTheDocument();

    const revenue = screen.getByText("Doanh thu ghi nhận");
    const revenueValue = revenue.nextElementSibling;

    expect(revenueValue).toHaveTextContent(/84/);
    expect(revenueValue?.className).toContain("text-3xl");
    expect(revenueValue?.className).toContain("font-bold");
    // hero emphasis comes from size/weight/placement — not semantic tone
    expect(revenueValue?.className).toContain("text-ink");
    expect(revenueValue?.className).not.toContain("text-success");

    const supporting = screen.getByText("Booking tạo trong kỳ");
    const supportingValue = supporting.nextElementSibling;

    expect(supportingValue?.className).toMatch(/text-(xl|2xl)\b/);
    expect(revenueValue?.className).not.toBe(supportingValue?.className);
  });

  it("keeps an attention zone only when action is required", () => {
    const { container } = renderPage(summary);

    expect(
      screen.queryByText("Cần đối soát"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Chờ hoàn tiền"),
    ).not.toBeInTheDocument();
    expect(container.querySelector("[data-attention]")).toBeNull();
  });

  it("shows an attention zone with warning semantics when queues need action", () => {
    renderPage({
      ...summary,
      payments: { refundPending: 1, requiresReview: 2 },
    });

    expect(screen.getByText(/Cần đối soát/)).toBeInTheDocument();
    expect(screen.getByText(/Chờ hoàn tiền/)).toBeInTheDocument();
  });

  it("does not render the redundant quick-actions section", () => {
    renderPage(summary);

    expect(
      screen.queryByRole("heading", { name: "Thao tác nhanh" }),
    ).not.toBeInTheDocument();
  });

  it("keeps finance breakdown links instead of duplicating them at the bottom", () => {
    renderPage(summary);

    expect(
      screen.getByRole("link", { name: "Xem giao dịch" }),
    ).toHaveAttribute("href", "/management/payments");
    expect(screen.getByRole("link", { name: "Xem tất cả" })).toHaveAttribute(
      "href",
      "/management/bookings",
    );
  });

  it("refunded revenue uses a neutral treatment with an explicit label, not danger", () => {
    renderPage({ ...summary, totalRefunded: 5_000_000 });

    const refunded = screen.getByText("Đã hoàn tiền");
    const refundedValue = refunded.nextElementSibling;

    expect(refundedValue).toHaveTextContent(/5/);
    expect(refundedValue?.className).toContain("text-ink");
    expect(refundedValue?.className).not.toContain("text-danger");
  });

  it("shows one no-activity alert instead of stacking a warning alert", () => {
    renderPage({
      ...summary,
      bookings: {
        cancelled: 0,
        checkedIn: 0,
        checkedOut: 0,
        confirmed: 0,
        pendingPayment: 0,
      },
      occupancy: {
        occupancyRate: 0,
        roomNightsAvailable: 200,
        roomNightsReserved: 0,
      },
      revenue: { manual: 0, total: 0, vnpay: 0 },
      totalRefunded: 0,
    });

    expect(
      screen.getByText(/Không có phát sinh trong kỳ/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Cần đối soát/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Chờ hoàn tiền/)).not.toBeInTheDocument();
  });

  it("attention alert contains a single operational summary link set", () => {
    renderPage({
      ...summary,
      payments: { refundPending: 2, requiresReview: 3 },
    });

    expect(
      screen.getByText(/việc cần xử lý/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Cần đối soát · 3/ }),
    ).toHaveAttribute("href", "/management/payments?status=REQUIRES_REVIEW");
    expect(
      screen.getByRole("link", { name: /Chờ hoàn tiền · 2/ }),
    ).toHaveAttribute("href", "/management/payments?status=REFUND_PENDING");
  });

  it("zero attention counts still display a calm KPI instead of an alert", () => {
    renderPage(summary);

    expect(
      screen.queryByText(/việc cần xử lý/),
    ).not.toBeInTheDocument();
  });

  it("marks the data timestamp as a meta label near the bottom", () => {
    renderPage(summary);

    const meta = screen.getByText(/Dữ liệu được tổng hợp lúc/);

    expect(meta.className).toContain("text-xs");
    expect(meta.className).toContain("text-muted");
  });
});

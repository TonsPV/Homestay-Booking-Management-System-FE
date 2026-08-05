import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicRoom } from "@/features/rooms/types";

import { HomePage } from "./HomePage";

const useRoomsMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/rooms/hooks", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/rooms/hooks")>();
  return {
    ...actual,
    useRooms: (query: unknown) => useRoomsMock(query),
  };
});

function makeRoom(overrides: Partial<PublicRoom> = {}): PublicRoom {
  return {
    description: null,
    id: "1",
    images: [],
    name: "Phòng vườn",
    roomType: {
      amenities: [],
      basePrice: "500000",
      bedType: null,
      description: null,
      id: "10",
      maxGuests: 2,
      name: "Deluxe",
    },
    roomTypeId: "10",
    ...overrides,
  };
}

function mockRooms(overrides: Record<string, unknown> = {}) {
  useRoomsMock.mockReturnValue({
    data: undefined,
    error: null,
    isError: false,
    isPending: false,
    isSuccess: true,
    refetch: vi.fn(),
    ...overrides,
  });
}

function LocationProbe() {
  const location = useLocation();
  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
    </output>
  );
}

function renderHomePage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<HomePage />} path="/" />
          <Route element={<LocationProbe />} path="/rooms/search" />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("HomePage route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRooms();
  });

  it("renders the hero heading and primary CTAs with real routes", () => {
    renderHomePage();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Một nơi để thật sự nghỉ ngơi.",
    );

    expect(
      screen.getByRole("link", { name: "Tìm phòng trống" }),
    ).toHaveAttribute("href", "/rooms/search");
    expect(
      screen.getByRole("link", { name: "Khám phá không gian" }),
    ).toHaveAttribute("href", "/rooms");
  });

  it("validates that check-out must be after check-in", () => {
    renderHomePage();

    fireEvent.change(screen.getByLabelText(/Nhận phòng/), {
      target: { value: "2026-08-10" },
    });
    fireEvent.change(screen.getByLabelText(/Trả phòng/), {
      target: { value: "2026-08-10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Tìm phòng" }));

    expect(
      screen.getByText("Ngày trả phòng phải sau ngày nhận phòng."),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("location")).not.toBeInTheDocument();
  });

  it("requires check-in and check-out dates", () => {
    renderHomePage();

    fireEvent.click(screen.getByRole("button", { name: "Tìm phòng" }));

    expect(
      screen.getByText("Vui lòng chọn ngày nhận phòng."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Vui lòng chọn ngày trả phòng."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Nhận phòng/)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByLabelText(/Trả phòng/)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getAllByRole("alert")).toHaveLength(2);
  });

  it("focuses the first invalid search field on submit", () => {
    renderHomePage();

    fireEvent.click(screen.getByRole("button", { name: "Tìm phòng" }));

    expect(screen.getByLabelText(/Nhận phòng/)).toHaveFocus();
  });

  it("navigates to the search route with query params on valid submit", () => {
    renderHomePage();

    fireEvent.change(screen.getByLabelText(/Nhận phòng/), {
      target: { value: "2026-08-10" },
    });
    fireEvent.change(screen.getByLabelText(/Trả phòng/), {
      target: { value: "2026-08-12" },
    });
    fireEvent.change(screen.getByLabelText(/Số khách/), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Tìm phòng" }));

    expect(screen.getByTestId("location")).toHaveTextContent(
      "/rooms/search?checkIn=2026-08-10&checkOut=2026-08-12&guests=3",
    );
  });

  it("shows a loading skeleton for featured rooms", () => {
    mockRooms({ isPending: true, isSuccess: false });
    renderHomePage();

    expect(screen.getByTestId("featured-rooms-loading")).toBeInTheDocument();
  });

  it("shows an error state with retry for featured rooms", () => {
    const refetch = vi.fn();
    mockRooms({
      error: new Error("boom"),
      isError: true,
      isSuccess: false,
      refetch,
    });
    renderHomePage();

    fireEvent.click(screen.getByRole("button", { name: /Thử lại/ }));
    expect(refetch).toHaveBeenCalled();
  });

  it("shows an empty state when there are no rooms", () => {
    mockRooms({ data: { items: [], total: 0 } });
    renderHomePage();

    expect(screen.getByTestId("featured-rooms-empty")).toBeInTheDocument();
  });

  it("renders the public rooms supplied by the backend", () => {
    mockRooms({
      data: {
        items: [
          makeRoom({ id: "1", name: "Phòng vườn" }),
          makeRoom({ id: "2", name: "Phòng ban công" }),
        ],
        total: 3,
      },
    });
    renderHomePage();

    expect(screen.getByText("Phòng vườn")).toBeInTheDocument();
    expect(screen.getByText("Phòng ban công")).toBeInTheDocument();
  });

  it("renders the final CTA with real routes", () => {
    renderHomePage();

    expect(
      screen.getByRole("link", { name: "Bắt đầu tìm phòng" }),
    ).toHaveAttribute("href", "/rooms/search");
  });
});

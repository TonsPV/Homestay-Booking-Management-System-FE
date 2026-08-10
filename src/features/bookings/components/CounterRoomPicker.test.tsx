import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Room } from "@/features/rooms/types";

import { CounterRoomPicker } from "./CounterRoomPicker";

const listAvailableRoomsMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/rooms/hooks", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/rooms/hooks")>();
  return {
    ...actual,
    useAvailableRooms: (query: unknown) => {
      const result = listAvailableRoomsMock(query);
      return result;
    },
  };
});

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    createdAt: "2026-01-01T00:00:00.000Z",
    description: null,
    id: "1",
    images: [],
    name: "Phòng biển",
    roomNumber: "101",
    roomType: {
      amenities: [],
      basePrice: "500000",
      bedType: null,
      beds: [],
      description: null,
      id: "10",
      maxGuests: 2,
      name: "Deluxe",
    },
    roomTypeId: "10",
    status: "READY",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function mockQuery(overrides: Record<string, unknown> = {}) {
  listAvailableRoomsMock.mockReturnValue({
    data: undefined,
    error: null,
    isError: false,
    isFetching: false,
    isPending: false,
    isSuccess: false,
    refetch: vi.fn(),
    ...overrides,
  });
}

function renderPicker(
  props: Partial<Parameters<typeof CounterRoomPicker>[0]> = {},
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const onSelect = vi.fn();
  const onPageChange = vi.fn();
  const onAvailabilityStateChange = vi.fn();

  render(
    <QueryClientProvider client={client}>
      <CounterRoomPicker
        checkIn="2026-08-10"
        checkOut="2026-08-12"
        guests={2}
        onAvailabilityStateChange={onAvailabilityStateChange}
        onPageChange={onPageChange}
        onSelect={onSelect}
        page={1}
        {...props}
      />
    </QueryClientProvider>,
  );

  return { onAvailabilityStateChange, onPageChange, onSelect };
}

beforeEach(() => {
  listAvailableRoomsMock.mockReset();
});

describe("CounterRoomPicker", () => {
  it("shows idle guidance when criteria are missing", () => {
    mockQuery();

    renderPicker({ checkIn: undefined });

    expect(
      screen.getByText(/Chọn ngày nhận, ngày trả và số khách/i),
    ).toBeInTheDocument();
  });

  it("shows loading state while searching", () => {
    mockQuery({ isFetching: true, isPending: true });

    renderPicker();

    expect(screen.getByText(/Đang tìm phòng trống/i)).toBeInTheDocument();
  });

  it("shows error state with retry", () => {
    const refetch = vi.fn();
    mockQuery({ error: new Error("Lỗi mạng"), isError: true, refetch });

    renderPicker();

    expect(screen.getByText(/Không thể tải nội dung/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Thử lại/i }));
    expect(refetch).toHaveBeenCalled();
  });

  it("shows empty state when no rooms are available", () => {
    mockQuery({
      data: { items: [], pagination: undefined },
      isSuccess: true,
    });

    renderPicker();

    expect(screen.getByText(/Hết phòng trống/i)).toBeInTheDocument();
  });

  it("renders rooms and calls onSelect when a room is clicked", async () => {
    const room = makeRoom();
    mockQuery({
      data: { items: [room], pagination: undefined },
      isSuccess: true,
    });

    const { onSelect } = renderPicker();

    const option = await screen.findByRole("radio", {
      name: /Phòng 101/i,
    });
    expect(option).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText(/500\.000 ₫/)).toBeInTheDocument();
    expect(screen.queryByText(/1\.000\.000 ₫/)).not.toBeInTheDocument();

    fireEvent.click(option);
    expect(onSelect).toHaveBeenCalledWith(room);
  });

  it("marks the selected room as checked", () => {
    const room = makeRoom();
    mockQuery({
      data: { items: [room], pagination: undefined },
      isSuccess: true,
    });

    renderPicker({ selectedRoomId: "1" });

    expect(screen.getByRole("radio", { name: /Phòng 101/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("renders pagination controls when multiple pages exist", async () => {
    mockQuery({
      data: {
        items: [makeRoom()],
        pagination: { limit: 12, page: 1, total: 30, totalPages: 3 },
      },
      isSuccess: true,
    });

    const { onPageChange } = renderPicker();

    const next = await screen.findByRole("button", { name: /Xem thêm phòng/i });
    fireEvent.click(next);
    await waitFor(() => expect(onPageChange).toHaveBeenCalledWith(2));
  });

  it("does not run the query when check-out is not after check-in", () => {
    mockQuery();

    renderPicker({ checkIn: "2026-08-12", checkOut: "2026-08-10" });

    expect(
      screen.getByText(/Chọn ngày nhận, ngày trả và số khách/i),
    ).toBeInTheDocument();
    expect(listAvailableRoomsMock).toHaveBeenCalledWith(undefined);
  });

  it("does not run the query when guests is below 1", () => {
    mockQuery();

    renderPicker({ guests: 0 });

    expect(
      screen.getByText(/Chọn ngày nhận, ngày trả và số khách/i),
    ).toBeInTheDocument();
    expect(listAvailableRoomsMock).toHaveBeenCalledWith(undefined);
  });

  it("passes a full query with all criteria to the availability hook", () => {
    mockQuery();

    renderPicker({ page: 2 });

    expect(listAvailableRoomsMock).toHaveBeenCalledWith({
      checkIn: "2026-08-10",
      checkOut: "2026-08-12",
      guests: 2,
      limit: 12,
      page: 2,
    });
  });

  it("reports availability state to the parent", async () => {
    mockQuery({
      data: { items: [makeRoom()], pagination: undefined },
      isSuccess: true,
    });

    const { onAvailabilityStateChange } = renderPicker();

    await waitFor(() =>
      expect(onAvailabilityStateChange).toHaveBeenCalledWith({
        isFetching: false,
        isSuccess: true,
      }),
    );
  });

  it("reports a fetching state while refetching", async () => {
    mockQuery({
      data: { items: [makeRoom()], pagination: undefined },
      isFetching: true,
      isSuccess: true,
    });

    const { onAvailabilityStateChange } = renderPicker();

    await waitFor(() =>
      expect(onAvailabilityStateChange).toHaveBeenCalledWith({
        isFetching: true,
        isSuccess: true,
      }),
    );
  });
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicRoom, SearchRoomsQuery } from "../types";

const roomSearchMock = vi.hoisted(() => vi.fn());

vi.mock("../hooks", () => ({
  useRoomSearch: (query: SearchRoomsQuery | undefined) => roomSearchMock(query),
}));

vi.mock("@/features/room-types", () => ({
  useRoomTypeOptions: () => ({
    data: [{ id: "10", name: "Deluxe" }],
    isError: false,
    isPending: false,
  }),
}));

vi.mock("@/features/amenities/hooks", () => ({
  useAmenityOptions: () => ({
    data: [{ id: "7", name: "Wi-Fi" }],
    isError: false,
  }),
}));

import { RoomSearchPage } from "./RoomSearchPage";

function roomFixture(): PublicRoom {
  return {
    description: "Phòng có ban công",
    id: "1",
    images: [],
    name: "Phòng hướng vườn",
    roomType: {
      amenities: [{ description: null, id: "7", name: "Wi-Fi" }],
      basePrice: "500000.00",
      bedType: "1 giường đôi",
      description: null,
      id: "10",
      maxGuests: 2,
      name: "Deluxe",
    },
    roomTypeId: "10",
  };
}

function LocationProbe() {
  return <output data-testid="location">{useLocation().search}</output>;
}

beforeEach(() => {
  roomSearchMock.mockReset();
  const data = {
    items: [roomFixture()],
    pagination: { limit: 12, page: 1, total: 1, totalPages: 1 },
  };
  roomSearchMock.mockImplementation((query: SearchRoomsQuery | undefined) => ({
    data: query ? data : undefined,
    error: null,
    isError: false,
    isFetching: false,
    isPending: false,
    isSuccess: query !== undefined,
    refetch: vi.fn(),
  }));
});

describe("RoomSearchPage", () => {
  it("reveals filters and results only after the primary search", async () => {
    render(
      <MemoryRouter initialEntries={["/rooms/search"]}>
        <RoomSearchPage />
      </MemoryRouter>,
    );

    expect(screen.queryByLabelText("Loại phòng")).not.toBeInTheDocument();
    expect(
      screen.getByText(/Chọn ngày lưu trú để khám phá/i),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Nhận phòng/), {
      target: { value: "2026-08-10" },
    });
    fireEvent.change(screen.getByLabelText(/Trả phòng/), {
      target: { value: "2026-08-12" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Tìm phòng/i }));

    expect(await screen.findByLabelText("Loại phòng")).toBeInTheDocument();
    expect(await screen.findByText("Phòng hướng vườn")).toBeInTheDocument();
    expect(roomSearchMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        checkIn: "2026-08-10",
        checkOut: "2026-08-12",
        guests: 1,
      }),
    );
  });

  it("updates advanced filters automatically and preserves them in the URL", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter
        initialEntries={[
          "/rooms/search?checkIn=2026-08-10&checkOut=2026-08-12&guests=2",
        ]}
      >
        <LocationProbe />
        <RoomSearchPage />
      </MemoryRouter>,
    );

    await user.selectOptions(screen.getByLabelText("Loại phòng"), "10");

    await waitFor(
      () =>
        expect(screen.getByTestId("location")).toHaveTextContent(
          /roomTypeId=10/,
        ),
      { timeout: 1_500 },
    );
    expect(roomSearchMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ roomTypeId: "10" }),
    );
  });

  it("offers direct booking with the active search criteria", async () => {
    const onBookRoom = vi.fn();
    render(
      <MemoryRouter
        initialEntries={[
          "/rooms/search?checkIn=2026-08-10&checkOut=2026-08-12&guests=2",
        ]}
      >
        <RoomSearchPage onBookRoom={onBookRoom} />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Đặt ngay" }));

    expect(onBookRoom).toHaveBeenCalledWith(
      expect.objectContaining({ id: "1" }),
      expect.objectContaining({
        checkIn: "2026-08-10",
        checkOut: "2026-08-12",
      }),
    );
  });
});

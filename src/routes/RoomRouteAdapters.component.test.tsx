import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import type { Room, SearchRoomsQuery } from "@/features/rooms/types";

const room: Room = {
  createdAt: "2026-07-26T00:00:00.000Z",
  description: "Phòng smoke",
  id: "42",
  images: [],
  name: "Phòng Biển",
  roomNumber: "B42",
  roomType: {
    amenities: [],
    basePrice: "1200000.00",
    bedType: null,
    description: "Loại phòng smoke",
    id: "7",
    maxGuests: 3,
    name: "Deluxe",
  },
  roomTypeId: "7",
  status: "READY",
  updatedAt: "2026-07-26T00:00:00.000Z",
};

const search: SearchRoomsQuery = {
  checkIn: "2026-08-10",
  checkOut: "2026-08-12",
  guests: 3,
};

vi.mock("@/features/rooms/pages/PublicRoomsPage", () => ({
  PublicRoomsPage: ({
    onViewRoom,
  }: {
    onViewRoom?: (roomId: string) => void;
  }) => (
    <button onClick={() => onViewRoom?.(room.id)} type="button">
      Mở từ danh sách
    </button>
  ),
}));

vi.mock("@/features/rooms/pages/RoomSearchPage", () => ({
  RoomSearchPage: ({
    onViewRoom,
  }: {
    onViewRoom?: (roomId: string, criteria: SearchRoomsQuery) => void;
  }) => (
    <button onClick={() => onViewRoom?.(room.id, search)} type="button">
      Mở từ tìm kiếm
    </button>
  ),
}));

vi.mock("@/features/rooms/pages/PublicRoomDetailPage", () => ({
  PublicRoomDetailPage: ({
    onBook,
  }: {
    onBook?: (selectedRoom: Room) => void;
  }) => (
    <button onClick={() => onBook?.(room)} type="button">
      Chọn phòng này
    </button>
  ),
}));

vi.mock("@/features/rooms/pages/ManagementRoomDetailPage", () => ({
  ManagementRoomDetailPage: () => null,
}));

vi.mock("@/features/rooms/pages/ManagementRoomsPage", () => ({
  ManagementRoomsPage: () => null,
}));

import {
  PublicRoomDetailRoute,
  PublicRoomsRoute,
  RoomSearchRoute,
} from "./RoomRouteAdapters";

function BookingLocationProbe() {
  const location = useLocation();
  const state = location.state as {
    room?: { id?: string };
    search?: SearchRoomsQuery;
  } | null;

  return (
    <div>
      <span>path:{location.pathname}</span>
      <span>query:{location.search}</span>
      <span>room:{state?.room?.id ?? "none"}</span>
      <span>guests:{state?.search?.guests ?? "none"}</span>
    </div>
  );
}

function renderFlow(
  initialEntry:
    | string
    | {
        pathname: string;
        state?: { search: SearchRoomsQuery };
      },
) {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<PublicRoomsRoute />} path="/rooms" />
        <Route element={<RoomSearchRoute />} path="/rooms/search" />
        <Route element={<PublicRoomDetailRoute />} path="/rooms/:roomId" />
        <Route
          element={<BookingLocationProbe />}
          path="/bookings/new/:roomId"
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Public room booking navigation", () => {
  it("opens a room from /rooms and reaches an empty booking form route", () => {
    renderFlow("/rooms");

    fireEvent.click(screen.getByRole("button", { name: "Mở từ danh sách" }));
    fireEvent.click(screen.getByRole("button", { name: "Chọn phòng này" }));

    expect(screen.getByText("path:/bookings/new/42")).toBeInTheDocument();
    expect(screen.getByText("query:")).toBeInTheDocument();
    expect(screen.getByText("room:42")).toBeInTheDocument();
    expect(screen.getByText("guests:none")).toBeInTheDocument();
  });

  it("preserves search criteria from /rooms/search", () => {
    renderFlow("/rooms/search");

    fireEvent.click(screen.getByRole("button", { name: "Mở từ tìm kiếm" }));
    fireEvent.click(screen.getByRole("button", { name: "Chọn phòng này" }));

    expect(screen.getByText("path:/bookings/new/42")).toBeInTheDocument();
    expect(
      screen.getByText(
        "query:?checkIn=2026-08-10&checkOut=2026-08-12&guests=3",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("guests:3")).toBeInTheDocument();
  });

  it("opens a direct room URL and reaches an empty booking form route", () => {
    renderFlow("/rooms/42");

    fireEvent.click(screen.getByRole("button", { name: "Chọn phòng này" }));

    expect(screen.getByText("path:/bookings/new/42")).toBeInTheDocument();
    expect(screen.getByText("query:")).toBeInTheDocument();
    expect(screen.getByText("room:42")).toBeInTheDocument();
  });
});

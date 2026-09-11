import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import type { PublicRoom, SearchRoomsQuery } from "@/features/rooms/types";

const room: PublicRoom = {
  description: "Phòng smoke",
  id: "42",
  images: [],
  name: "Phòng Biển",
  roomType: {
    amenities: [],
    basePrice: "1200000.00",
    bedType: null,
    beds: [],
    description: "Loại phòng smoke",
    id: "7",
    maxGuests: 3,
    name: "Deluxe",
  },
  roomTypeId: "7",
};

const search: SearchRoomsQuery = {
  checkIn: "2026-08-10",
  checkOut: "2026-08-12",
  guests: 3,
};

vi.mock("@/features/rooms/pages/PublicRoomsPage", () => ({
  PublicRoomsPage: ({
    onBookRoom,
    onViewRoom,
  }: {
    onBookRoom?: (room: PublicRoom, criteria: SearchRoomsQuery) => void;
    onViewRoom?: (roomId: string, criteria?: SearchRoomsQuery) => void;
  }) => (
    <div>
      <button onClick={() => onViewRoom?.(room.id)} type="button">
        Mở từ danh mục
      </button>
      <button onClick={() => onViewRoom?.(room.id, search)} type="button">
        Mở từ kết quả
      </button>
      <button onClick={() => onBookRoom?.(room, search)} type="button">
        Đặt từ kết quả
      </button>
    </div>
  ),
}));

vi.mock("@/features/rooms/pages/PublicRoomDetailPage", () => ({
  PublicRoomDetailPage: ({
    onBook,
    initialStay,
  }: {
    onBook?: (
      selectedRoom: PublicRoom,
      stay: { checkIn: string; checkOut: string; guests: number },
    ) => void;
    initialStay?: { checkIn: string; checkOut: string; guests: number };
  }) => (
    <button
      onClick={() =>
        onBook?.(room, initialStay ?? {
          checkIn: "",
          checkOut: "",
          guests: Number.NaN,
        })
      }
      type="button"
    >
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

function CurrentLocationProbe() {
  const location = useLocation();

  return (
    <output>
      current-path:{location.pathname}
      current-query:{location.search}
    </output>
  );
}

function renderFlow(initialEntry: string) {
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
      <CurrentLocationProbe />
    </MemoryRouter>,
  );
}

describe("Public room booking navigation", () => {
  it("opens a room from the directory and reaches an empty booking form route", () => {
    renderFlow("/rooms");

    fireEvent.click(screen.getByRole("button", { name: "Mở từ danh mục" }));
    fireEvent.click(screen.getByRole("button", { name: "Chọn phòng này" }));

    expect(screen.getByText("path:/bookings/new/42")).toBeInTheDocument();
    expect(screen.getByText("query:")).toBeInTheDocument();
    expect(screen.getByText("room:42")).toBeInTheDocument();
    expect(screen.getByText("guests:none")).toBeInTheDocument();
  });

  it("preserves an applied stay when opening a detail page from /rooms", () => {
    renderFlow("/rooms");

    fireEvent.click(screen.getByRole("button", { name: "Mở từ kết quả" }));

    expect(screen.getByText(/current-path:/)).toHaveTextContent(
      "current-path:/rooms/42",
    );
    expect(screen.getByText(/current-query:/)).toHaveTextContent(
      "current-query:?checkIn=2026-08-10&checkOut=2026-08-12&guests=3",
    );
    fireEvent.click(screen.getByRole("button", { name: "Chọn phòng này" }));

    expect(screen.getByText("path:/bookings/new/42")).toBeInTheDocument();
    expect(
      screen.getByText(
        "query:?checkIn=2026-08-10&checkOut=2026-08-12&guests=3",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("guests:3")).toBeInTheDocument();
  });

  it("redirects the legacy search route to /rooms while preserving criteria", () => {
    renderFlow("/rooms/search?checkIn=2026-08-10&checkOut=2026-08-12&guests=3");

    expect(screen.getByText(/current-path:/)).toHaveTextContent(
      "current-path:/rooms",
    );
    expect(screen.getByText(/current-query:/)).toHaveTextContent(
      "current-query:?checkIn=2026-08-10&checkOut=2026-08-12&guests=3",
    );
  });

  it("opens a direct room URL and reaches an empty booking form route", () => {
    renderFlow("/rooms/42");

    fireEvent.click(screen.getByRole("button", { name: "Chọn phòng này" }));

    expect(screen.getByText("path:/bookings/new/42")).toBeInTheDocument();
    expect(screen.getByText("query:")).toBeInTheDocument();
    expect(screen.getByText("room:42")).toBeInTheDocument();
  });

  it("keeps a valid shared stay from the room URL through booking", () => {
    renderFlow("/rooms/42?checkIn=2026-08-10&checkOut=2026-08-12&guests=3");

    fireEvent.click(screen.getByRole("button", { name: "Chọn phòng này" }));

    expect(
      screen.getByText(
        "query:?checkIn=2026-08-10&checkOut=2026-08-12&guests=3",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("guests:3")).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { PublicRoom } from "../types";
import { PublicRoomDetailPage } from "./PublicRoomDetailPage";

const room = vi.hoisted(
  () =>
    ({
      description: "Không gian yên tĩnh.",
      id: "5",
      images: [],
      name: "Phòng hướng vườn",
      roomType: {
        amenities: [],
        basePrice: "900000.00",
        bedType: null,
        beds: [],
        description: null,
        id: "2",
        maxGuests: 2,
        name: "Phòng đôi",
      },
      roomTypeId: "2",
    }) satisfies PublicRoom,
);

vi.mock("../hooks", () => ({
  useRoom: vi.fn(() => ({
    data: room,
    error: null,
    isError: false,
    isPending: false,
    refetch: vi.fn(),
  })),
}));

describe("PublicRoomDetailPage", () => {
  it("shows public room details without exposing management-only room numbers", () => {
    render(<PublicRoomDetailPage roomId={room.id} />);

    expect(
      screen.getByRole("heading", { name: room.name }),
    ).toBeInTheDocument();
    expect(screen.getByText(room.roomType.name)).toBeInTheDocument();
    expect(screen.queryByText(/A101/)).not.toBeInTheDocument();
    expect(screen.getByText("2 khách")).toBeInTheDocument();
  });
});

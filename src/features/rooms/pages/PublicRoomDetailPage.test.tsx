import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Room } from "../types";
import { PublicRoomDetailPage } from "./PublicRoomDetailPage";

const room = vi.hoisted(
  () =>
    ({
      createdAt: "2026-07-20T01:00:00.000Z",
      description: "Không gian yên tĩnh.",
      id: "5",
      images: [],
      name: "Phòng hướng vườn",
      roomNumber: "A101",
      roomType: {
        amenities: [],
        basePrice: "900000.00",
        bedType: null,
        description: null,
        id: "2",
        maxGuests: 2,
        name: "Phòng đôi",
      },
      roomTypeId: "2",
      status: "READY",
      updatedAt: "2026-07-24T01:00:00.000Z",
    }) satisfies Room,
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
  it("shows the room number once without a duplicate code field", () => {
    render(<PublicRoomDetailPage roomId={room.id} />);

    expect(
      screen.getByRole("heading", { name: room.name }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(`Phòng ${room.roomNumber}`)).toHaveLength(1);
    expect(screen.queryByText("Mã phòng")).not.toBeInTheDocument();
    expect(screen.getByText("2 khách")).toBeInTheDocument();
  });
});

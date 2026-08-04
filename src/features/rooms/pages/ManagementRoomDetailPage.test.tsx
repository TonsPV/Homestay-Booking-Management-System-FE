import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Room } from "../types";
import { ManagementRoomDetailPage } from "./ManagementRoomDetailPage";

const room = vi.hoisted(
  () =>
    ({
      id: "5",
      roomTypeId: "2",
      roomNumber: "A101",
      name: "Phòng hướng vườn",
      description: "Không gian yên tĩnh.",
      status: "READY",
      roomType: {
        amenities: [],
        id: "2",
        name: "Phòng đôi",
        description: null,
        maxGuests: 2,
        basePrice: "900000.00",
        bedType: null,
      },
      images: [],
      createdAt: "2026-07-20T01:00:00.000Z",
      updatedAt: "2026-07-24T01:00:00.000Z",
    }) satisfies Room,
);

vi.mock("@/features/room-types", () => ({
  useRoomTypeOptions: vi.fn(() => ({
    data: [],
    error: null,
    isError: false,
    isFetching: false,
    isPending: false,
    refetch: vi.fn(),
  })),
}));

vi.mock("../hooks", () => ({
  useBlockRoomDates: vi.fn(() => ({
    error: null,
    isPending: false,
    mutateAsync: vi.fn(),
  })),
  useDeleteRoom: vi.fn(() => ({
    error: null,
    isPending: false,
    mutate: vi.fn(),
  })),
  useManagementRoom: vi.fn(() => ({
    data: room,
    error: null,
    isError: false,
    isPending: false,
    refetch: vi.fn(),
  })),
  useRoomCalendar: vi.fn(() => ({
    data: [],
    error: null,
    isError: false,
    isFetching: false,
    isPending: false,
    refetch: vi.fn(),
  })),
  useUnblockRoomDates: vi.fn(() => ({
    error: null,
    isPending: false,
    mutateAsync: vi.fn(),
  })),
  useUpdateRoom: vi.fn(() => ({
    error: null,
    isPending: false,
    mutateAsync: vi.fn(),
  })),
  useUpdateRoomStatus: vi.fn(() => ({
    error: null,
    isPending: false,
    mutate: vi.fn(),
  })),
}));

describe("ManagementRoomDetailPage permissions", () => {
  it("lets staff inspect and update status without exposing admin writes", () => {
    render(<ManagementRoomDetailPage role="STAFF" roomId={room.id} />);

    expect(
      screen.getByRole("heading", {
        name: `${room.roomNumber} · ${room.name}`,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", {
        name: `Trạng thái phòng ${room.roomNumber}`,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Chỉnh sửa" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Quản lý ảnh" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Xóa phòng" }),
    ).not.toBeInTheDocument();
  });

  it("opens image management through navigation instead of replacing the detail content", () => {
    const onManageImages = vi.fn();

    render(
      <ManagementRoomDetailPage
        onManageImages={onManageImages}
        role="ADMIN"
        roomId={room.id}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Quản lý ảnh" }));

    expect(onManageImages).toHaveBeenCalledOnce();
    expect(
      screen.getByRole("heading", {
        name: `${room.roomNumber} · ${room.name}`,
      }),
    ).toBeInTheDocument();
  });
});

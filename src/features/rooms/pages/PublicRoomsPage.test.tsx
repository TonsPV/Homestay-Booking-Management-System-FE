import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/errors";

import type { PublicRoom, SearchRoomsQuery } from "../types";

const roomsMock = vi.hoisted(() => vi.fn());
const roomSearchMock = vi.hoisted(() => vi.fn());

vi.mock("../hooks", () => ({
  useRooms: (query: unknown, enabled?: boolean) => roomsMock(query, enabled),
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

import { PublicRoomsPage } from "./PublicRoomsPage";

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
      beds: [],
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
  const data = {
    items: [roomFixture()],
    pagination: { limit: 12, page: 1, total: 1, totalPages: 1 },
  };

  roomsMock.mockReset();
  roomSearchMock.mockReset();
  roomsMock.mockReturnValue({
    data,
    error: null,
    isError: false,
    isFetching: false,
    isPending: false,
    refetch: vi.fn(),
  });
  roomSearchMock.mockImplementation((query: SearchRoomsQuery | undefined) => ({
    data: query ? data : undefined,
    error: null,
    isError: false,
    isFetching: false,
    isPending: false,
    refetch: vi.fn(),
  }));
});

describe("PublicRoomsPage", () => {
  it("shows the public room directory before a stay is selected", () => {
    render(
      <MemoryRouter initialEntries={["/rooms"]}>
        <PublicRoomsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Phòng hướng vườn")).toBeInTheDocument();
    expect(screen.getByText("Khám phá các phòng hiện có")).toBeInTheDocument();
    expect(screen.getByText("Tiện ích mong muốn")).toBeInTheDocument();
    expect(screen.getByLabelText("Wi-Fi")).toBeInTheDocument();
    expect(screen.queryByText("Còn phòng")).not.toBeInTheDocument();
    expect(roomsMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ limit: 12, page: 1 }),
      true,
    );
    expect(roomSearchMock).toHaveBeenLastCalledWith(undefined);
  });

  it("applies amenity filters to the public directory", async () => {
    render(
      <MemoryRouter initialEntries={["/rooms"]}>
        <LocationProbe />
        <PublicRoomsPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText("Wi-Fi"));
    fireEvent.click(
      screen.getByRole("button", { name: "Áp dụng danh mục" }),
    );

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "?amenityIds=7",
      ),
    );
    expect(roomsMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ amenityIds: ["7"], limit: 12, page: 1 }),
      true,
    );
    expect(
      screen.getByRole("button", { name: /Xóa bộ lọc Wi-Fi/ }),
    ).toBeInTheDocument();
  });

  it("searches availability from the same route and keeps the active stay for booking", () => {
    const onBookRoom = vi.fn();

    render(
      <MemoryRouter
        initialEntries={[
          "/rooms?checkIn=2099-08-10&checkOut=2099-08-12&guests=2",
        ]}
      >
        <PublicRoomsPage onBookRoom={onBookRoom} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Phòng phù hợp với kỳ lưu trú")).toBeInTheDocument();
    expect(
      screen.getByText("Kỳ lưu trú: 10/08/2099 – 12/08/2099 · 2 khách"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Backend/i)).not.toBeInTheDocument();
    expect(screen.getByText("Còn phòng")).toBeInTheDocument();
    expect(roomSearchMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        checkIn: "2099-08-10",
        checkOut: "2099-08-12",
        guests: 2,
      }),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Tiếp tục đặt phòng" }),
    );

    expect(onBookRoom).toHaveBeenCalledWith(
      expect.objectContaining({ id: "1" }),
      expect.objectContaining({
        checkIn: "2099-08-10",
        checkOut: "2099-08-12",
        guests: 2,
      }),
    );
  });

  it("writes a valid stay to /rooms without changing route", async () => {
    render(
      <MemoryRouter initialEntries={["/rooms"]}>
        <LocationProbe />
        <PublicRoomsPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/Nhận phòng/), {
      target: { value: "2099-08-10" },
    });
    fireEvent.change(screen.getByLabelText(/Trả phòng/), {
      target: { value: "2099-08-12" },
    });
    fireEvent.click(screen.getByLabelText("Wi-Fi"));
    fireEvent.click(
      screen.getByRole("button", { name: "Tìm phòng trống" }),
    );

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "?checkIn=2099-08-10&checkOut=2099-08-12&guests=1&amenityIds=7",
      ),
    );
  });

  it("returns to the directory after clearing a selected stay", () => {
    render(
      <MemoryRouter
        initialEntries={[
          "/rooms?checkIn=2099-08-10&checkOut=2099-08-12&guests=2",
        ]}
      >
        <PublicRoomsPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Xóa ngày" }));

    expect(screen.getByText("Khám phá các phòng hiện có")).toBeInTheDocument();
    expect(screen.queryByText("Còn phòng")).not.toBeInTheDocument();
  });

  it("uses a neutral message when no room matches the selected stay", () => {
    roomSearchMock.mockReturnValue({
      data: {
        items: [],
        pagination: { limit: 12, page: 1, total: 0, totalPages: 0 },
      },
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter
        initialEntries={[
          "/rooms?checkIn=2099-08-10&checkOut=2099-08-12&guests=2",
        ]}
      >
        <PublicRoomsPage />
      </MemoryRouter>,
    );

    const summary = screen.getByText("Chưa có phòng phù hợp cho kỳ đã chọn");
    expect(summary).not.toHaveClass("text-success");
    expect(screen.queryByText(/0 phòng còn trống/i)).not.toBeInTheDocument();
    expect(screen.getByText("Chưa tìm thấy phòng phù hợp")).toBeInTheDocument();
  });

  it("explains an empty directory result and lets the guest clear filters", () => {
    roomsMock.mockReturnValue({
      data: {
        items: [],
        pagination: { limit: 12, page: 1, total: 0, totalPages: 0 },
      },
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/rooms?amenityIds=7"]}>
        <LocationProbe />
        <PublicRoomsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Không tìm thấy phòng phù hợp")).toBeInTheDocument();
    expect(
      screen.getByText(/Không có phòng nào đáp ứng các điều kiện đang chọn/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Xóa bộ lọc" }));

    expect(screen.getByTestId("location")).toHaveTextContent("");
  });

  it("offers to clear an amenity filter when the server has not been updated", () => {
    roomsMock.mockReturnValue({
      data: undefined,
      error: new ApiError("Validation failed", {
        errorCode: "COMMON_VALIDATION_FAILED",
        kind: "http",
        serverMessage: "property amenityIds should not exist",
        status: 400,
      }),
      isError: true,
      isFetching: false,
      isPending: false,
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/rooms?amenityIds=7"]}>
        <LocationProbe />
        <PublicRoomsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Chưa thể lọc theo tiện ích")).toBeInTheDocument();
    expect(
      screen.getByText(/Máy chủ chưa hỗ trợ lọc theo tiện ích/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Xóa bộ lọc" }));

    expect(screen.getByTestId("location")).toHaveTextContent("");
  });
});

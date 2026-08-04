import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/errors";

import type { Room } from "../types";
import { RoomImageManager } from "./RoomImageManager";

const room = {
  id: "5",
  roomTypeId: "2",
  roomNumber: "A101",
  name: "Phòng hướng vườn",
  description: null,
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
} satisfies Room;

let currentRoom: Room = room;

const mocks = vi.hoisted(() => ({
  createError: null as Error | null,
  createImage: vi.fn(),
  createObjectUrl: vi.fn(),
  deleteImage: vi.fn(),
  revokeObjectUrl: vi.fn(),
  setCover: vi.fn(),
}));

vi.mock("../hooks", () => ({
  useCreateRoomImage: vi.fn(() => ({
    error: mocks.createError,
    isPending: false,
    mutateAsync: mocks.createImage,
  })),
  useDeleteRoomImage: vi.fn(() => ({
    error: null,
    isPending: false,
    mutate: mocks.deleteImage,
    variables: undefined,
  })),
  useManagementRoom: vi.fn(() => ({
    data: currentRoom,
    error: null,
    isError: false,
    isPending: false,
    refetch: vi.fn(),
  })),
  useSetRoomCoverImage: vi.fn(() => ({
    error: null,
    isPending: false,
    mutate: mocks.setCover,
    variables: undefined,
  })),
}));

beforeEach(() => {
  currentRoom = room;
  mocks.createError = null;
  mocks.createImage.mockReset().mockResolvedValue(undefined);
  mocks.createObjectUrl.mockReset().mockReturnValue("blob:room-preview");
  mocks.deleteImage.mockReset();
  mocks.revokeObjectUrl.mockReset();
  mocks.setCover.mockReset();
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: mocks.createObjectUrl,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: mocks.revokeObjectUrl,
  });
});

afterEach(() => {
  Reflect.deleteProperty(URL, "createObjectURL");
  Reflect.deleteProperty(URL, "revokeObjectURL");
});

describe("RoomImageManager", () => {
  it("previews and submits a selected image, then clears the form", async () => {
    const user = userEvent.setup();
    const file = new File(["room-image"], "garden-room.png", {
      type: "image/png",
    });

    render(<RoomImageManager roomId={room.id} />);

    const input = screen.getByLabelText(/Tệp ảnh/);
    await user.upload(input, file);

    expect(mocks.createObjectUrl).toHaveBeenCalledWith(file);
    expect(
      screen.getByRole("img", { name: "Xem trước ảnh đã chọn" }),
    ).toHaveAttribute("src", "blob:room-preview");
    expect(screen.getByText(file.name)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tải ảnh lên" }));

    expect(mocks.createImage).toHaveBeenCalledWith({
      input: {
        file,
        isCover: false,
        sortOrder: 0,
      },
      roomId: room.id,
    });
    await waitFor(() => {
      expect(screen.queryByText(file.name)).not.toBeInTheDocument();
      expect(mocks.revokeObjectUrl).toHaveBeenCalledWith("blob:room-preview");
    });
    expect(screen.getByText("Đã tải ảnh lên phòng.")).toBeInTheDocument();
  });

  it("rejects an unsupported file before calling the API mutation", async () => {
    const file = new File(["<svg/>"], "room.svg", {
      type: "image/svg+xml",
    });

    render(<RoomImageManager roomId={room.id} />);

    fireEvent.change(screen.getByLabelText(/Tệp ảnh/), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Tải ảnh lên" }));

    expect(
      await screen.findByText("Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP."),
    ).toBeInTheDocument();
    expect(mocks.createImage).not.toHaveBeenCalled();
  });

  it("preserves the selected file when the server rejects the upload", async () => {
    const user = userEvent.setup();
    const file = new File(["room-image"], "garden-room.png", {
      type: "image/png",
    });
    mocks.createImage.mockRejectedValueOnce(new Error("Upload conflict"));

    render(<RoomImageManager roomId={room.id} />);

    await user.upload(screen.getByLabelText(/Tệp ảnh/), file);
    await user.click(screen.getByRole("button", { name: "Tải ảnh lên" }));

    expect(await screen.findByText(file.name)).toBeInTheDocument();
  });

  it("renders a normalized server upload error", () => {
    mocks.createError = new ApiError("UNSUPPORTED_MEDIA_TYPE", {
      kind: "http",
      requestId: "req-upload-internal",
      status: 415,
    });

    render(<RoomImageManager roomId={room.id} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Định dạng tệp chưa được hỗ trợ. Vui lòng chọn tệp khác.",
    );
    expect(screen.getByRole("alert")).not.toHaveTextContent(
      "UNSUPPORTED_MEDIA_TYPE",
    );
    expect(screen.getByRole("alert")).not.toHaveTextContent(
      "req-upload-internal",
    );
  });

  it("confirms when a cover image is updated", async () => {
    const user = userEvent.setup();
    currentRoom = {
      ...room,
      images: [
        {
          id: "71",
          imageUrl: "/uploads/rooms/room.jpg",
          isCover: false,
          sortOrder: 1,
        },
      ],
    };
    mocks.setCover.mockImplementation(
      (_imageId, options?: { onSuccess?: () => void }) =>
        options?.onSuccess?.(),
    );

    render(<RoomImageManager roomId={room.id} />);

    await user.click(screen.getByRole("button", { name: "Đặt làm bìa" }));

    expect(mocks.setCover).toHaveBeenCalledWith(
      "71",
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(screen.getByText("Đã đặt ảnh bìa mới.")).toBeInTheDocument();
  });
});

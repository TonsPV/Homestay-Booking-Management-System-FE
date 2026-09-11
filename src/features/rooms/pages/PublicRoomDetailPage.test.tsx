import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type { PublicRoom } from "../types";
import { PublicRoomDetailPage } from "./PublicRoomDetailPage";

const room = vi.hoisted(
  () =>
    ({
      description:
        "Không gian yên tĩnh với tầm nhìn hướng vườn. Phòng rộng rãi, phù hợp cho kỳ nghỉ đôi.",
      id: "5",
      images: [
        { id: "img-1", imageUrl: "/media/cover.webp", isCover: true, sortOrder: 0 },
        { id: "img-2", imageUrl: "/media/second.webp", isCover: false, sortOrder: 1 },
        { id: "img-3", imageUrl: "/media/third.webp", isCover: false, sortOrder: 2 },
      ],
      name: "Phòng hướng vườn",
      roomType: {
        amenities: [
          { id: "a1", name: "Wi-Fi", description: "Wi-Fi miễn phí toàn khu." },
          { id: "a2", name: "Điều hòa", description: null },
          { id: "a3", name: "Bàn làm việc", description: "Bàn rộng, có ghế tựa." },
        ],
        basePrice: "900000.00",
        bedType: null,
        beds: [{ quantity: 1, type: "DOUBLE" }],
        description: "Loại phòng tiêu chuẩn cho hai khách.",
        id: "2",
        maxGuests: 2,
        name: "Phòng đôi",
      },
      roomTypeId: "2",
    }) satisfies PublicRoom,
);

const longAmenityRoom = vi.hoisted(
  () =>
    ({
      ...room,
      roomType: {
        ...room.roomType,
        amenities: Array.from({ length: 10 }, (_, index) => ({
          id: `bulk-${index}`,
          name: `Tiện nghi ${index + 1}`,
          description: null,
        })),
      },
    }) satisfies PublicRoom,
);

const mocks = vi.hoisted(() => ({
  useRoom: vi.fn(),
}));

vi.mock("../hooks", () => ({
  useRoom: mocks.useRoom,
}));

function renderPage(
  props: Partial<Parameters<typeof PublicRoomDetailPage>[0]> = {},
  initialEntry = "/rooms/5",
) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<div>Trang danh sách</div>} path="/rooms" />
        <Route element={<div>Trang tìm kiếm</div>} path="/rooms" />
        <Route
          element={
            <PublicRoomDetailPage
              onBack={props.onBack}
              onBook={props.onBook}
              onFindOtherRooms={props.onFindOtherRooms}
              onStayChange={props.onStayChange}
              roomId="5"
            />
          }
          path="/rooms/:roomId"
        />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  // jsdom does not implement scrollIntoView; the page uses it to focus the
  // stay section when the primary action is pressed without a valid stay.
  Element.prototype.scrollIntoView = vi.fn();
  mocks.useRoom.mockReturnValue({
    data: room,
    error: null,
    isError: false,
    isPending: false,
    refetch: vi.fn(),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("PublicRoomDetailPage public information", () => {
  it("shows public room details without exposing management-only room numbers", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { name: room.name }),
    ).toBeInTheDocument();
    expect(screen.getByText(room.roomType.name)).toBeInTheDocument();
    expect(screen.queryByText(/A101/)).not.toBeInTheDocument();
    expect(screen.getAllByText("1 Giường đôi").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Tối đa 2 khách/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Giá cơ sở").length).toBeGreaterThan(0);
    expect(screen.queryByText(/chỉ còn|bữa sáng miễn phí/i)).not.toBeInTheDocument();
  });

  it("keeps the page usable with missing optional data", () => {
    mocks.useRoom.mockReturnValue({
      data: {
        ...room,
        description: null,
        roomType: {
          ...room.roomType,
          bedType: null,
          beds: [],
          description: null,
        },
      },
      error: null,
      isError: false,
      isPending: false,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText("Thông tin mô tả đang được cập nhật.")).toBeInTheDocument();
    expect(screen.queryByText("Giường")).not.toBeInTheDocument();
  });
});

describe("CLIENT-01 gallery viewer", () => {
  it("moves the selected gallery image into the main position before opening it", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole("button", {
        name: `Chọn ảnh 2 của ${room.name}`,
      }),
    );
    expect(
      screen.getByRole("button", {
        name: `Chọn ảnh 2 của ${room.name}`,
      }),
    ).toHaveAttribute("aria-pressed", "true");

    await user.click(
      screen.getByRole("button", { name: `Mở bộ xem ảnh ${room.name}` }),
    );
    expect(screen.getByRole("dialog")).toHaveTextContent("2 / 3");
  });

  it("opens from the main image, navigates with arrows and keyboard, closes with Escape returning focus", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: `Mở bộ xem ảnh ${room.name}` }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-label", `Xem ảnh ${room.name}`);
    expect(dialog).toHaveTextContent("1 / 3");

    await user.click(screen.getByRole("button", { name: "Ảnh sau" }));
    expect(dialog).toHaveTextContent("2 / 3");

    fireEvent.keyDown(dialog, { key: "ArrowLeft" });
    expect(dialog).toHaveTextContent("1 / 3");

    const viewerThumb = within(dialog).getByRole("button", {
      name: "Xem ảnh 3 của Phòng hướng vườn",
    });
    await user.click(viewerThumb);
    expect(dialog).toHaveTextContent("3 / 3");

    fireEvent.keyDown(dialog, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: `Mở bộ xem ảnh ${room.name}` }),
    ).toHaveFocus();
  });

  it("toggles zoom on the large image", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: `Mở bộ xem ảnh ${room.name}` }));
    const zoomButton = screen.getByRole("button", { name: "Phóng to ảnh" });
    await user.click(zoomButton);
    expect(
      screen.getByRole("button", { name: "Thu nhỏ ảnh" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Thu nhỏ ảnh" }));
    expect(
      screen.getByRole("button", { name: "Phóng to ảnh" }),
    ).toBeInTheDocument();
  });
});

describe("CLIENT-02 section navigation", () => {
  it("offers in-page anchors to every populated section", () => {
    renderPage();

    for (const label of [
      "Tổng quan",
      "Hình ảnh",
      "Chỗ ngủ",
      "Tiện nghi",
      "Chọn kỳ lưu trú",
    ]) {
      expect(
        screen.getByRole("link", { name: label }),
      ).toHaveAttribute("href", expect.stringMatching(/^#/));
    }
    expect(
      screen.queryByRole("link", { name: "Chính sách" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Vị trí" }),
    ).not.toBeInTheDocument();
  });
});

describe("CLIENT-03 description and amenities", () => {
  it("expands a long public description without hiding the full text permanently", async () => {
    const description = "Không gian riêng tư cho kỳ nghỉ. ".repeat(40);
    mocks.useRoom.mockReturnValue({
      data: { ...room, description },
      error: null,
      isError: false,
      isPending: false,
      refetch: vi.fn(),
    });
    const user = userEvent.setup();
    renderPage();

    const expand = screen.getByRole("button", {
      name: "Đọc thêm về căn phòng",
    });
    expect(expand).toHaveAttribute("aria-expanded", "false");
    await user.click(expand);

    expect(
      screen.getByRole("button", { name: "Thu gọn mô tả" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen
        .getByRole("heading", { name: "Về căn phòng này" })
        .closest("section"),
    ).toHaveTextContent(description.trim());
  });

  it("shows amenity names with descriptions from the backend contract", () => {
    renderPage();

    expect(screen.getAllByText("Wi-Fi").length).toBeGreaterThan(0);
    expect(screen.getByText("Wi-Fi miễn phí toàn khu.")).toBeInTheDocument();
    expect(screen.getAllByText("Điều hòa").length).toBeGreaterThan(0);
  });

  it("filters amenities by name and reports an empty result for long lists", async () => {
    mocks.useRoom.mockReturnValue({
      data: longAmenityRoom,
      error: null,
      isError: false,
      isPending: false,
      refetch: vi.fn(),
    });
    const user = userEvent.setup();
    renderPage();

    const amenitySection = screen
      .getByRole("heading", { name: "Tiện nghi dành cho kỳ nghỉ" })
      .closest("section");
    expect(amenitySection).not.toBeNull();
    const amenities = within(amenitySection!);

    expect(amenities.getByText("Tiện nghi 1")).toBeInTheDocument();
    expect(amenities.queryByText("Tiện nghi 10")).not.toBeInTheDocument();

    const searchBox = amenities.getByRole("searchbox", { name: "Tìm tiện nghi" });
    await user.type(searchBox, "10");
    expect(amenities.getByText("Tiện nghi 10")).toBeInTheDocument();
    expect(amenities.queryByText(/^Tiện nghi 1$/)).not.toBeInTheDocument();

    await user.clear(searchBox);
    await user.type(searchBox, "zzz");
    expect(
      amenities.getByText(/Không có tiện nghi nào khớp/),
    ).toBeInTheDocument();
  });
});

describe("CLIENT-04/05 stay picker and primary action", () => {
  it("keeps the primary action on the stay section while inputs are incomplete", async () => {
    const onBook = vi.fn();
    const user = userEvent.setup();
    renderPage({ onBook });

    expect(screen.getByText("Chưa giữ chỗ. Phòng sẽ được kiểm tra lại khi bạn gửi yêu cầu đặt.")).toBeInTheDocument();

    // Aside + mobile bar expose the same action; use the first (aside).
    const primaryButtons = screen.getAllByRole("button", {
      name: "Chọn ngày lưu trú",
    });
    await user.click(primaryButtons[0]!);

    expect(onBook).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Ngày nhận phòng")).toBeInTheDocument();
  });

  it("computes nights on date-only boundaries and forwards room plus stay to booking", async () => {
    const onBook = vi.fn();
    const user = userEvent.setup();
    renderPage({ onBook });

    await user.type(screen.getByLabelText("Ngày nhận phòng"), "2026-09-20");
    await user.type(screen.getByLabelText("Ngày trả phòng"), "2026-09-23");
    const stayAlerts = screen.getAllByText(/Kỳ lưu trú/);
    expect(stayAlerts[0]).toHaveTextContent("3 đêm");
    expect(stayAlerts[0]).toHaveTextContent("20/09/2026");
    expect(stayAlerts[0]).toHaveTextContent("23/09/2026");

    const continueButtons = screen.getAllByRole("button", {
      name: "Tiếp tục đặt phòng",
    });
    await user.click(continueButtons[0]!);

    expect(onBook).toHaveBeenCalledWith(room, {
      checkIn: "2026-09-20",
      checkOut: "2026-09-23",
      guests: 1,
    });
  });

  it("blocks guests above the published capacity and validates dates", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("Ngày nhận phòng"), "2026-09-20");
    await user.type(screen.getByLabelText("Ngày trả phòng"), "2026-09-18");
    expect(screen.getByText("Ngày trả phòng phải sau ngày nhận phòng.")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Số khách"));
    await user.type(screen.getByLabelText("Số khách"), "5");
    expect(
      screen.getByText("Phòng này chứa tối đa 2 khách."),
    ).toBeInTheDocument();
  });

  it("adjusts guests with the steppers without exceeding capacity", async () => {
    const user = userEvent.setup();
    renderPage();

    const increase = screen.getByRole("button", { name: "Tăng số khách" });
    const decrease = screen.getByRole("button", { name: "Giảm số khách" });
    expect(decrease).toBeDisabled();

    await user.click(increase);
    expect(screen.getByLabelText("Số khách")).toHaveValue(2);
    expect(increase).toBeDisabled();

    await user.click(decrease);
    expect(screen.getByLabelText("Số khách")).toHaveValue(1);
  });
});

describe("CLIENT-06 share", () => {
  it("falls back to the clipboard and reports the copied state", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const clipboardDescriptor = Object.getOwnPropertyDescriptor(
      Navigator.prototype,
      "clipboard",
    );
    // userEvent.setup() installs its own clipboard stub; set up user FIRST,
    // then replace the clipboard so the page observes our spy.
    const user = userEvent.setup();
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    // jsdom may expose share as an own prototype property; hide it so the
    // page takes the clipboard fallback.
    Object.defineProperty(Object.getPrototypeOf(window.navigator), "share", {
      configurable: true,
      value: undefined,
    });
    renderPage();

    await user.click(screen.getByRole("button", { name: "Chia sẻ" }));

    await waitFor(() => {
      expect(screen.getByText("Đã sao chép liên kết")).toBeInTheDocument();
    });
    const shareUrl = writeText.mock.calls[0][0] as string;
    expect(shareUrl).toContain("/rooms/5");
    expect(shareUrl).not.toContain("token");

    delete (Object.getPrototypeOf(window.navigator) as unknown as Record<string, unknown>).share;
    if (clipboardDescriptor) {
      Object.defineProperty(
        window.navigator,
        "clipboard",
        clipboardDescriptor,
      );
    }
  });

  it("reports an error state when copying fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    const clipboardDescriptor = Object.getOwnPropertyDescriptor(
      Navigator.prototype,
      "clipboard",
    );
    const user = userEvent.setup();
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    Object.defineProperty(Object.getPrototypeOf(window.navigator), "share", {
      configurable: true,
      value: undefined,
    });
    renderPage();

    await user.click(screen.getByRole("button", { name: "Chia sẻ" }));

    await waitFor(() => {
      expect(screen.getByText(/Không sao chép được/)).toBeInTheDocument();
    });

    delete (Object.getPrototypeOf(window.navigator) as unknown as Record<string, unknown>).share;
    if (clipboardDescriptor) {
      Object.defineProperty(
        window.navigator,
        "clipboard",
        clipboardDescriptor,
      );
    }
  });
});

describe("CLIENT-07 back and find other rooms", () => {
  it("offers find-other-rooms preserving the stay context", async () => {
    const onFindOtherRooms = vi.fn();
    const user = userEvent.setup();
    renderPage({ onFindOtherRooms });

    await user.click(screen.getByRole("button", { name: "Tìm phòng khác" }));

    expect(onFindOtherRooms).toHaveBeenCalledWith({
      checkIn: "",
      checkOut: "",
      guests: 1,
    });
  });
});

describe("CLIENT-08 mobile action bar", () => {
  it("shares the same stay state as the main form", () => {
    renderPage();

    // Aside + mobile bar both render the state-derived primary action.
    const bars = screen.getAllByRole("button", { name: "Chọn ngày lưu trú" });
    expect(bars.length).toBeGreaterThanOrEqual(2);
  });
});

describe("client boundary protections", () => {
  it("does not render management-only data on the client page", () => {
    renderPage();

    expect(screen.queryByText(/calendarSummary/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/BK-\d+/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Lý do khóa/)).not.toBeInTheDocument();
  });
});

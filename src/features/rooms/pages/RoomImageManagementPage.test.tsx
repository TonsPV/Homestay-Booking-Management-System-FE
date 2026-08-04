import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../components/RoomImageManager", () => ({
  RoomImageManager: ({ roomId }: { roomId: string }) => (
    <div>image-manager:{roomId}</div>
  ),
}));

import { RoomImageManagementPage } from "./RoomImageManagementPage";

describe("RoomImageManagementPage", () => {
  it("renders a dedicated image workspace and returns to room detail", () => {
    const onBack = vi.fn();

    render(<RoomImageManagementPage onBack={onBack} roomId="31" />);

    expect(
      screen.getByRole("heading", { name: "Thư viện ảnh" }),
    ).toBeInTheDocument();
    expect(screen.getByText("image-manager:31")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Quay lại chi tiết phòng" }),
    );
    expect(onBack).toHaveBeenCalledOnce();
  });
});

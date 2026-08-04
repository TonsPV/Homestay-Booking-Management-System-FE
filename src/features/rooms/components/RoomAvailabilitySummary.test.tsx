import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RoomAvailabilitySummary } from "./RoomAvailabilitySummary";

describe("RoomAvailabilitySummary", () => {
  it("separates a reserved stay from the operational room status", () => {
    render(
      <RoomAvailabilitySummary
        summary={{
          asOfDate: "2026-08-02",
          todayStatus: "RESERVED",
          nextEvent: {
            booking: {
              id: "42",
              bookingCode: "BK-ROOM-101",
              checkInDate: "2026-08-02",
              checkOutDate: "2026-08-04",
            },
            reason: null,
            status: "RESERVED",
            stayDate: "2026-08-02",
          },
        }}
      />,
    );

    expect(screen.getByText("Đã có booking hôm nay")).toBeInTheDocument();
    expect(screen.getByText(/BK-ROOM-101/)).toHaveTextContent(
      "02/08/2026–04/08/2026",
    );
  });

  it("shows an explicit fail-closed state while the calendar contract is missing", () => {
    render(<RoomAvailabilitySummary />);

    expect(screen.getByText("Chưa đồng bộ")).toBeInTheDocument();
    expect(screen.getByText(/tải lại trang/)).toBeInTheDocument();
  });
});

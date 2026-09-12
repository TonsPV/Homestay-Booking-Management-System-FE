import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ScrollToTop } from "./RouteSupport";
import { getPageTitle } from "./route-titles";

describe("route title metadata", () => {
  it("distinguishes the dashboard, counter, and booking detail routes", () => {
    expect(getPageTitle("/login")).toBe("Đăng nhập");
    expect(getPageTitle("/management/login")).toBe("Đăng nhập");
    expect(getPageTitle("/management/dashboard")).toBe("Tổng quan vận hành");
    expect(getPageTitle("/staff/counter")).toBe("Tạo booking tại quầy");
    expect(getPageTitle("/management/bookings/42")).toBe("Chi tiết booking");
    expect(getPageTitle("/management/rooms/31/images")).toBe(
      "Quản lý ảnh phòng",
    );
  });
});

describe("ScrollToTop", () => {
  beforeEach(() => {
    vi.stubGlobal("scrollTo", vi.fn());
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      }),
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    document.title = "";
    vi.unstubAllGlobals();
  });

  it("updates the document title and focuses the main landmark", async () => {
    const { getByRole } = render(
      <MemoryRouter initialEntries={["/rooms"]}>
        <ScrollToTop />
        <main id="main-content" tabIndex={-1}>
          Nội dung
        </main>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(document.title).toBe("Khám phá phòng | Homi Stay");
      expect(getByRole("main")).toHaveFocus();
    });
    expect(window.scrollTo).toHaveBeenCalledWith({
      behavior: "auto",
      left: 0,
      top: 0,
    });
  });
});

const APP_NAME = "Homestay Green";

export function getPageTitle(pathname: string) {
  if (pathname === "/") return "Trang chủ";
  if (pathname === "/login") {
    return "Đăng nhập";
  }
  if (pathname === "/management/login") return "Đăng nhập vận hành";
  if (pathname === "/register") return "Đăng ký tài khoản";
  if (pathname === "/account") return "Hồ sơ của tôi";
  if (pathname === "/rooms/search" || pathname === "/rooms") {
    return "Khám phá phòng";
  }
  if (/^\/rooms\/[^/]+$/.test(pathname)) return "Chi tiết phòng";
  if (pathname === "/room-types") return "Loại phòng";
  if (/^\/room-types\/[^/]+$/.test(pathname)) return "Chi tiết loại phòng";
  if (pathname === "/bookings") return "Booking của tôi";
  if (/^\/bookings\/new\/[^/]+$/.test(pathname)) return "Tạo booking";
  if (/^\/bookings\/[^/]+$/.test(pathname)) return "Chi tiết booking";
  if (pathname === "/payments/vnpay/return") return "Kết quả thanh toán";
  if (pathname === "/management") {
    return "Quản lý booking";
  }
  /* DORMANT (Phase 0): /management/dashboard is unrouted while the Backend
   * lacks the summary endpoint; the dashboard branch is kept for the
   * possible capability return. */
  if (pathname === "/management/dashboard") {
    return "Tổng quan vận hành";
  }
  if (pathname === "/staff/counter") {
    return "Tạo booking tại quầy";
  }
  if (pathname.startsWith("/staff/rooms")) {
    return pathname === "/staff/rooms" ? "Phòng tại quầy" : "Chi tiết phòng";
  }
  if (pathname.startsWith("/staff/bookings")) {
    return pathname === "/staff/bookings"
      ? "Booking tại quầy"
      : "Chi tiết booking";
  }
  if (pathname.startsWith("/staff/payments")) return "Thanh toán tại quầy";
  if (/^\/management\/rooms\/new$/.test(pathname)) {
    return "Tạo phòng mới";
  }
  if (/^\/management\/rooms\/[^/]+\/edit$/.test(pathname)) {
    return "Chỉnh sửa phòng";
  }
  if (pathname.startsWith("/management/rooms")) {
    if (/^\/management\/rooms\/[^/]+\/images$/.test(pathname)) {
      return "Quản lý ảnh phòng";
    }
    return pathname === "/management/rooms"
      ? "Quản lý phòng"
      : "Chi tiết phòng";
  }
  if (pathname.startsWith("/management/room-types")) {
    return "Quản lý loại phòng";
  }
  if (pathname.startsWith("/management/amenities")) {
    return "Quản lý tiện nghi";
  }
  if (pathname.startsWith("/management/bookings")) {
    return pathname === "/management/bookings"
      ? "Quản lý booking"
      : "Chi tiết booking";
  }
  if (pathname.startsWith("/management/payments")) {
    if (/^\/management\/payments\/[^/]+$/.test(pathname)) {
      return "Chi tiết thanh toán";
    }
    return "Quản lý thanh toán";
  }
  if (pathname.startsWith("/management/users")) {
    return "Quản lý nhân viên";
  }
  if (pathname.startsWith("/management/customers")) {
    return "Quản lý khách hàng";
  }
  if (pathname === "/forbidden") return "Không có quyền truy cập";

  return "Không tìm thấy trang";
}

export function getDocumentTitle(pathname: string) {
  return `${getPageTitle(pathname)} | ${APP_NAME}`;
}

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { LoadingState } from '@/shared/components/Feedback'

const APP_NAME = 'Homestay Green'

function getPageTitle(pathname: string) {
  if (pathname === '/') {
    return 'Trang chủ'
  }

  if (pathname === '/login') {
    return 'Đăng nhập khách hàng'
  }

  if (pathname === '/register') {
    return 'Đăng ký tài khoản'
  }

  if (pathname === '/management/login') {
    return 'Đăng nhập quản lý'
  }

  if (pathname === '/account') {
    return 'Hồ sơ của tôi'
  }

  if (pathname === '/rooms/search') {
    return 'Tìm phòng'
  }

  if (pathname === '/rooms') {
    return 'Danh sách phòng'
  }

  if (/^\/rooms\/[^/]+$/.test(pathname)) {
    return 'Chi tiết phòng'
  }

  if (pathname === '/room-types') {
    return 'Loại phòng'
  }

  if (/^\/room-types\/[^/]+$/.test(pathname)) {
    return 'Chi tiết loại phòng'
  }

  if (pathname === '/bookings') {
    return 'Booking của tôi'
  }

  if (/^\/bookings\/new\/[^/]+$/.test(pathname)) {
    return 'Tạo booking'
  }

  if (/^\/bookings\/[^/]+$/.test(pathname)) {
    return 'Chi tiết booking'
  }

  if (pathname === '/payments/vnpay/return') {
    return 'Kết quả thanh toán'
  }

  if (pathname === '/management') {
    return 'Tổng quan vận hành'
  }

  if (pathname.startsWith('/management/rooms')) {
    return pathname === '/management/rooms'
      ? 'Quản lý phòng'
      : 'Chi tiết phòng'
  }

  if (pathname.startsWith('/management/room-types')) {
    return 'Quản lý loại phòng'
  }

  if (pathname.startsWith('/management/amenities')) {
    return 'Quản lý tiện nghi'
  }

  if (pathname.startsWith('/management/bookings')) {
    return pathname === '/management/bookings'
      ? 'Quản lý booking'
      : 'Chi tiết booking'
  }

  if (pathname.startsWith('/management/payments')) {
    return 'Quản lý thanh toán'
  }

  if (pathname.startsWith('/management/users')) {
    return 'Quản lý nhân viên'
  }

  if (pathname.startsWith('/management/customers')) {
    return 'Quản lý khách hàng'
  }

  if (pathname === '/forbidden') {
    return 'Không có quyền truy cập'
  }

  return 'Không tìm thấy trang'
}

export function RouteLoading() {
  return (
    <main
      className="mx-auto w-full max-w-7xl px-4 py-16 focus:outline-none sm:px-6 lg:px-8"
      id="main-content"
      tabIndex={-1}
    >
      <LoadingState label="Đang mở trang…" />
    </main>
  )
}

export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    document.title = `${getPageTitle(pathname)} | ${APP_NAME}`
    window.scrollTo({ left: 0, top: 0, behavior: 'auto' })

    const animationFrame = window.requestAnimationFrame(() => {
      document.getElementById('main-content')?.focus({
        preventScroll: true,
      })
    })

    return () => window.cancelAnimationFrame(animationFrame)
  }, [pathname])

  return null
}

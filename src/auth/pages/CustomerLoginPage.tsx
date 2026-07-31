import { LoginForm } from '../components/LoginForm'

interface CustomerLoginPageProps {
  managementLoginPath?: string
  notice?: string
  redirectTo?: string
  registerPath?: string
}

export function CustomerLoginPage({
  managementLoginPath = '/management/login',
  notice,
  redirectTo = '/bookings',
  registerPath = '/register',
}: CustomerLoginPageProps) {
  return (
    <LoginForm
      alternateLabel="Đăng nhập dành cho nhân viên"
      alternatePath={managementLoginPath}
      description="Đăng nhập để xem lịch sử đặt phòng, thanh toán và cập nhật hồ sơ của bạn."
      mode="customer"
      notice={notice}
      redirectTo={redirectTo}
      registerPath={registerPath}
      title="Chào mừng bạn trở lại"
    />
  )
}

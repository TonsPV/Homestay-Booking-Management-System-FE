import { LoginForm } from '../components/LoginForm'

interface ManagementLoginPageProps {
  customerLoginPath?: string
  redirectTo?: string
}

export function ManagementLoginPage({
  customerLoginPath = '/login',
  redirectTo = '/management',
}: ManagementLoginPageProps) {
  return (
    <LoginForm
      alternateLabel="Quay lại đăng nhập khách hàng"
      alternatePath={customerLoginPath}
      description="Dành cho nhân viên và quản trị viên vận hành homestay."
      mode="user"
      redirectTo={redirectTo}
      title="Đăng nhập quản lý"
    />
  )
}

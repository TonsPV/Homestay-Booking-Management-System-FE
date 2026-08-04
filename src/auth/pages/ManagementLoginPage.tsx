import { LoginForm } from '../components/LoginForm'
import type { AuthPrincipal } from '../types'

interface ManagementLoginPageProps {
  customerLoginPath?: string
  redirectTo?: string
  resolveRedirect?: (principal: AuthPrincipal) => string
}

export function ManagementLoginPage({
  customerLoginPath = '/login',
  redirectTo = '/management',
  resolveRedirect,
}: ManagementLoginPageProps) {
  return (
    <LoginForm
      alternateLabel="Quay lại đăng nhập khách hàng"
      alternatePath={customerLoginPath}
      description="Dành cho nhân viên và quản trị viên vận hành homestay."
      mode="user"
      redirectTo={redirectTo}
      resolveRedirect={resolveRedirect}
      title="Đăng nhập quản lý"
    />
  )
}

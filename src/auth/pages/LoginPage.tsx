import { LoginForm } from '../components/LoginForm'

interface LoginPageProps {
  locationState?: unknown
  notice?: string
  registerPath?: string
}

export function LoginPage({
  locationState,
  notice,
  registerPath = '/register',
}: LoginPageProps) {
  return (
    <LoginForm
      description="Truy cập tài khoản Homestay Green của bạn."
      locationState={locationState}
      notice={notice}
      registerPath={registerPath}
      title="Đăng nhập"
    />
  )
}

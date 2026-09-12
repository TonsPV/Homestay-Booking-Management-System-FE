import { LoginForm } from '../components/LoginForm'
import type { ActorType } from '../types'

interface LoginPageProps {
  actor?: ActorType
  locationState?: unknown
  notice?: string
  registerPath?: string | null
}

export function LoginPage({
  actor = 'customer',
  locationState,
  notice,
  registerPath = '/register',
}: LoginPageProps) {
  const isOperationsLogin = actor === 'user'

  return (
    <LoginForm
      actor={actor}
      description={
        isOperationsLogin
          ? 'Dành cho nhân viên và quản trị viên. Tài khoản do quản trị viên cấp.'
          : 'Truy cập tài khoản Homestay Green của bạn.'
      }
      locationState={locationState}
      notice={notice}
      registerPath={registerPath}
      title={isOperationsLogin ? 'Đăng nhập vận hành' : 'Đăng nhập'}
    />
  )
}

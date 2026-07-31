import { Navigate, useLocation } from 'react-router-dom'

import {
  CustomerLoginPage,
  ManagementLoginPage,
  RegisterPage,
  useAuth,
} from '@/auth'

import { getSafeReturnTo } from './return-to'

export function CustomerLoginRoute() {
  const { principal } = useAuth()
  const location = useLocation()
  const returnTo = getSafeReturnTo(location.state, '/bookings')
  const stateNotice =
    typeof location.state === 'object' &&
    location.state !== null &&
    'notice' in location.state &&
    typeof location.state.notice === 'string'
      ? location.state.notice
      : undefined
  const notice =
    new URLSearchParams(location.search).get('notice') ===
    'password-changed'
      ? 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại bằng mật khẩu mới.'
      : stateNotice

  if (principal?.actorType === 'customer') {
    return <Navigate replace to={returnTo} />
  }

  if (principal?.actorType === 'user') {
    return <Navigate replace to="/management" />
  }

  return <CustomerLoginPage notice={notice} redirectTo={returnTo} />
}

export function ManagementLoginRoute() {
  const { principal } = useAuth()
  const location = useLocation()
  const returnTo = getSafeReturnTo(location.state, '/management')

  if (principal?.actorType === 'user') {
    return <Navigate replace to={returnTo} />
  }

  if (principal?.actorType === 'customer') {
    return <Navigate replace to="/account" />
  }

  return <ManagementLoginPage redirectTo={returnTo} />
}

export function RegisterRoute() {
  const { principal } = useAuth()

  if (principal?.actorType === 'customer') {
    return <Navigate replace to="/account" />
  }

  if (principal?.actorType === 'user') {
    return <Navigate replace to="/management" />
  }

  return <RegisterPage />
}

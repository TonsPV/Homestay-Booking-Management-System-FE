import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { getErrorMessage } from '@/api/errors'
import { useAuth } from '@/auth/useAuth'
import type { ActorType, UserRole } from '@/auth/types'
import { Button } from '@/shared/components/Button'
import { ErrorState, LoadingState } from '@/shared/components/Feedback'

interface RouteGuardProps {
  actor: ActorType
  loginPath: string
  roles?: UserRole[]
}

export function RouteGuard({ actor, loginPath, roles }: RouteGuardProps) {
  const { error, logout, principal, restore, status } = useAuth()
  const location = useLocation()

  if (status === 'restoring') {
    return <LoadingState label="Đang khôi phục phiên đăng nhập…" />
  }

  if (status === 'error') {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16">
        <ErrorState
          description={getErrorMessage(error)}
          onRetry={() => {
            void restore().catch(() => undefined)
          }}
        />
        <div className="mt-4 text-center">
          <Button onClick={logout} variant="text">
            Đăng xuất phiên hiện tại
          </Button>
        </div>
      </div>
    )
  }

  if (!principal || status === 'anonymous') {
    return (
      <Navigate
        replace
        state={{ returnTo: `${location.pathname}${location.search}` }}
        to={loginPath}
      />
    )
  }

  if (principal.actorType !== actor) {
    return <Navigate replace to="/forbidden" />
  }

  if (
    actor === 'user' &&
    roles &&
    principal.actorType === 'user' &&
    !roles.includes(principal.role)
  ) {
    return <Navigate replace to="/forbidden" />
  }

  return <Outlet />
}

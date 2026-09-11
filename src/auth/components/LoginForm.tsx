import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { resolvePostLoginRoute } from '@/routes/workspace-policy'

import type { AuthPrincipal } from '../types'
import { getAuthActionError } from '../errors'
import { Alert } from '@/shared/components/Feedback'
import { Button } from '@/shared/components/Button'
import { Field, Input, PasswordInput } from '@/shared/components/FormControls'

import { useAuth } from '../useAuth'
import {
  loginSchema,
  type LoginFormValues,
} from '../validation'
import {
  formatRetryAfter,
  getRateLimitErrorMessage,
  useRateLimitCooldown,
} from '../useRateLimitCooldown'
import { AuthPageLayout } from './AuthPageLayout'

interface LoginFormProps {
  description: string
  locationState?: unknown
  notice?: string
  registerPath?: string
  title: string
}

export function LoginForm({
  description,
  locationState,
  notice,
  registerPath,
  title,
}: LoginFormProps) {
  const navigate = useNavigate()
  const auth = useAuth()
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    defaultValues: {
      identifier: '',
      password: '',
      remember: false,
    },
    resolver: zodResolver(loginSchema),
  })
  const loginMutation = useMutation({
    mutationFn: async (values: LoginFormValues) => {
      const input = {
        identifier: values.identifier,
        password: values.password,
      }
      const persistence = values.remember ? ('local' as const) : ('session' as const)

      return auth.login(input, persistence)
    },
    onSuccess: (principal: AuthPrincipal) =>
      navigate(resolvePostLoginRoute(principal, locationState), {
        replace: true,
      }),
  })
  const { isCoolingDown, remainingSeconds } = useRateLimitCooldown(
    loginMutation.error,
  )

  return (
    <AuthPageLayout
      description={description}
      eyebrow="Homestay Green"
      title={title}
    >
      <form
        className="grid gap-5"
        noValidate
        onSubmit={handleSubmit((values) => {
          if (!isCoolingDown && !loginMutation.isPending) {
            loginMutation.mutate(values)
          }
        })}
      >
        {notice ? <Alert tone="success">{notice}</Alert> : null}
        {loginMutation.error ? (
          <Alert title="Không thể đăng nhập" tone="error">
            {getRateLimitErrorMessage(
              loginMutation.error,
              remainingSeconds,
              getAuthActionError,
            )}
          </Alert>
        ) : null}

        <Field
          error={errors.identifier?.message}
          label="Email hoặc số điện thoại"
          required
        >
          <Input
            autoComplete="username"
            inputMode="text"
            placeholder="email@example.com hoặc 090..."
            {...register('identifier')}
          />
        </Field>

        <Field error={errors.password?.message} label="Mật khẩu" required>
          <PasswordInput
            autoComplete="current-password"
            placeholder="Nhập mật khẩu"
            {...register('password')}
          />
        </Field>

        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl text-sm text-ink">
          <input
            className="size-5 rounded border-line accent-brand"
            type="checkbox"
            {...register('remember')}
          />
          Duy trì đăng nhập trên thiết bị này
        </label>

        <Button
          className="mt-1 w-full"
          disabled={isCoolingDown || loginMutation.isPending}
          loading={loginMutation.isPending}
          type="submit"
        >
          {loginMutation.isPending
            ? 'Đang đăng nhập...'
            : isCoolingDown
            ? `Thử lại sau ${formatRetryAfter(remainingSeconds)}`
            : 'Đăng nhập'}
        </Button>
      </form>

      {registerPath ? (
        <div className="mt-6 border-t border-line pt-6 text-center text-sm">
          <p className="text-muted">
            Chưa có tài khoản?{' '}
            <Link
              className="inline-flex min-h-11 items-center font-bold text-brand-strong hover:underline"
              to={registerPath}
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      ) : null}
    </AuthPageLayout>
  )
}

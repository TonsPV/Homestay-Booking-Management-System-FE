import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { Alert } from '@/shared/components/Feedback'
import { Button } from '@/shared/components/Button'
import { Field, Input, PasswordInput } from '@/shared/components/FormControls'

import { registerCustomer } from '../api'
import { getAuthActionError } from '../errors'
import { AuthPageLayout } from '../components/AuthPageLayout'
import {
  formatRetryAfter,
  getRateLimitErrorMessage,
  useRateLimitCooldown,
} from '../useRateLimitCooldown'
import {
  registerSchema,
  type RegisterFormValues,
} from '../validation'

interface RegisterPageProps {
  loginPath?: string
  onRegistered?: () => void
}

export function RegisterPage({
  loginPath = '/login',
  onRegistered,
}: RegisterPageProps) {
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<RegisterFormValues>({
    defaultValues: {
      confirmPassword: '',
      email: '',
      fullName: '',
      password: '',
      phone: '',
    },
    resolver: zodResolver(registerSchema),
  })
  const registerMutation = useMutation({
    mutationFn: (values: RegisterFormValues) =>
      registerCustomer({
        email: values.email || null,
        fullName: values.fullName,
        password: values.password,
        phone: values.phone,
      }),
    onSuccess: () => {
      setRegistrationComplete(true)
      reset()
      onRegistered?.()
    },
  })
  const { isCoolingDown, remainingSeconds } = useRateLimitCooldown(
    registerMutation.error,
  )

  return (
    <AuthPageLayout
      description="Tạo tài khoản khách hàng để đặt phòng và theo dõi chuyến đi thuận tiện hơn."
      eyebrow="Tài khoản khách hàng"
      title="Bắt đầu cùng Homi Stay"
    >
      <form
        className="grid gap-5"
        noValidate
        onSubmit={handleSubmit((values) => {
          if (isCoolingDown || registerMutation.isPending) {
            return
          }

          setRegistrationComplete(false)
          registerMutation.mutate(values)
        })}
      >
        {registrationComplete ? (
          <Alert title="Đăng ký thành công" tone="success">
            Tài khoản của bạn đã sẵn sàng.{' '}
            <Link className="font-bold underline" to={loginPath}>
              Đăng nhập ngay
            </Link>
            .
          </Alert>
        ) : null}

        {registerMutation.error ? (
          <Alert title="Không thể đăng ký" tone="error">
            {getRateLimitErrorMessage(
              registerMutation.error,
              remainingSeconds,
              getAuthActionError,
            )}
          </Alert>
        ) : null}

        <Field error={errors.fullName?.message} label="Họ và tên" required>
          <Input
            autoComplete="name"
            placeholder="Nguyễn Văn An"
            {...register('fullName')}
          />
        </Field>

        <Field
          error={errors.phone?.message}
          hint="Chấp nhận số bắt đầu bằng 0, 84 hoặc +84."
          label="Số điện thoại"
          required
        >
          <Input
            autoComplete="tel"
            inputMode="tel"
            placeholder="090 123 4567"
            {...register('phone')}
          />
        </Field>

        <Field
          error={errors.email?.message}
          hint="Không bắt buộc."
          label="Email"
        >
          <Input
            autoComplete="email"
            inputMode="email"
            placeholder="email@example.com"
            type="email"
            {...register('email')}
          />
        </Field>

        <div className="grid items-start gap-5 sm:grid-cols-2">
          <Field
            error={errors.password?.message}
            hint="Từ 8 đến 72 ký tự."
            label="Mật khẩu"
            required
          >
            <PasswordInput
              autoComplete="new-password"
              {...register('password')}
            />
          </Field>

          <Field
            error={errors.confirmPassword?.message}
            hint="Nhập lại mật khẩu để xác nhận."
            label="Xác nhận mật khẩu"
            required
          >
            <PasswordInput
              autoComplete="new-password"
              {...register('confirmPassword')}
            />
          </Field>
        </div>

        <Button
          className="mt-1 w-full"
          disabled={isCoolingDown || registerMutation.isPending}
          loading={registerMutation.isPending}
          type="submit"
        >
          {registerMutation.isPending
            ? 'Đang đăng ký...'
            : isCoolingDown
            ? `Thử lại sau ${formatRetryAfter(remainingSeconds)}`
            : 'Tạo tài khoản'}
        </Button>
      </form>

      <p className="mt-6 border-t border-slate-200 pt-6 text-center text-sm text-slate-600">
        Đã có tài khoản?{' '}
        <Link className="font-bold text-blue-700 hover:underline" to={loginPath}>
          Đăng nhập
        </Link>
      </p>
    </AuthPageLayout>
  )
}

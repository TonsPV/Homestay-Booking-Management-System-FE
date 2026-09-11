import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/auth/useAuth'
import { getApiFieldErrorCode } from '@/api/errors'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Alert } from '@/shared/components/Feedback'
import { Field, PasswordInput } from '@/shared/components/FormControls'

import { useChangeCustomerPasswordMutation } from '../queries'
import { getCustomerPasswordActionError } from '../errors'
import {
  customerPasswordSchema,
  type CustomerPasswordFormValues,
} from '../validation'

export function CustomerPasswordForm() {
  const auth = useAuth()
  const navigate = useNavigate()
  const mutation = useChangeCustomerPasswordMutation()
  const {
    formState: { errors },
    handleSubmit,
    register,
    clearErrors,
    setError,
  } = useForm<CustomerPasswordFormValues>({
    defaultValues: {
      confirmPassword: '',
      currentPassword: '',
      newPassword: '',
    },
    resolver: zodResolver(customerPasswordSchema),
  })
  const currentPasswordFieldError = getApiFieldErrorCode(
    mutation.error,
    'currentPassword',
  )
  const newPasswordFieldError = getApiFieldErrorCode(
    mutation.error,
    'newPassword',
  )

  useEffect(() => {
    if (currentPasswordFieldError) {
      setError(
        'currentPassword',
        {
          type: 'server',
          message: getCustomerPasswordActionError(mutation.error),
        },
        { shouldFocus: true },
      )
      return
    }

    if (newPasswordFieldError) {
      setError(
        'newPassword',
        {
          type: 'server',
          message: getCustomerPasswordActionError(mutation.error),
        },
        { shouldFocus: true },
      )
    }
  }, [
    currentPasswordFieldError,
    mutation.error,
    newPasswordFieldError,
    setError,
  ])

  return (
    <Card className="flex h-full flex-col sm:p-6">
      <h2 className="text-lg font-bold text-ink">Đổi mật khẩu</h2>
      <p className="mt-1 text-sm leading-6 text-muted">
        Sau khi đổi, bạn cần đăng nhập lại trên thiết bị này và các thiết bị
        khác.
      </p>

      <form
        className="mt-6 flex flex-1 flex-col gap-6"
        noValidate
        onSubmit={handleSubmit((values) => {
          mutation.reset()
          clearErrors(['currentPassword', 'newPassword'])
          mutation.mutate(
            {
              currentPassword: values.currentPassword,
              newPassword: values.newPassword,
            },
            {
              onSuccess: () => {
                flushSync(auth.logout)
                navigate('/login?notice=password-changed', {
                  replace: true,
                })
              },
            },
          )
        })}
      >
        <div className="grid gap-5">
          {mutation.error &&
          !currentPasswordFieldError &&
          !newPasswordFieldError ? (
            <Alert title="Không thể đổi mật khẩu" tone="error">
              {getCustomerPasswordActionError(mutation.error)}
            </Alert>
          ) : null}

          <Field
            error={errors.currentPassword?.message}
            label="Mật khẩu hiện tại"
            required
          >
            <PasswordInput
              autoComplete="current-password"
              {...register('currentPassword')}
            />
          </Field>
          <Field
            error={errors.newPassword?.message}
            label="Mật khẩu mới"
            required
          >
            <PasswordInput
              autoComplete="new-password"
              {...register('newPassword')}
            />
          </Field>
          <Field
            error={errors.confirmPassword?.message}
            label="Xác nhận mật khẩu mới"
            required
          >
            <PasswordInput
              autoComplete="new-password"
              {...register('confirmPassword')}
            />
          </Field>
        </div>

        <div className="mt-auto flex border-t border-line pt-5">
          <Button
            className="w-full sm:ml-auto sm:w-auto"
            loading={mutation.isPending}
            type="submit"
          >
            Đổi mật khẩu
          </Button>
        </div>
      </form>
    </Card>
  )
}

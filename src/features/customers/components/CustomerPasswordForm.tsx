import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'

import { getErrorMessage } from '@/api/errors'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Alert } from '@/shared/components/Feedback'
import { Field, Input } from '@/shared/components/FormControls'

import { useChangeCustomerPasswordMutation } from '../queries'
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
  } = useForm<CustomerPasswordFormValues>({
    defaultValues: {
      confirmPassword: '',
      currentPassword: '',
      newPassword: '',
    },
    resolver: zodResolver(customerPasswordSchema),
  })

  return (
    <Card className="lg:col-start-2">
      <h2 className="text-lg font-black text-slate-950">Đổi mật khẩu</h2>
      <p className="mt-1 text-sm text-slate-600">
        Sau khi đổi, bạn cần đăng nhập lại trên thiết bị này và các thiết bị
        khác.
      </p>

      <form
        className="mt-6 grid gap-5"
        noValidate
        onSubmit={handleSubmit((values) => {
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
        {mutation.error ? (
          <Alert title="Không thể đổi mật khẩu" tone="error">
            {getErrorMessage(mutation.error)}
          </Alert>
        ) : null}

        <Field
          error={errors.currentPassword?.message}
          label="Mật khẩu hiện tại"
          required
        >
          <Input
            autoComplete="current-password"
            type="password"
            {...register('currentPassword')}
          />
        </Field>
        <Field
          error={errors.newPassword?.message}
          label="Mật khẩu mới"
          required
        >
          <Input
            autoComplete="new-password"
            type="password"
            {...register('newPassword')}
          />
        </Field>
        <Field
          error={errors.confirmPassword?.message}
          label="Xác nhận mật khẩu mới"
          required
        >
          <Input
            autoComplete="new-password"
            type="password"
            {...register('confirmPassword')}
          />
        </Field>

        <div className="flex justify-end">
          <Button loading={mutation.isPending} type="submit">
            Đổi mật khẩu
          </Button>
        </div>
      </form>
    </Card>
  )
}

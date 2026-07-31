import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useId } from 'react'
import { useForm } from 'react-hook-form'

import { getErrorMessage } from '@/api/errors'
import type { Customer } from '@/auth/types'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Alert } from '@/shared/components/Feedback'
import { Field, Input } from '@/shared/components/FormControls'

import { useSetInitialCustomerPasswordMutation } from '../queries'
import {
  initialCustomerPasswordSchema,
  type InitialCustomerPasswordFormValues,
} from '../validation'

interface InitialCustomerPasswordFormProps {
  customer: Customer
  onCancel: () => void
  onSuccess: (customer: Customer) => void
}

export function InitialCustomerPasswordForm({
  customer,
  onCancel,
  onSuccess,
}: InitialCustomerPasswordFormProps) {
  const titleId = useId()
  const mutation = useSetInitialCustomerPasswordMutation()
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setFocus,
  } = useForm<InitialCustomerPasswordFormValues>({
    defaultValues: { confirmPassword: '', password: '' },
    resolver: zodResolver(initialCustomerPasswordSchema),
  })

  useEffect(() => {
    reset()
    setFocus('password')
  }, [customer.id, reset, setFocus])

  return (
    <Card aria-labelledby={titleId}>
      <div className="max-w-2xl">
        <h2 className="text-lg font-black text-ink" id={titleId}>
          Đặt mật khẩu ban đầu
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          Tạo quyền đăng nhập lần đầu cho {customer.fullName}. Backend chỉ chấp
          nhận khách được tạo từ quy trình tại quầy và chưa từng có mật khẩu.
        </p>
      </div>

      <form
        className="mt-5 grid gap-4 lg:grid-cols-2"
        noValidate
        onSubmit={handleSubmit((values) => {
          mutation.mutate(
            { id: customer.id, password: values.password },
            {
              onSuccess: () => {
                reset()
                onSuccess(customer)
              },
            },
          )
        })}
      >
        {mutation.error ? (
          <div className="lg:col-span-2">
            <Alert title="Không thể đặt mật khẩu ban đầu" tone="error">
              {getErrorMessage(mutation.error)}
            </Alert>
          </div>
        ) : null}

        <Field
          error={errors.password?.message}
          hint="Từ 8 đến 72 ký tự."
          label="Mật khẩu ban đầu"
          required
        >
          <Input
            autoComplete="new-password"
            type="password"
            {...register('password')}
          />
        </Field>
        <Field
          error={errors.confirmPassword?.message}
          label="Xác nhận mật khẩu"
          required
        >
          <Input
            autoComplete="new-password"
            type="password"
            {...register('confirmPassword')}
          />
        </Field>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end lg:col-span-2">
          <Button
            disabled={mutation.isPending}
            onClick={onCancel}
            type="button"
            variant="text"
          >
            Hủy
          </Button>
          <Button loading={mutation.isPending} type="submit">
            Xác nhận mật khẩu
          </Button>
        </div>
      </form>
    </Card>
  )
}

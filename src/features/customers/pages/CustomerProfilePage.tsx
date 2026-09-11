import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { getApiFieldErrorCode, getErrorMessage } from '@/api/errors'
import { useAuth } from '@/auth/useAuth'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import {
  Alert,
  ErrorState,
  LoadingState,
} from '@/shared/components/Feedback'
import { Field, Input } from '@/shared/components/FormControls'
import { PageHeader } from '@/shared/components/PageHeader'
import { formatDateTime } from '@/shared/formatting/formatters'

import {
  useCustomerProfileQuery,
  useUpdateCustomerProfileMutation,
} from '../queries'
import {
  customerProfileSchema,
  type CustomerProfileFormValues,
} from '../validation'
import { CustomerPasswordForm } from '../components/CustomerPasswordForm'
import { getCustomerProfileActionError } from '../errors'

export function CustomerProfilePage() {
  const auth = useAuth()
  const [saved, setSaved] = useState(false)
  const canLoadProfile = auth.principal?.actorType === 'customer'
  const profileQuery = useCustomerProfileQuery(canLoadProfile)
  const updateMutation = useUpdateCustomerProfileMutation()
  const {
    formState: { errors, isDirty },
    handleSubmit,
    register,
    reset,
    clearErrors,
    setError,
  } = useForm<CustomerProfileFormValues>({
    defaultValues: {
      email: '',
      fullName: '',
      phone: '',
    },
    resolver: zodResolver(customerProfileSchema),
  })
  const emailFieldError = getApiFieldErrorCode(updateMutation.error, 'email')
  const phoneFieldError = getApiFieldErrorCode(updateMutation.error, 'phone')

  useEffect(() => {
    if (!profileQuery.data) {
      return
    }

    reset({
      email: profileQuery.data.email ?? '',
      fullName: profileQuery.data.fullName,
      phone: profileQuery.data.phone,
    })
  }, [profileQuery.data, reset])

  useEffect(() => {
    if (emailFieldError) {
      setError(
        'email',
        {
          type: 'server',
          message: getCustomerProfileActionError(updateMutation.error),
        },
        { shouldFocus: true },
      )
      return
    }

    if (phoneFieldError) {
      setError(
        'phone',
        {
          type: 'server',
          message: getCustomerProfileActionError(updateMutation.error),
        },
        { shouldFocus: true },
      )
    }
  }, [emailFieldError, phoneFieldError, setError, updateMutation.error])

  if (!canLoadProfile) {
    return (
      <ErrorState description="Trang hồ sơ này chỉ dành cho tài khoản khách hàng." />
    )
  }

  if (profileQuery.isPending) {
    return <LoadingState label="Đang tải hồ sơ…" />
  }

  if (profileQuery.error || !profileQuery.data) {
    return (
      <ErrorState
        description={getErrorMessage(profileQuery.error)}
        onRetry={() => void profileQuery.refetch()}
      />
    )
  }

  const customer = profileQuery.data

  return (
    <section className="w-full space-y-8">
      <PageHeader
        description="Thông tin này được dùng làm dữ liệu mặc định khi bạn đặt phòng."
        eyebrow="Tài khoản"
        title="Hồ sơ khách hàng"
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(17rem,0.8fr)_minmax(0,2fr)]">
        <aside aria-labelledby="account-summary-title">
          <Card className="sm:p-6">
            <div className="flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-xl font-bold text-brand-strong">
                {customer.fullName.trim().charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2
                  className="truncate text-lg font-bold text-ink"
                  id="account-summary-title"
                >
                  {customer.fullName}
                </h2>
                <p className="mt-1 text-sm text-muted">Tài khoản khách hàng</p>
              </div>
            </div>

            <dl className="mt-6 grid gap-4 border-t border-line pt-5 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Trạng thái</dt>
                <dd>
                  {customer.status === 'ACTIVE' ? (
                    <Badge tone="emerald">Đang hoạt động</Badge>
                  ) : (
                    <Badge tone="rose">Đã khóa</Badge>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Ngày tham gia</dt>
                <dd className="mt-1 font-semibold text-ink">
                  {formatDateTime(customer.createdAt)}
                </dd>
              </div>
            </dl>
          </Card>
        </aside>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="flex h-full flex-col sm:p-6">
            <h2 className="text-lg font-bold text-ink">Thông tin liên hệ</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Số điện thoại phải là số di động Việt Nam hợp lệ.
            </p>

            <form
              className="mt-6 flex flex-1 flex-col gap-6"
              noValidate
              onSubmit={handleSubmit((values) => {
                updateMutation.reset()
                clearErrors(['email', 'phone'])
                setSaved(false)
                updateMutation.mutate(
                  {
                    email: values.email || null,
                    fullName: values.fullName,
                    phone: values.phone,
                  },
                  {
                    onSuccess: (updatedCustomer) => {
                      auth.updatePrincipal({
                        actorType: 'customer',
                        ...updatedCustomer,
                      })
                      reset({
                        email: updatedCustomer.email ?? '',
                        fullName: updatedCustomer.fullName,
                        phone: updatedCustomer.phone,
                      })
                      setSaved(true)
                    },
                  },
                )
              })}
            >
              <div className="grid gap-5">
                {saved ? (
                  <Alert tone="success">Đã lưu thay đổi hồ sơ.</Alert>
                ) : null}
                {updateMutation.error &&
                !emailFieldError &&
                !phoneFieldError ? (
                  <Alert title="Không thể cập nhật" tone="error">
                    {getCustomerProfileActionError(updateMutation.error)}
                  </Alert>
                ) : null}

                <Field
                  error={errors.fullName?.message}
                  label="Họ và tên"
                  required
                >
                  <Input autoComplete="name" {...register('fullName')} />
                </Field>
                <Field
                  error={errors.phone?.message}
                  label="Số điện thoại"
                  required
                >
                  <Input
                    autoComplete="tel"
                    inputMode="tel"
                    {...register('phone')}
                  />
                </Field>
                <Field
                  error={errors.email?.message}
                  hint="Để trống nếu bạn không muốn lưu email."
                  label="Email"
                >
                  <Input
                    autoComplete="email"
                    inputMode="email"
                    type="email"
                    {...register('email')}
                  />
                </Field>
              </div>

              <div className="mt-auto flex border-t border-line pt-5">
                <Button
                  className="w-full sm:ml-auto sm:w-auto"
                  disabled={!isDirty}
                  loading={updateMutation.isPending}
                  type="submit"
                >
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          </Card>

          <CustomerPasswordForm />
        </div>
      </div>
    </section>
  )
}

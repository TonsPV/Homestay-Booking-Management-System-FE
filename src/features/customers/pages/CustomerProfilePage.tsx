import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { getErrorMessage } from '@/api/errors'
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
  } = useForm<CustomerProfileFormValues>({
    defaultValues: {
      email: '',
      fullName: '',
      phone: '',
    },
    resolver: zodResolver(customerProfileSchema),
  })

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
    <section className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        description="Thông tin này được dùng làm dữ liệu mặc định khi bạn đặt phòng."
        eyebrow="Tài khoản"
        title="Hồ sơ khách hàng"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <Card className="h-fit">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-100 text-xl font-black text-blue-700">
            {customer.fullName.trim().charAt(0).toUpperCase()}
          </div>
          <h2 className="mt-4 text-lg font-black text-slate-950">
            {customer.fullName}
          </h2>
          <div className="mt-2">
            {customer.status === 'ACTIVE' ? (
              <Badge tone="emerald">Đang hoạt động</Badge>
            ) : (
              <Badge tone="rose">Đã khóa</Badge>
            )}
          </div>
          <dl className="mt-6 grid gap-4 border-t border-slate-200 pt-5 text-sm">
            <div>
              <dt className="text-slate-500">Mã khách hàng</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                #{customer.id}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Ngày tham gia</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {formatDateTime(customer.createdAt)}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="text-lg font-black text-slate-950">
            Thông tin liên hệ
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Số điện thoại phải là số di động Việt Nam hợp lệ.
          </p>

          <form
            className="mt-6 grid gap-5"
            noValidate
            onSubmit={handleSubmit((values) => {
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
            {saved ? (
              <Alert tone="success">Đã lưu thay đổi hồ sơ.</Alert>
            ) : null}
            {updateMutation.error ? (
              <Alert title="Không thể cập nhật" tone="error">
                {getErrorMessage(updateMutation.error)}
              </Alert>
            ) : null}

            <Field error={errors.fullName?.message} label="Họ và tên" required>
              <Input autoComplete="name" {...register('fullName')} />
            </Field>
            <Field error={errors.phone?.message} label="Số điện thoại" required>
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

            <div className="flex justify-end">
              <Button
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
    </section>
  )
}

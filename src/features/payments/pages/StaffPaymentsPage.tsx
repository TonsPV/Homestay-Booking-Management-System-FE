import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'

import { Button } from '@/shared/components/Button'
import { ErrorState, LoadingState } from '@/shared/components/Feedback'
import { Field, Select } from '@/shared/components/FormControls'
import { PageHeader } from '@/shared/components/PageHeader'
import { PaginationControls } from '@/shared/components/PaginationControls'

import { PaymentList } from '../components/PaymentList'
import {
  getPaymentMethodLabel,
  getPaymentStatusLabel,
} from '../components/paymentLabels'
import { getPaymentActionError } from '../errors'
import { useManagementPayments } from '../hooks'
import { paymentFilterSchema, type PaymentFilterValues } from '../schemas'
import { type PaymentMethod, type PaymentStatus } from '../types'

const STAFF_PAYMENT_METHODS = [
  'CASH',
  'BANK_TRANSFER',
] as const satisfies readonly PaymentMethod[]
const STAFF_PAYMENT_STATUSES = [
  'PENDING',
  'SUCCESS',
  'FAILED',
  'REFUNDED',
] as const satisfies readonly PaymentStatus[]

function parsePage(value: string | null) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function parseStatus(value: string | null): PaymentStatus | undefined {
  return STAFF_PAYMENT_STATUSES.find((status) => status === value)
}

function parseStaffMethod(value: string | null): PaymentMethod | undefined {
  return STAFF_PAYMENT_METHODS.find((method) => method === value)
}

function isStaffPaymentMethod(method: PaymentMethod) {
  return STAFF_PAYMENT_METHODS.some((item) => item === method)
}

export function StaffPaymentsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawMethod = searchParams.get('method')
  const rawStatus = searchParams.get('status')
  const page = parsePage(searchParams.get('page'))
  const status = parseStatus(rawStatus)
  const method = parseStaffMethod(rawMethod)
  const query = useMemo(
    () => ({ limit: 20, method, page, status }),
    [method, page, status],
  )
  const paymentsQuery = useManagementPayments(query)
  const filterForm = useForm<PaymentFilterValues>({
    defaultValues: { method: method ?? '', status: status ?? '' },
    resolver: zodResolver(paymentFilterSchema),
  })
  const resetPaymentFilters = filterForm.reset

  useEffect(() => {
    const invalidMethod = rawMethod !== null && method === undefined
    const invalidStatus = rawStatus !== null && status === undefined
    if (!invalidMethod && !invalidStatus) return

    const next = new URLSearchParams(searchParams)
    if (invalidMethod) next.delete('method')
    if (invalidStatus) next.delete('status')
    next.delete('page')
    setSearchParams(next, { replace: true })
  }, [method, rawMethod, rawStatus, searchParams, setSearchParams, status])

  useEffect(() => {
    resetPaymentFilters({ method: method ?? '', status: status ?? '' })
  }, [method, resetPaymentFilters, status])

  const submitFilters = filterForm.handleSubmit((values) => {
    const params = new URLSearchParams()
    if (values.status) params.set('status', values.status)
    const nextMethod = parseStaffMethod(values.method)
    if (nextMethod) params.set('method', nextMethod)
    setSearchParams(params)
  })

  const resetFilters = () => {
    resetPaymentFilters({ method: '', status: '' })
    setSearchParams(new URLSearchParams())
  }

  const payments =
    paymentsQuery.data?.data.filter((payment) =>
      isStaffPaymentMethod(payment.method),
    ) ?? []

  return (
    <div className="grid gap-6">
      <PageHeader
        description="Theo dõi các khoản tiền mặt và chuyển khoản được ghi nhận tại quầy."
        eyebrow="Quầy lễ tân"
        title="Thanh toán tại quầy"
      />

      <form
        className="grid gap-4 rounded-panel bg-surface p-4 shadow-elevation-1 sm:grid-cols-[1fr_1fr_auto]"
        onSubmit={submitFilters}
      >
        <Field
          error={filterForm.formState.errors.status?.message}
          label="Trạng thái"
        >
          <Select {...filterForm.register('status')}>
            <option value="">Tất cả trạng thái</option>
            {STAFF_PAYMENT_STATUSES.map((item) => (
              <option key={item} value={item}>
                {getPaymentStatusLabel(item)}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          error={filterForm.formState.errors.method?.message}
          label="Phương thức tại quầy"
        >
          <Select {...filterForm.register('method')}>
            <option value="">Tiền mặt và chuyển khoản</option>
            {STAFF_PAYMENT_METHODS.map((item) => (
              <option key={item} value={item}>
                {getPaymentMethodLabel(item)}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex items-end gap-2">
          <Button type="submit">Lọc</Button>
          <Button onClick={resetFilters} variant="outline">
            Xóa
          </Button>
        </div>
      </form>

      {paymentsQuery.isPending ? (
        <LoadingState label="Đang tải thanh toán tại quầy…" />
      ) : paymentsQuery.isError ? (
        <ErrorState
          description={getPaymentActionError(paymentsQuery.error)}
          onRetry={() => void paymentsQuery.refetch()}
        />
      ) : (
        <>
          <PaymentList
            bookingBasePath="/staff/bookings"
            management
            paymentBasePath="/staff/payments"
            payments={payments}
          />
          <PaginationControls
            onPageChange={(nextPage) => {
              const params = new URLSearchParams(searchParams)
              if (nextPage > 1) params.set('page', String(nextPage))
              else params.delete('page')
              setSearchParams(params)
            }}
            pagination={paymentsQuery.data.meta?.pagination}
          />
        </>
      )}
    </div>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useForm } from 'react-hook-form'
import {
  Link,
  useSearchParams,
} from 'react-router-dom'

import { useAuth } from '@/auth/useAuth'
import { Button } from '@/shared/components/Button'
import { ConfirmationDialog } from '@/shared/components/ConfirmationDialog'
import {
  Alert,
  ErrorState,
  LoadingState,
} from '@/shared/components/Feedback'
import {
  Field,
  Select,
  Textarea,
} from '@/shared/components/FormControls'
import { PageHeader } from '@/shared/components/PageHeader'
import { PaginationControls } from '@/shared/components/PaginationControls'
import {
  formatDateTime,
  formatMoney,
} from '@/shared/formatting/formatters'

import { PaymentList } from '../components/PaymentList'
import {
  getPaymentMethodLabel,
  getPaymentStatusLabel,
} from '../components/paymentLabels'
import { getPaymentActionError } from '../errors'
import {
  useManagementPayments,
  useReconcileVnPayRefund,
  useRefundPayment,
} from '../hooks'
import {
  clearRefundPaymentKey,
  getOrCreateRefundPaymentKey,
} from '../idempotency'
import {
  paymentFilterSchema,
  refundPaymentFormSchema,
  type PaymentFilterValues,
  type RefundPaymentFormValues,
} from '../schemas'
import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  type Payment,
  type PaymentMethod,
  type PaymentStatus,
} from '../types'

interface PaymentActionFeedback {
  message: string
  title: string
  tone: 'info' | 'success' | 'warning'
}

function parsePage(value: string | null) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

function parseStatus(value: string | null): PaymentStatus | undefined {
  return PAYMENT_STATUSES.find((status) => status === value)
}

function parseMethod(value: string | null): PaymentMethod | undefined {
  return PAYMENT_METHODS.find((method) => method === value)
}

export function ManagementPaymentsPage() {
  const { principal } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null)
  const [actionFeedback, setActionFeedback] =
    useState<PaymentActionFeedback>()
  const page = parsePage(searchParams.get('page'))
  const status = parseStatus(searchParams.get('status'))
  const method = parseMethod(searchParams.get('method'))
  const query = useMemo(
    () => ({ limit: 20, method, page, status }),
    [method, page, status],
  )
  const paymentsQuery = useManagementPayments(query)
  const refundMutation = useRefundPayment()
  const reconcileMutation = useReconcileVnPayRefund()
  const canRefund =
    principal?.actorType === 'user' && principal.role === 'ADMIN'
  const filterForm = useForm<PaymentFilterValues>({
    defaultValues: { method: method ?? '', status: status ?? '' },
    resolver: zodResolver(paymentFilterSchema),
  })
  const resetPaymentFilters = filterForm.reset
  const refundForm = useForm<RefundPaymentFormValues>({
    defaultValues: { reason: '' },
    resolver: zodResolver(refundPaymentFormSchema),
  })
  const staleRefundCount =
    paymentsQuery.data?.meta?.staleRefundCount ?? 0

  useEffect(() => {
    resetPaymentFilters({
      method: method ?? '',
      status: status ?? '',
    })
  }, [method, resetPaymentFilters, status])

  const submitFilters = filterForm.handleSubmit((values) => {
    const params = new URLSearchParams()
    if (values.status) params.set('status', values.status)
    if (values.method) params.set('method', values.method)
    setSearchParams(params)
  })

  const showReviewQueue = () => {
    resetPaymentFilters({ method: '', status: 'REQUIRES_REVIEW' })
    setSearchParams({ status: 'REQUIRES_REVIEW' })
  }

  const showPendingRefunds = () => {
    resetPaymentFilters({ method: 'VNPAY', status: 'REFUND_PENDING' })
    setSearchParams({ method: 'VNPAY', status: 'REFUND_PENDING' })
  }

  const resetFilters = () => {
    resetPaymentFilters({ method: '', status: '' })
    setSearchParams(new URLSearchParams())
  }

  const submitRefund = refundForm.handleSubmit((values) => {
    if (!refundTarget) {
      return
    }

    setActionFeedback(undefined)
    refundMutation.mutate(
      {
        paymentId: refundTarget.id,
        idempotencyKey: getOrCreateRefundPaymentKey(refundTarget.id),
        input: { reason: values.reason.trim() || undefined },
      },
      {
        onSuccess: (payment) => {
          if (payment.status === 'REFUNDED') {
            clearRefundPaymentKey(payment.id)
          }
          setActionFeedback(
            payment.status === 'REFUND_PENDING'
              ? {
                  message:
                    'VNPay chưa trả kết quả cuối. Không gửi yêu cầu hoàn lần hai; hãy dùng thao tác đối soát.',
                  title: 'Yêu cầu hoàn tiền đang được xử lý',
                  tone: 'warning',
                }
              : {
                  message:
                    'Backend đã xác nhận hoàn tiền và đang làm mới booking cùng lịch phòng.',
                  title: 'Hoàn tiền thành công',
                  tone: 'success',
                },
          )
          setRefundTarget(null)
          refundForm.reset()
        },
      },
    )
  })

  const closeRefundDialog = () => {
    if (refundMutation.isPending) {
      return
    }

    refundMutation.reset()
    refundForm.reset()
    setRefundTarget(null)
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Quản lý"
        title="Thanh toán và đối soát"
        description="Theo dõi payment toàn hệ thống. REQUIRES_REVIEW cần được xử lý theo quy trình đối soát, không sửa booking cục bộ."
        actions={
          <div className="flex flex-wrap gap-2">
            {staleRefundCount > 0 ? (
              <Button onClick={showPendingRefunds} variant="outline">
                Refund quá hạn ({staleRefundCount})
              </Button>
            ) : null}
            <Button onClick={showReviewQueue} variant="outline">
              Hàng đợi đối soát
            </Button>
          </div>
        }
      />

      {staleRefundCount > 0 ? (
        <Alert tone="warning" title="Có refund VNPay chờ quá 7 ngày">
          {staleRefundCount} giao dịch cần được kiểm tra. Chỉ báo này do
          Backend tính trên toàn bộ dữ liệu, không phụ thuộc trang đang xem.
        </Alert>
      ) : null}

      {actionFeedback ? (
        <Alert tone={actionFeedback.tone} title={actionFeedback.title}>
          {actionFeedback.message}
        </Alert>
      ) : null}

      {status === 'REQUIRES_REVIEW' ? (
        <Alert tone="warning" title="Hàng đợi cần đối soát">
          Đây là các giao dịch VNPay thành công đến muộn sau khi booking đã bị
          hủy. Admin có thể gửi yêu cầu hoàn tiền toàn phần qua VNPay.
        </Alert>
      ) : null}

      {reconcileMutation.isError ? (
        <Alert tone="error" title="Không thể đối soát refund">
          {getPaymentActionError(reconcileMutation.error)}
        </Alert>
      ) : null}

      <form
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_1fr_auto]"
        onSubmit={submitFilters}
      >
        <Field label="Trạng thái" error={filterForm.formState.errors.status?.message}>
          <Select {...filterForm.register('status')}>
            <option value="">Tất cả</option>
            {PAYMENT_STATUSES.map((item) => (
              <option key={item} value={item}>
                {getPaymentStatusLabel(item)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Phương thức" error={filterForm.formState.errors.method?.message}>
          <Select {...filterForm.register('method')}>
            <option value="">Tất cả</option>
            {PAYMENT_METHODS.map((item) => (
              <option key={item} value={item}>
                {getPaymentMethodLabel(item)}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex items-end gap-2">
          <Button type="submit">Lọc</Button>
          <Button
            onClick={resetFilters}
            variant="outline"
          >
            Xóa
          </Button>
        </div>
      </form>

      {paymentsQuery.isPending ? (
        <LoadingState label="Đang tải danh sách payment…" />
      ) : paymentsQuery.isError ? (
        <ErrorState
          description={getPaymentActionError(paymentsQuery.error)}
          onRetry={() => void paymentsQuery.refetch()}
        />
      ) : (
        <>
          <PaymentList
            canRefund={canRefund}
            management
            onReconcile={(payment) => {
              if (reconcileMutation.isPending) {
                return
              }
              setActionFeedback(undefined)
              reconcileMutation.mutate(payment.id, {
                onSuccess: (result) => {
                  if (result.status === 'REFUNDED') {
                    clearRefundPaymentKey(result.id)
                  }
                  setActionFeedback(
                    result.status === 'REFUNDED'
                      ? {
                          message:
                            'Backend đã xác nhận refund hoàn tất và đang làm mới booking cùng lịch phòng.',
                          title: 'Đối soát hoàn tiền thành công',
                          tone: 'success',
                        }
                      : {
                          message:
                            'VNPay vẫn đang xử lý. Không gửi refund mới; hãy đối soát lại sau.',
                          title: 'Refund vẫn đang chờ',
                          tone: 'warning',
                        },
                  )
                },
              })
            }}
            onRefund={(payment) => {
              setActionFeedback(undefined)
              refundForm.reset()
              refundMutation.reset()
              setRefundTarget(payment)
            }}
            payments={paymentsQuery.data.data}
            reconcilingPaymentId={
              reconcileMutation.isPending
                ? reconcileMutation.variables
                : undefined
            }
          />
          <PaginationControls
            pagination={paymentsQuery.data.meta?.pagination}
            onPageChange={(nextPage) => {
              const params = new URLSearchParams(searchParams)
              if (nextPage > 1) {
                params.set('page', String(nextPage))
              } else {
                params.delete('page')
              }
              setSearchParams(params)
            }}
          />
        </>
      )}

      <ConfirmationDialog
        busy={refundMutation.isPending}
        cancelLabel="Đóng"
        confirmDisabled={refundTarget === null}
        confirmLabel="Xác nhận hoàn tiền"
        description="Hoàn toàn bộ payment trước check-in. Với VNPay, hệ thống gửi yêu cầu đến cổng và giữ trạng thái chờ nếu kết quả chưa chắc chắn."
        onCancel={closeRefundDialog}
        onConfirm={() => void submitRefund()}
        open={refundTarget !== null}
        title={
          refundTarget
            ? `Hoàn tiền payment #${refundTarget.id}?`
            : 'Hoàn tiền payment?'
        }
      >
        {refundTarget ? (
          <>
            <dl className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-sm">
              <div>
                <dt className="text-slate-500">Booking</dt>
                <dd className="mt-1 font-semibold">
                  <Link
                    className="text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    to={`/management/bookings/${refundTarget.bookingId}`}
                  >
                    #{refundTarget.bookingId}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Phương thức</dt>
                <dd className="mt-1 font-semibold text-slate-950">
                  {getPaymentMethodLabel(refundTarget.method)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Số tiền hoàn</dt>
                <dd className="mt-1 font-semibold text-slate-950">
                  {formatMoney(refundTarget.amount)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Thanh toán lúc</dt>
                <dd className="mt-1 font-semibold text-slate-950">
                  {formatDateTime(refundTarget.paidAt)}
                </dd>
              </div>
            </dl>

            <Alert className="mt-4">
              Backend sẽ kiểm tra trạng thái booking, payment và quyền thao
              tác tại thời điểm xác nhận.
            </Alert>
            <div className="mt-5 grid gap-4">
              <Field
                label="Lý do hoàn tiền"
                error={refundForm.formState.errors.reason?.message}
              >
                <Textarea {...refundForm.register('reason')} />
              </Field>
              {refundMutation.isError ? (
                <Alert tone="error">
                  {getPaymentActionError(refundMutation.error)}
                </Alert>
              ) : null}
            </div>
          </>
        ) : null}
      </ConfirmationDialog>
    </div>
  )
}

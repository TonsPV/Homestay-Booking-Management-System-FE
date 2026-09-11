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
import { ApiError } from '@/api/errors'
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
import { getPaymentReviewReasonLabel } from '../payment-review'
import {
  useManagementPayments,
  useReconcileVnPayRefund,
  useRefundPayment,
  useResolveDuplicateCharge,
} from '../hooks'
import {
  clearDuplicateResolutionKey,
  clearRefundPaymentKey,
  getOrCreateDuplicateResolutionKey,
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
  const [duplicateTarget, setDuplicateTarget] = useState<Payment | null>(null)
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
  const resolveDuplicateMutation = useResolveDuplicateCharge()
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
                    'VNPay đang xử lý yêu cầu hoàn tiền. Không gửi thêm yêu cầu; hãy đối soát lại sau.',
                  title: 'Yêu cầu hoàn tiền đang được xử lý',
                  tone: 'warning',
                }
              : {
                  message:
                    'Khoản hoàn tiền đã được ghi nhận. Trạng thái đặt phòng và lịch phòng đã được cập nhật.',
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

  const confirmResolveDuplicate = () => {
    if (!duplicateTarget || resolveDuplicateMutation.isPending) {
      return
    }

    setActionFeedback(undefined)
    resolveDuplicateMutation.mutate(
      {
        idempotencyKey: getOrCreateDuplicateResolutionKey(
          duplicateTarget.id,
        ),
        paymentId: duplicateTarget.id,
      },
      {
        onSuccess: (payment) => {
          if (payment.status === 'REFUNDED') {
            clearDuplicateResolutionKey(payment.id)
          }
          setActionFeedback(
            payment.status === 'REFUND_PENDING'
              ? {
                  message:
                    'VNPay đang xử lý khoản hoàn của giao dịch trùng. Không gửi thêm yêu cầu; hãy đối soát lại sau.',
                  title: 'Hoàn giao dịch trùng đang được xử lý',
                  tone: 'warning',
                }
              : {
                  message:
                    'Khoản thu trùng đã được xử lý. Dữ liệu thanh toán đã được cập nhật.',
                  title: 'Đã xử lý giao dịch trùng',
                  tone: 'success',
                },
          )
          setDuplicateTarget(null)
        },
      },
    )
  }

  const closeDuplicateDialog = () => {
    if (resolveDuplicateMutation.isPending) {
      return
    }

    resolveDuplicateMutation.reset()
    setDuplicateTarget(null)
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Quản lý"
        title="Thanh toán và đối soát"
        description="Theo dõi các khoản thanh toán và xử lý các giao dịch cần đối soát."
        actions={
          <div className="flex flex-wrap gap-2">
            {staleRefundCount > 0 ? (
              <Button onClick={showPendingRefunds} variant="outline">
                Yêu cầu hoàn tiền quá hạn ({staleRefundCount})
              </Button>
            ) : null}
            <Button onClick={showReviewQueue} variant="outline">
              Hàng đợi đối soát
            </Button>
          </div>
        }
      />

      {staleRefundCount > 0 ? (
        <Alert tone="warning" title="Có yêu cầu hoàn tiền VNPay chờ quá 7 ngày">
          {staleRefundCount} giao dịch cần được kiểm tra. Chỉ báo áp dụng cho
          toàn bộ kết quả, không chỉ trang đang xem.
        </Alert>
      ) : null}

      {actionFeedback ? (
        <Alert tone={actionFeedback.tone} title={actionFeedback.title}>
          {actionFeedback.message}
        </Alert>
      ) : null}

      {status === 'REQUIRES_REVIEW' ? (
        <Alert tone="warning" title="Hàng đợi cần đối soát">
          Danh sách này gồm các giao dịch cần kiểm tra, như thanh toán đến sau
          khi đặt phòng đã hủy hoặc khoản thanh toán trùng. Mở từng giao dịch để
          chọn hướng xử lý phù hợp.
        </Alert>
      ) : null}

      {reconcileMutation.isError ? (
        <Alert tone="error" title="Không thể đối soát hoàn tiền">
          {getPaymentActionError(reconcileMutation.error)}
        </Alert>
      ) : null}

      {resolveDuplicateMutation.isError ? (
        <Alert tone="error" title="Không thể xử lý giao dịch trùng">
          <div className="grid gap-2">
            <span>
              {getPaymentActionError(resolveDuplicateMutation.error)}
            </span>
            {resolveDuplicateMutation.error instanceof ApiError &&
            (resolveDuplicateMutation.error.errorCode ===
              'PAYMENT_REFUND_OUTCOME_UNKNOWN' ||
              resolveDuplicateMutation.error.isStatus(503)) ? (
              <Button
                className="w-fit"
                disabled={reconcileMutation.isPending}
                onClick={() => {
                  const paymentId =
                    resolveDuplicateMutation.variables?.paymentId
                  if (paymentId && !reconcileMutation.isPending) {
                    reconcileMutation.mutate(paymentId)
                  }
                }}
                variant="outline"
              >
                Đối soát ngay
              </Button>
            ) : null}
          </div>
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
        <LoadingState label="Đang tải danh sách thanh toán…" />
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
                            'Khoản hoàn tiền đã được ghi nhận. Trạng thái đặt phòng và lịch phòng đã được cập nhật.',
                          title: 'Đối soát hoàn tiền thành công',
                          tone: 'success',
                        }
                      : {
                          message:
                            'VNPay vẫn đang xử lý. Không gửi thêm yêu cầu hoàn tiền; hãy đối soát lại sau.',
                          title: 'Hoàn tiền vẫn đang chờ',
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
            onResolveDuplicate={(payment) => {
              if (resolveDuplicateMutation.isPending) {
                return
              }
              setActionFeedback(undefined)
              resolveDuplicateMutation.reset()
              setDuplicateTarget(payment)
            }}
            payments={paymentsQuery.data.data}
            reconcilingPaymentId={
              reconcileMutation.isPending
                ? reconcileMutation.variables
                : undefined
            }
            resolvingDuplicatePaymentId={
              resolveDuplicateMutation.isPending
                ? resolveDuplicateMutation.variables.paymentId
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
        description="Hoàn toàn bộ khoản thanh toán trước khi khách nhận phòng. Với VNPay, kết quả có thể cần thêm thời gian xác nhận."
        onCancel={closeRefundDialog}
        onConfirm={() => void submitRefund()}
        open={refundTarget !== null}
        title={
          refundTarget
            ? 'Hoàn tiền giao dịch này?'
            : 'Hoàn tiền giao dịch?'
        }
      >
        {refundTarget ? (
          <>
            <dl className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-sm">
              <div>
                <dt className="text-slate-500">Đặt phòng</dt>
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
              Hệ thống sẽ kiểm tra trạng thái đặt phòng, khoản thanh toán và
              quyền thao tác khi xác nhận.
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

      <ConfirmationDialog
        busy={resolveDuplicateMutation.isPending}
        cancelLabel="Đóng"
        confirmDisabled={duplicateTarget === null}
        confirmLabel="Xác nhận hoàn giao dịch trùng"
        description="Hoàn riêng giao dịch trùng này qua VNPay. Giao dịch chính của đặt phòng không bị ảnh hưởng."
        onCancel={closeDuplicateDialog}
        onConfirm={() => void confirmResolveDuplicate()}
        open={duplicateTarget !== null}
        tone="danger"
        title={
          duplicateTarget
            ? 'Xử lý giao dịch trùng?'
            : 'Xử lý giao dịch trùng?'
        }
      >
        {duplicateTarget ? (
          <>
            <dl className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-sm">
              <div>
                <dt className="text-slate-500">Đặt phòng</dt>
                <dd className="mt-1 font-semibold">
                  <Link
                    className="text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    to={`/management/bookings/${duplicateTarget.bookingId}`}
                  >
                    #{duplicateTarget.bookingId}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Giao dịch trùng</dt>
                <dd className="mt-1 font-semibold text-slate-950">
                  #{duplicateTarget.id}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Giao dịch chính (thành công)</dt>
                <dd className="mt-1 font-semibold text-slate-950">
                  #{duplicateTarget.reviewCanonicalPaymentId ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Số tiền hoàn</dt>
                <dd className="mt-1 font-semibold text-slate-950">
                  {formatMoney(duplicateTarget.amount)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Phương thức</dt>
                <dd className="mt-1 font-semibold text-slate-950">
                  {getPaymentMethodLabel(duplicateTarget.method)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Tham chiếu cổng</dt>
                <dd className="mt-1 break-all font-mono text-xs text-slate-950">
                  {duplicateTarget.gatewayReference ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Lý do cần đối soát</dt>
                <dd className="mt-1 font-semibold text-slate-950">
                  {duplicateTarget.reviewReason
                    ? getPaymentReviewReasonLabel(duplicateTarget.reviewReason)
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Thanh toán lúc</dt>
                <dd className="mt-1 font-semibold text-slate-950">
                  {formatDateTime(duplicateTarget.paidAt)}
                </dd>
              </div>
            </dl>

            <Alert className="mt-4" tone="warning">
              Chỉ hoàn tiền giao dịch trùng này. Giao dịch chính vẫn giữ nguyên
              cho đặt phòng; hệ thống sẽ kiểm tra lại trạng thái khi xác nhận.
            </Alert>
          </>
        ) : null}
      </ConfirmationDialog>
    </div>
  )
}

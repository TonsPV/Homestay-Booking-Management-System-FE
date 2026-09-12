import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'

import { useAuth } from '@/auth/useAuth'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { ConfirmationDialog } from '@/shared/components/ConfirmationDialog'
import {
  Alert,
  ErrorState,
  LoadingState,
} from '@/shared/components/Feedback'
import { Field, Textarea } from '@/shared/components/FormControls'
import { LinkButton } from '@/shared/components/LinkButton'
import { PageHeader } from '@/shared/components/PageHeader'
import {
  formatDateTime,
  formatMoney,
} from '@/shared/formatting/formatters'

import { getPaymentMethodLabel } from '../components/paymentLabels'
import { PaymentStatusBadge } from '../components/PaymentStatusBadge'
import { getPaymentActionError } from '../errors'
import {
  getPaymentReviewExplanation,
  getPaymentReviewReasonLabel,
  isDuplicateChargeResolutionEligible,
  isStandardRefundEligible,
} from '../payment-review'
import {
  useManagementPayment,
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
  refundPaymentFormSchema,
  type RefundPaymentFormValues,
} from '../schemas'

interface PaymentActionFeedback {
  message: string
  title: string
  tone: 'info' | 'success' | 'warning'
}

interface PaymentDetailPageProps {
  bookingBasePath?: string
  paymentBasePath?: string
}

export function PaymentDetailPage({
  bookingBasePath = '/management/bookings',
  paymentBasePath = '/management/payments',
}: PaymentDetailPageProps) {
  const { paymentId } = useParams()
  const { principal } = useAuth()
  const paymentQuery = useManagementPayment(paymentId)
  const refundMutation = useRefundPayment()
  const resolveDuplicateMutation = useResolveDuplicateCharge()
  const reconcileMutation = useReconcileVnPayRefund()

  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [actionFeedback, setActionFeedback] = useState<PaymentActionFeedback>()

  const canRefund =
    principal?.actorType === 'user' && principal.role === 'ADMIN'

  const refundForm = useForm<RefundPaymentFormValues>({
    defaultValues: { reason: '' },
    resolver: zodResolver(refundPaymentFormSchema),
  })

  if (paymentQuery.isPending) {
    return <LoadingState label="Đang tải chi tiết thanh toán…" />
  }

  if (paymentQuery.isError || !paymentQuery.data) {
    return (
      <ErrorState
        description={
          paymentQuery.error
            ? getPaymentActionError(paymentQuery.error)
            : 'Không tìm thấy thông tin giao dịch thanh toán.'
        }
        onRetry={() => void paymentQuery.refetch()}
      />
    )
  }

  const payment = paymentQuery.data
  const reviewExplanation = getPaymentReviewExplanation(payment)

  const handleRefundSubmit = refundForm.handleSubmit((values) => {
    setActionFeedback(undefined)
    refundMutation.mutate(
      {
        paymentId: payment.id,
        idempotencyKey: getOrCreateRefundPaymentKey(payment.id),
        input: { reason: values.reason.trim() || undefined },
      },
      {
        onSuccess: (result) => {
          if (result.status === 'REFUNDED') {
            clearRefundPaymentKey(result.id)
          }
          setActionFeedback(
            result.status === 'REFUND_PENDING'
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
          setRefundDialogOpen(false)
          refundForm.reset()
          void paymentQuery.refetch()
        },
      },
    )
  })

  const handleResolveDuplicateConfirm = () => {
    setActionFeedback(undefined)
    resolveDuplicateMutation.mutate(
      {
        idempotencyKey: getOrCreateDuplicateResolutionKey(payment.id),
        paymentId: payment.id,
      },
      {
        onSuccess: (result) => {
          if (result.status === 'REFUNDED') {
            clearDuplicateResolutionKey(result.id)
          }
          setActionFeedback(
            result.status === 'REFUND_PENDING'
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
          setDuplicateDialogOpen(false)
          void paymentQuery.refetch()
        },
      },
    )
  }

  const handleReconcile = () => {
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
        void paymentQuery.refetch()
      },
    })
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Quản lý thanh toán"
        title={`Giao dịch #${payment.id}`}
        description="Thông tin chi tiết giao dịch, đối soát cổng thanh toán và lịch sử hoàn tiền."
        actions={
          <div className="flex flex-wrap gap-2">
            <LinkButton to={paymentBasePath} variant="outline">
              Quay lại danh sách
            </LinkButton>
            {canRefund && payment.status === 'REFUND_PENDING' ? (
              <Button
                loading={reconcileMutation.isPending}
                onClick={handleReconcile}
                variant="outline"
              >
                Đối soát hoàn tiền
              </Button>
            ) : null}
            {canRefund && isDuplicateChargeResolutionEligible(payment) ? (
              <Button
                loading={resolveDuplicateMutation.isPending}
                onClick={() => {
                  resolveDuplicateMutation.reset()
                  setDuplicateDialogOpen(true)
                }}
                variant="outline"
              >
                Xử lý giao dịch trùng
              </Button>
            ) : null}
            {canRefund && isStandardRefundEligible(payment) ? (
              <Button
                onClick={() => {
                  refundMutation.reset()
                  refundForm.reset()
                  setRefundDialogOpen(true)
                }}
                variant="danger"
              >
                Hoàn tiền
              </Button>
            ) : null}
          </div>
        }
      />

      {actionFeedback ? (
        <Alert tone={actionFeedback.tone} title={actionFeedback.title}>
          {actionFeedback.message}
        </Alert>
      ) : null}

      {payment.status === 'REFUND_PENDING' ? (
        <Alert tone="warning" title="Yêu cầu hoàn tiền đang xử lý">
          Kết quả hoàn tiền VNPay chưa được xác định. Hãy dùng nút đối soát thay
          vì gửi yêu cầu hoàn tiền lần hai.
        </Alert>
      ) : null}

      {payment.status === 'REQUIRES_REVIEW' ? (
        <Alert tone="warning" title="Giao dịch cần đối soát thủ công">
          {reviewExplanation ??
            'Giao dịch VNPay được ghi nhận sau khi đặt phòng đã hủy. Cần đối soát trước khi hoàn tiền.'}
        </Alert>
      ) : null}

      {reconcileMutation.isError ? (
        <Alert tone="error" title="Không thể đối soát hoàn tiền">
          {getPaymentActionError(reconcileMutation.error)}
        </Alert>
      ) : null}

      {resolveDuplicateMutation.isError ? (
        <Alert tone="error" title="Không thể xử lý giao dịch trùng">
          {getPaymentActionError(resolveDuplicateMutation.error)}
        </Alert>
      ) : null}

      {/* 1. Tổng quan giao dịch */}
      <Card>
        <h2 className="text-base font-bold text-ink">Tổng quan giao dịch</h2>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-muted">Mã giao dịch</dt>
            <dd className="mt-1 font-bold text-ink">#{payment.id}</dd>
          </div>
          <div>
            <dt className="text-muted">Mã đặt phòng</dt>
            <dd className="mt-1 font-bold text-brand-strong">
              <Link
                className="hover:underline focus-visible:outline-2 focus-visible:outline-brand"
                to={`${bookingBasePath}/${payment.bookingId}`}
              >
                #{payment.bookingId}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-muted">Số tiền</dt>
            <dd className="mt-1 font-bold text-ink">
              {formatMoney(payment.amount)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Phương thức</dt>
            <dd className="mt-1 font-semibold text-ink">
              {getPaymentMethodLabel(payment.method)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Trạng thái</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-1.5">
              <PaymentStatusBadge status={payment.status} />
              {payment.reviewReason ? (
                <Badge tone="rose">
                  {getPaymentReviewReasonLabel(payment.reviewReason)}
                </Badge>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Thời gian tạo</dt>
            <dd className="mt-1 text-ink">{formatDateTime(payment.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-muted">Thời gian thanh toán</dt>
            <dd className="mt-1 text-ink">{formatDateTime(payment.paidAt)}</dd>
          </div>
          <div>
            <dt className="text-muted">Người ghi nhận</dt>
            <dd className="mt-1 text-ink">
              {payment.createdByUser?.fullName ?? '—'}
            </dd>
          </div>
        </dl>
      </Card>

      {/* 2. Metadata kỹ thuật cổng thanh toán */}
      <Card>
        <h2 className="text-base font-bold text-ink">
          Thông số kỹ thuật cổng thanh toán
        </h2>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">Cổng thanh toán</dt>
            <dd className="mt-1 font-semibold text-ink">
              {payment.gatewayName ?? 'VNPay'}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Mã tham chiếu cổng</dt>
            <dd className="mt-1 break-all font-mono text-xs text-ink">
              {payment.gatewayReference ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Mã giao dịch cổng</dt>
            <dd className="mt-1 break-all font-mono text-xs text-ink">
              {payment.gatewayTransactionId ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Mã phản hồi cổng (Response Code)</dt>
            <dd className="mt-1 font-mono text-xs text-ink">
              {payment.gatewayResponseCode ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Trạng thái giao dịch cổng</dt>
            <dd className="mt-1 font-mono text-xs text-ink">
              {payment.gatewayTransactionStatus ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Thời gian giao dịch cổng</dt>
            <dd className="mt-1 text-ink">
              {formatDateTime(payment.gatewayTransactionDate)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Hết hạn giao dịch</dt>
            <dd className="mt-1 text-ink">
              {formatDateTime(payment.expiresAt)}
            </dd>
          </div>
        </dl>
      </Card>

      {/* 3. Hoàn tiền & Đối soát */}
      <Card>
        <h2 className="text-base font-bold text-ink">
          Thông tin hoàn tiền & Đối soát
        </h2>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">Mã yêu cầu hoàn (Refund Request ID)</dt>
            <dd className="mt-1 break-all font-mono text-xs text-ink">
              {payment.refundRequestId ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Mã giao dịch hoàn cổng</dt>
            <dd className="mt-1 break-all font-mono text-xs text-ink">
              {payment.refundGatewayTransactionId ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Mã phản hồi hoàn</dt>
            <dd className="mt-1 font-mono text-xs text-ink">
              {payment.refundResponseCode ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Trạng thái hoàn cổng</dt>
            <dd className="mt-1 font-mono text-xs text-ink">
              {payment.refundTransactionStatus ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Thời gian yêu cầu hoàn</dt>
            <dd className="mt-1 text-ink">
              {formatDateTime(payment.refundRequestedAt)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Thời gian hoàn tiền</dt>
            <dd className="mt-1 text-ink">{formatDateTime(payment.refundedAt)}</dd>
          </div>
          <div>
            <dt className="text-muted">Đối soát gần nhất</dt>
            <dd className="mt-1 text-ink">
              {formatDateTime(payment.refundLastQueriedAt)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Người hoàn tiền</dt>
            <dd className="mt-1 text-ink">
              {payment.refundedByUser?.fullName ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Lý do hoàn tiền</dt>
            <dd className="mt-1 text-ink">{payment.refundReason ?? '—'}</dd>
          </div>
          {payment.reviewReason ? (
            <div className="sm:col-span-2">
              <dt className="text-muted">Thông tin xử lý giao dịch trùng</dt>
              <dd className="mt-1 font-medium text-ink">
                Lý do cần đối soát:{' '}
                <span className="font-semibold">
                  {getPaymentReviewReasonLabel(payment.reviewReason)}
                </span>
                {payment.reviewCanonicalPaymentId ? (
                  <span className="ml-2">
                    · Giao dịch chính thành công:{' '}
                    <Link
                      className="font-bold text-brand-strong hover:underline"
                      to={`${paymentBasePath}/${payment.reviewCanonicalPaymentId}`}
                    >
                      #{payment.reviewCanonicalPaymentId}
                    </Link>
                  </span>
                ) : null}
              </dd>
            </div>
          ) : null}
        </dl>
      </Card>

      {/* Refund Confirmation Dialog */}
      <ConfirmationDialog
        busy={refundMutation.isPending}
        cancelLabel="Đóng"
        confirmLabel="Xác nhận hoàn tiền"
        description="Hoàn toàn bộ khoản thanh toán trước khi khách nhận phòng. Với VNPay, kết quả có thể cần thêm thời gian xác nhận."
        onCancel={() => {
          if (!refundMutation.isPending) {
            refundMutation.reset()
            refundForm.reset()
            setRefundDialogOpen(false)
          }
        }}
        onConfirm={() => void handleRefundSubmit()}
        open={refundDialogOpen}
        title="Hoàn tiền giao dịch này?"
        tone="danger"
      >
        <dl className="grid grid-cols-2 gap-4 rounded-card bg-surface-muted p-4 text-sm">
          <div>
            <dt className="text-muted">Đặt phòng</dt>
            <dd className="mt-1 font-semibold text-ink">
              #{payment.bookingId}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Phương thức</dt>
            <dd className="mt-1 font-semibold text-ink">
              {getPaymentMethodLabel(payment.method)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Số tiền hoàn</dt>
            <dd className="mt-1 font-semibold text-ink">
              {formatMoney(payment.amount)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Thanh toán lúc</dt>
            <dd className="mt-1 font-semibold text-ink">
              {formatDateTime(payment.paidAt)}
            </dd>
          </div>
        </dl>

        <div className="mt-4">
          <Field
            label="Lý do hoàn tiền"
            error={refundForm.formState.errors.reason?.message}
          >
            <Textarea
              {...refundForm.register('reason')}
              placeholder="Nhập lý do hoàn tiền (không bắt buộc)"
            />
          </Field>
        </div>

        {refundMutation.isError ? (
          <Alert className="mt-4" tone="error">
            {getPaymentActionError(refundMutation.error)}
          </Alert>
        ) : null}
      </ConfirmationDialog>

      {/* Duplicate Charge Confirmation Dialog */}
      <ConfirmationDialog
        busy={resolveDuplicateMutation.isPending}
        cancelLabel="Đóng"
        confirmLabel="Xác nhận hoàn giao dịch trùng"
        description="Hoàn riêng giao dịch trùng này qua VNPay. Giao dịch chính của đặt phòng không bị ảnh hưởng."
        onCancel={() => {
          if (!resolveDuplicateMutation.isPending) {
            resolveDuplicateMutation.reset()
            setDuplicateDialogOpen(false)
          }
        }}
        onConfirm={handleResolveDuplicateConfirm}
        open={duplicateDialogOpen}
        title="Xử lý giao dịch trùng?"
        tone="danger"
      >
        <dl className="grid grid-cols-2 gap-4 rounded-card bg-surface-muted p-4 text-sm">
          <div>
            <dt className="text-muted">Đặt phòng</dt>
            <dd className="mt-1 font-semibold text-ink">
              #{payment.bookingId}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Giao dịch chính (thành công)</dt>
            <dd className="mt-1 font-semibold text-ink">
              #{payment.reviewCanonicalPaymentId ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Số tiền hoàn</dt>
            <dd className="mt-1 font-semibold text-ink">
              {formatMoney(payment.amount)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Tham chiếu cổng</dt>
            <dd className="mt-1 break-all font-mono text-xs text-ink">
              {payment.gatewayReference ?? '—'}
            </dd>
          </div>
        </dl>

        {resolveDuplicateMutation.isError ? (
          <Alert className="mt-4" tone="error">
            {getPaymentActionError(resolveDuplicateMutation.error)}
          </Alert>
        ) : null}
      </ConfirmationDialog>
    </div>
  )
}

import { Link } from 'react-router-dom'

import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { EmptyState } from '@/shared/components/Feedback'
import { formatDateTime, formatMoney } from '@/shared/formatting/formatters'

import {
  getPaymentReviewExplanation,
  getPaymentReviewReasonLabel,
  isDuplicateChargeResolutionEligible,
  isStandardRefundEligible,
} from '../payment-review'
import type { Payment } from '../types'
import { getPaymentMethodLabel } from './paymentLabels'
import { PaymentStatusBadge } from './PaymentStatusBadge'

interface PaymentListProps {
  bookingBasePath?: string
  canRefund?: boolean
  management?: boolean
  onReconcile?: (payment: Payment) => void
  onRefund?: (payment: Payment) => void
  onResolveDuplicate?: (payment: Payment) => void
  payments: Payment[]
  reconcilingPaymentId?: string
  resolvingDuplicatePaymentId?: string
}

interface PaymentItemProps {
  bookingBasePath?: string
  canRefund: boolean
  management: boolean
  onReconcile?: (payment: Payment) => void
  onRefund?: (payment: Payment) => void
  onResolveDuplicate?: (payment: Payment) => void
  payment: Payment
  reconcilingPaymentId?: string
  resolvingDuplicatePaymentId?: string
}

function BookingReference({
  bookingBasePath,
  management,
  payment,
}: {
  bookingBasePath?: string
  management: boolean
  payment: Payment
}) {
  const basePath =
    bookingBasePath ?? (management ? '/management/bookings' : undefined)

  return basePath ? (
    <Link
      className="font-semibold text-brand-strong hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      to={`${basePath}/${payment.bookingId}`}
    >
      #{payment.bookingId}
    </Link>
  ) : (
    <span className="font-semibold text-ink">#{payment.bookingId}</span>
  )
}

function GatewayDetails({ payment }: { payment: Payment }) {
  const hasGatewayDetails = Boolean(
    payment.gatewayName ||
    payment.gatewayReference ||
    payment.gatewayTransactionId ||
    payment.gatewayResponseCode ||
    payment.gatewayTransactionStatus ||
    payment.refundRequestId ||
    payment.refundResponseCode ||
    payment.refundTransactionStatus,
  )

  if (!hasGatewayDetails) {
    return <span className="text-muted">—</span>
  }

  return (
    <dl className="grid gap-1 text-xs">
      {payment.gatewayName ? (
        <div>
          <dt className="inline text-muted">Cổng: </dt>
          <dd className="inline font-semibold text-ink">
            {payment.gatewayName}
          </dd>
        </div>
      ) : null}
      {payment.gatewayReference ? (
        <div className="break-all">
          <dt className="inline text-muted">Tham chiếu: </dt>
          <dd className="inline font-mono text-ink">
            {payment.gatewayReference}
          </dd>
        </div>
      ) : null}
      {payment.gatewayTransactionId ? (
        <div className="break-all">
          <dt className="inline text-muted">Mã giao dịch: </dt>
          <dd className="inline font-mono text-ink">
            {payment.gatewayTransactionId}
          </dd>
        </div>
      ) : null}
      {payment.gatewayResponseCode ? (
        <div>
          <dt className="inline text-muted">Mã phản hồi: </dt>
          <dd className="inline font-mono text-ink">
            {payment.gatewayResponseCode}
          </dd>
        </div>
      ) : null}
      {payment.gatewayTransactionStatus ? (
        <div>
          <dt className="inline text-muted">Trạng thái cổng: </dt>
          <dd className="inline font-mono text-ink">
            {payment.gatewayTransactionStatus}
          </dd>
        </div>
      ) : null}
      {payment.refundRequestId ? (
        <div className="break-all">
          <dt className="inline text-muted">Mã yêu cầu hoàn: </dt>
          <dd className="inline font-mono text-ink">
            {payment.refundRequestId}
          </dd>
        </div>
      ) : null}
      {payment.refundResponseCode ? (
        <div>
          <dt className="inline text-muted">Mã phản hồi hoàn: </dt>
          <dd className="inline font-mono text-ink">
            {payment.refundResponseCode}
          </dd>
        </div>
      ) : null}
      {payment.refundTransactionStatus ? (
        <div>
          <dt className="inline text-muted">Trạng thái hoàn: </dt>
          <dd className="inline font-mono text-ink">
            {payment.refundTransactionStatus}
          </dd>
        </div>
      ) : null}
    </dl>
  )
}

function PaymentTimeline({ payment }: { payment: Payment }) {
  return (
    <dl className="grid gap-1 text-xs">
      <div>
        <dt className="inline text-muted">Tạo: </dt>
        <dd className="inline text-ink">{formatDateTime(payment.createdAt)}</dd>
      </div>
      {payment.paidAt ? (
        <div>
          <dt className="inline text-muted">Thanh toán: </dt>
          <dd className="inline text-ink">{formatDateTime(payment.paidAt)}</dd>
        </div>
      ) : null}
      {payment.refundedAt ? (
        <div>
          <dt className="inline text-muted">Hoàn tiền: </dt>
          <dd className="inline text-ink">
            {formatDateTime(payment.refundedAt)}
          </dd>
        </div>
      ) : null}
      {payment.refundRequestedAt ? (
        <div>
          <dt className="inline text-muted">Yêu cầu hoàn: </dt>
          <dd className="inline text-ink">
            {formatDateTime(payment.refundRequestedAt)}
          </dd>
        </div>
      ) : null}
      {payment.refundLastQueriedAt ? (
        <div>
          <dt className="inline text-muted">Đối soát gần nhất: </dt>
          <dd className="inline text-ink">
            {formatDateTime(payment.refundLastQueriedAt)}
          </dd>
        </div>
      ) : null}
      {payment.expiresAt ? (
        <div>
          <dt className="inline text-muted">Hết hạn: </dt>
          <dd className="inline text-ink">
            {formatDateTime(payment.expiresAt)}
          </dd>
        </div>
      ) : null}
      {payment.createdByUser ? (
        <div>
          <dt className="inline text-muted">Người ghi nhận: </dt>
          <dd className="inline text-ink">{payment.createdByUser.fullName}</dd>
        </div>
      ) : null}
      {payment.refundedByUser ? (
        <div>
          <dt className="inline text-muted">Người hoàn: </dt>
          <dd className="inline text-ink">{payment.refundedByUser.fullName}</dd>
        </div>
      ) : null}
    </dl>
  )
}

function PaymentLifecycleNote({ payment }: { payment: Payment }) {
  if (payment.status === 'REFUND_PENDING') {
    return (
      <p className="mt-3 rounded-card border border-warning/20 bg-warning-soft px-3 py-2 text-sm text-ink">
        Kết quả hoàn tiền VNPay chưa được xác định. Hãy đối soát trước khi gửi
        một yêu cầu hoàn tiền khác.
      </p>
    )
  }

  if (payment.status === 'REQUIRES_REVIEW') {
    const explanation = getPaymentReviewExplanation(payment)

    return (
      <p className="mt-3 rounded-card border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger-strong">
        {explanation ??
          'Giao dịch cần đối soát thủ công; không tự khôi phục booking.'}
      </p>
    )
  }

  if (
    payment.status === 'FAILED' &&
    (payment.gatewayResponseCode === 'CANCELLED' ||
      payment.gatewayResponseCode === 'EXPIRED')
  ) {
    return (
      <p className="mt-3 rounded-card bg-surface-muted px-3 py-2 text-xs text-muted">
        Attempt đã được hệ thống đóng theo vòng đời booking. Trạng thái này
        không tự khẳng định giao dịch ngân hàng thất bại.
      </p>
    )
  }

  return null
}

function ReconcileButton({
  canRefund,
  onReconcile,
  payment,
  reconcilingPaymentId,
}: Omit<PaymentItemProps, 'management' | 'onRefund'>) {
  if (!canRefund || payment.status !== 'REFUND_PENDING' || !onReconcile) {
    return null
  }

  return (
    <Button
      aria-label={`Đối soát hoàn tiền giao dịch #${payment.id}`}
      className="min-h-9 px-3 py-1.5"
      loading={reconcilingPaymentId === payment.id}
      onClick={() => onReconcile(payment)}
      variant="outline"
    >
      Đối soát
    </Button>
  )
}

function RefundButton({
  canRefund,
  onRefund,
  payment,
}: Omit<PaymentItemProps, 'management'>) {
  if (!isStandardRefundEligible(payment) || !canRefund || !onRefund) {
    return null
  }

  return (
    <Button
      aria-label={`Hoàn tiền giao dịch #${payment.id}`}
      className="min-h-9 px-3 py-1.5"
      onClick={() => onRefund(payment)}
      variant="outline"
    >
      Hoàn tiền
    </Button>
  )
}

function ResolveDuplicateButton({
  canRefund,
  onResolveDuplicate,
  payment,
  resolvingDuplicatePaymentId,
}: Omit<PaymentItemProps, 'management' | 'onRefund' | 'onReconcile'>) {
  if (
    !canRefund ||
    !isDuplicateChargeResolutionEligible(payment) ||
    !onResolveDuplicate
  ) {
    return null
  }

  return (
    <Button
      aria-label={`Xử lý giao dịch trùng #${payment.id}`}
      className="min-h-9 px-3 py-1.5"
      loading={resolvingDuplicatePaymentId === payment.id}
      onClick={() => onResolveDuplicate(payment)}
      variant="outline"
    >
      Xử lý giao dịch trùng
    </Button>
  )
}

function ReviewReasonBadge({ payment }: { payment: Payment }) {
  if (
    payment.status !== 'REQUIRES_REVIEW' ||
    !payment.reviewReason
  ) {
    return null
  }

  return (
    <Badge tone="rose">
      {getPaymentReviewReasonLabel(payment.reviewReason)}
    </Badge>
  )
}

function PaymentCards({
  bookingBasePath,
  canRefund,
  management,
  onReconcile,
  onRefund,
  onResolveDuplicate,
  payments,
  reconcilingPaymentId,
  resolvingDuplicatePaymentId,
}: PaymentListProps & {
  canRefund: boolean
  management: boolean
}) {
  return (
    <ul className="grid gap-3">
      {payments.map((payment) => (
        <li key={payment.id}>
          <Card className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-ink">
                    {getPaymentMethodLabel(payment.method)}
                  </p>
                  <PaymentStatusBadge status={payment.status} />
                  <ReviewReasonBadge payment={payment} />
                </div>
                <p className="mt-1 text-sm text-muted">
                  Giao dịch #{payment.id} · Booking{' '}
                  <BookingReference
                    bookingBasePath={bookingBasePath}
                    management={management}
                    payment={payment}
                  />
                </p>
                <p className="mt-2 text-lg font-black text-ink">
                  {formatMoney(payment.amount)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ReconcileButton
                  canRefund={canRefund}
                  onReconcile={onReconcile}
                  payment={payment}
                  reconcilingPaymentId={reconcilingPaymentId}
                />
                <ResolveDuplicateButton
                  canRefund={canRefund}
                  onResolveDuplicate={onResolveDuplicate}
                  payment={payment}
                  resolvingDuplicatePaymentId={resolvingDuplicatePaymentId}
                />
                <RefundButton
                  canRefund={canRefund}
                  onRefund={onRefund}
                  payment={payment}
                />
              </div>
            </div>

            <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">
                  Đối soát
                </p>
                <GatewayDetails payment={payment} />
              </div>
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">
                  Thời gian và người xử lý
                </p>
                <PaymentTimeline payment={payment} />
              </div>
            </div>

            <PaymentLifecycleNote payment={payment} />
          </Card>
        </li>
      ))}
    </ul>
  )
}

function ManagementPaymentTable({
  bookingBasePath,
  canRefund,
  onReconcile,
  onRefund,
  onResolveDuplicate,
  payments,
  reconcilingPaymentId,
  resolvingDuplicatePaymentId,
}: Omit<PaymentListProps, 'management'> & { canRefund: boolean }) {
  return (
    <div className="hidden overflow-x-auto rounded-panel border border-line bg-surface shadow-card lg:block">
      <table className="min-w-[72rem] w-full border-collapse text-left text-sm">
        <caption className="sr-only">
          Danh sách giao dịch thanh toán toàn hệ thống
        </caption>
        <thead className="bg-surface-muted text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-3" scope="col">
              Giao dịch
            </th>
            <th className="px-4 py-3" scope="col">
              Booking
            </th>
            <th className="px-4 py-3" scope="col">
              Phương thức
            </th>
            <th className="px-4 py-3" scope="col">
              Số tiền
            </th>
            <th className="px-4 py-3" scope="col">
              Trạng thái
            </th>
            <th className="px-4 py-3" scope="col">
              Đối soát
            </th>
            <th className="px-4 py-3" scope="col">
              Thời gian
            </th>
            <th className="px-4 py-3 text-right" scope="col">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {payments.map((payment) => (
            <tr
              className={
                payment.status === 'REQUIRES_REVIEW'
                  ? 'bg-danger-soft align-top'
                  : 'align-top hover:bg-surface-muted'
              }
              key={payment.id}
            >
              <th
                className="whitespace-nowrap px-4 py-3 font-semibold text-ink"
                scope="row"
              >
                #{payment.id}
              </th>
              <td className="px-4 py-3">
                <BookingReference
                  bookingBasePath={bookingBasePath}
                  management
                  payment={payment}
                />
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">
                {getPaymentMethodLabel(payment.method)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-bold text-ink">
                {formatMoney(payment.amount)}
              </td>
              <td className="px-4 py-3">
                <PaymentStatusBadge status={payment.status} />
                <ReviewReasonBadge payment={payment} />
                {payment.status === 'REQUIRES_REVIEW' ? (
                  <p className="mt-2 max-w-44 text-xs leading-5 text-danger-strong">
                    {getPaymentReviewExplanation(payment) ??
                      'Cần đối soát thủ công, không tự khôi phục booking.'}
                  </p>
                ) : null}
              </td>
              <td className="max-w-64 px-4 py-3">
                <GatewayDetails payment={payment} />
              </td>
              <td className="max-w-64 px-4 py-3">
                <PaymentTimeline payment={payment} />
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <ReconcileButton
                    canRefund={canRefund}
                    onReconcile={onReconcile}
                    payment={payment}
                    reconcilingPaymentId={reconcilingPaymentId}
                  />
                  <ResolveDuplicateButton
                    canRefund={canRefund}
                    onResolveDuplicate={onResolveDuplicate}
                    payment={payment}
                    resolvingDuplicatePaymentId={resolvingDuplicatePaymentId}
                  />
                  <RefundButton
                    canRefund={canRefund}
                    onRefund={onRefund}
                    payment={payment}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function PaymentList({
  bookingBasePath,
  canRefund = false,
  management = false,
  onReconcile,
  onRefund,
  onResolveDuplicate,
  payments,
  reconcilingPaymentId,
  resolvingDuplicatePaymentId,
}: PaymentListProps) {
  if (payments.length === 0) {
    return (
      <EmptyState
        title="Chưa có giao dịch"
        description="Lịch sử thanh toán sẽ xuất hiện tại đây."
      />
    )
  }

  if (!management) {
    return (
      <PaymentCards
        bookingBasePath={bookingBasePath}
        canRefund={canRefund}
        management={false}
        onReconcile={onReconcile}
        onRefund={onRefund}
        onResolveDuplicate={onResolveDuplicate}
        payments={payments}
        reconcilingPaymentId={reconcilingPaymentId}
        resolvingDuplicatePaymentId={resolvingDuplicatePaymentId}
      />
    )
  }

  return (
    <>
      <ManagementPaymentTable
        bookingBasePath={bookingBasePath}
        canRefund={canRefund}
        onReconcile={onReconcile}
        onRefund={onRefund}
        onResolveDuplicate={onResolveDuplicate}
        payments={payments}
        reconcilingPaymentId={reconcilingPaymentId}
        resolvingDuplicatePaymentId={resolvingDuplicatePaymentId}
      />
      <div className="lg:hidden">
        <PaymentCards
          bookingBasePath={bookingBasePath}
          canRefund={canRefund}
          management
          onReconcile={onReconcile}
          onRefund={onRefund}
          onResolveDuplicate={onResolveDuplicate}
          payments={payments}
          reconcilingPaymentId={reconcilingPaymentId}
          resolvingDuplicatePaymentId={resolvingDuplicatePaymentId}
        />
      </div>
    </>
  )
}

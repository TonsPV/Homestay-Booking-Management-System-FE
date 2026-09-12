import { Card } from '@/shared/components/Card'
import { EmptyState } from '@/shared/components/Feedback'
import {
  formatDateTime,
  formatMoney,
} from '@/shared/formatting/formatters'

import type { CustomerPayment } from '../types'
import { getPaymentMethodLabel } from './paymentLabels'
import { PaymentStatusBadge } from './PaymentStatusBadge'

function getCustomerStatusMessage(payment: CustomerPayment) {
  switch (payment.status) {
    case 'PENDING':
      return 'Giao dịch đang được xử lý. Bạn chưa cần thanh toán lại.'
    case 'FAILED':
      return 'Thanh toán chưa thành công. Bạn có thể thử lại khi đặt phòng vẫn còn hiệu lực.'
    case 'REQUIRES_REVIEW':
      return 'Homi Stay đang kiểm tra giao dịch này. Chúng tôi sẽ cập nhật trạng thái đặt phòng sau khi có kết quả.'
    case 'REFUND_PENDING':
      return 'Yêu cầu hoàn tiền đang được xử lý. Vui lòng chờ kết quả trước khi gửi yêu cầu khác.'
    case 'REFUNDED':
      return 'Khoản thanh toán đã được ghi nhận hoàn tiền.'
    default:
      return null
  }
}

function CustomerPaymentTimeline({
  payment,
}: {
  payment: CustomerPayment
}) {
  return (
    <dl className="mt-4 grid gap-1 border-t border-line pt-3 text-xs">
      <div>
        <dt className="inline text-muted">Bắt đầu: </dt>
        <dd className="inline text-ink">
          {formatDateTime(payment.createdAt)}
        </dd>
      </div>
      {payment.paidAt ? (
        <div>
          <dt className="inline text-muted">Hoàn tất: </dt>
          <dd className="inline text-ink">
            {formatDateTime(payment.paidAt)}
          </dd>
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
      {payment.status === 'PENDING' && payment.expiresAt ? (
        <div>
          <dt className="inline text-muted">Thời hạn xử lý: </dt>
          <dd className="inline text-ink">
            {formatDateTime(payment.expiresAt)}
          </dd>
        </div>
      ) : null}
    </dl>
  )
}

export function CustomerPaymentHistory({
  payments,
}: {
  payments: CustomerPayment[]
}) {
  if (payments.length === 0) {
    return (
      <EmptyState
        title="Chưa có thanh toán"
        description="Các khoản thanh toán của đặt phòng sẽ xuất hiện tại đây."
      />
    )
  }

  return (
    <ul className="grid gap-3" aria-label="Lịch sử thanh toán">
      {payments.map((payment) => {
        const statusMessage = getCustomerStatusMessage(payment)

        return (
          <li key={payment.id}>
            <Card className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-ink">
                    {getPaymentMethodLabel(payment.method)}
                  </p>
                  <p className="mt-1 text-lg font-black text-ink">
                    {formatMoney(payment.amount)}
                  </p>
                </div>
                <PaymentStatusBadge audience="customer" status={payment.status} />
              </div>

              <CustomerPaymentTimeline payment={payment} />

              {statusMessage ? (
                <p className="mt-3 rounded-card bg-surface-muted px-3 py-2 text-sm leading-body text-ink">
                  {statusMessage}
                </p>
              ) : null}
            </Card>
          </li>
        )
      })}
    </ul>
  )
}

import { Badge } from '@/shared/components/Badge'

import type {
  PaymentStatus,
} from '../types'
import { getPaymentStatusLabel } from './paymentLabels'

const statusTones: Record<
  PaymentStatus,
  'amber' | 'emerald' | 'rose' | 'violet' | 'slate'
> = {
  PENDING: 'amber',
  SUCCESS: 'emerald',
  FAILED: 'slate',
  REQUIRES_REVIEW: 'rose',
  REFUND_PENDING: 'amber',
  REFUNDED: 'violet',
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge tone={statusTones[status]}>
      {getPaymentStatusLabel(status)}
    </Badge>
  )
}

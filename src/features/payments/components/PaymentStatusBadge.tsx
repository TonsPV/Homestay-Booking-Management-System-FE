import { Badge } from '@/shared/components/Badge'

import type {
  PaymentStatus,
} from '../types'
import {
  getCustomerPaymentStatusLabel,
  getPaymentStatusLabel,
} from './paymentLabels'

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

export function PaymentStatusBadge({
  audience = 'management',
  status,
}: {
  audience?: 'customer' | 'management'
  status: PaymentStatus
}) {
  return (
    <Badge tone={statusTones[status]}>
      {audience === 'customer'
        ? getCustomerPaymentStatusLabel(status)
        : getPaymentStatusLabel(status)}
    </Badge>
  )
}

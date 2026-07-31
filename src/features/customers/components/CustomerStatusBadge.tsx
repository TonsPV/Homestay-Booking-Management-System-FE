import { Badge } from '@/shared/components/Badge'
import type { AccountStatus } from '@/auth/types'

interface CustomerStatusBadgeProps {
  status: AccountStatus
}

export function CustomerStatusBadge({
  status,
}: CustomerStatusBadgeProps) {
  return status === 'ACTIVE' ? (
    <Badge tone="emerald">Đang hoạt động</Badge>
  ) : (
    <Badge tone="rose">Đã khóa</Badge>
  )
}

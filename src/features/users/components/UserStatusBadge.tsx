import type {
  AccountStatus,
  UserRole,
} from '@/auth/types'
import { Badge } from '@/shared/components/Badge'

export function UserStatusBadge({ status }: { status: AccountStatus }) {
  return status === 'ACTIVE' ? (
    <Badge tone="emerald">Đang hoạt động</Badge>
  ) : (
    <Badge tone="rose">Đã khóa</Badge>
  )
}

export function UserRoleBadge({ role }: { role: UserRole }) {
  return role === 'ADMIN' ? (
    <Badge tone="violet">Quản trị viên</Badge>
  ) : (
    <Badge tone="blue">Nhân viên</Badge>
  )
}

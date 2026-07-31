import type { User } from '@/auth/types'
import { Card } from '@/shared/components/Card'
import { PageHeader } from '@/shared/components/PageHeader'

import { UpdateUserForm } from '../components/UserForms'

interface UserEditPageProps {
  user: User
}

export function UserEditPage({ user }: UserEditPageProps) {
  return (
    <section className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      <PageHeader
        description={`Cập nhật tài khoản #${user.id}.`}
        eyebrow="Quản trị"
        title={user.fullName}
      />
      <Card>
        <UpdateUserForm user={user} />
      </Card>
    </section>
  )
}

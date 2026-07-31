import { Card } from '@/shared/components/Card'
import { PageHeader } from '@/shared/components/PageHeader'

import { CreateUserForm } from '../components/UserForms'

export function UserCreatePage() {
  return (
    <section className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      <PageHeader
        description="Tài khoản được tạo với vai trò Nhân viên."
        eyebrow="Quản trị"
        title="Tạo nhân viên"
      />
      <Card>
        <CreateUserForm />
      </Card>
    </section>
  )
}

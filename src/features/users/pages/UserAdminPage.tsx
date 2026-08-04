import { useState, type FormEvent } from 'react'

import type {
  AccountStatus,
  User,
  UserRole,
} from '@/auth/types'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import {
  Alert,
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/shared/components/Feedback'
import { Field, Input, Select } from '@/shared/components/FormControls'
import { PageHeader } from '@/shared/components/PageHeader'
import { PaginationControls } from '@/shared/components/PaginationControls'
import { formatDateTime } from '@/shared/formatting/formatters'

import {
  CreateUserForm,
  UpdateUserForm,
} from '../components/UserForms'
import { getUserActionError } from '../errors'
import {
  UserRoleBadge,
  UserStatusBadge,
} from '../components/UserStatusBadge'
import {
  useAdminUsersQuery,
  useUpdateUserStatusMutation,
} from '../queries'

const PAGE_SIZE = 20

type EditorState =
  | { mode: 'create' }
  | { mode: 'update'; user: User }
  | null

export function UserAdminPage() {
  const { principal } = useAuth()
  const [draftSearch, setDraftSearch] = useState('')
  const [editor, setEditor] = useState<EditorState>(null)
  const [page, setPage] = useState(1)
  const [role, setRole] = useState<'' | UserRole>('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'' | AccountStatus>('')
  const [successMessage, setSuccessMessage] = useState('')
  const usersQuery = useAdminUsersQuery({
    limit: PAGE_SIZE,
    page,
    role: role || undefined,
    search: search || undefined,
    status: status || undefined,
  })
  const statusMutation = useUpdateUserStatusMutation()

  const applySearch = (event: FormEvent) => {
    event.preventDefault()
    setPage(1)
    setSearch(draftSearch.trim())
  }

  const finishEditing = (message: string) => {
    setEditor(null)
    setSuccessMessage(message)
  }

  const toggleStatus = (user: User) => {
    if (
      user.status === 'ACTIVE' &&
      !window.confirm(
        `Khóa tài khoản của ${user.fullName}? Nhân viên sẽ không thể đăng nhập cho tới khi được mở khóa.`,
      )
    ) {
      return
    }

    setSuccessMessage('')
    statusMutation.mutate(
      {
        id: user.id,
        status: user.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE',
      },
      {
        onSuccess: () =>
          setSuccessMessage(
            user.status === 'ACTIVE'
              ? 'Đã khóa tài khoản nhân viên.'
              : 'Đã mở khóa tài khoản nhân viên.',
          ),
      },
    )
  }

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeader
        actions={
          <Button
            onClick={() => {
              setSuccessMessage('')
              setEditor({ mode: 'create' })
            }}
          >
            Tạo nhân viên
          </Button>
        }
        description="Cấp tài khoản nhân viên, cập nhật thông tin và kiểm soát trạng thái truy cập."
        eyebrow="Quản trị"
        title="Nhân viên"
      />

      {successMessage ? (
        <Alert tone="success">{successMessage}</Alert>
      ) : null}

      {editor ? (
        <Card>
          <div className="mb-6">
            <h2 className="text-xl font-black text-slate-950">
              {editor.mode === 'create'
                ? 'Tạo tài khoản nhân viên'
                : `Cập nhật ${editor.user.fullName}`}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {editor.mode === 'create'
                ? 'Tài khoản mới sẽ có quyền Nhân viên.'
                : `Mã tài khoản #${editor.user.id}`}
            </p>
          </div>
          {editor.mode === 'create' ? (
            <CreateUserForm
              onCancel={() => setEditor(null)}
              onSaved={() => finishEditing('Đã tạo tài khoản nhân viên.')}
            />
          ) : (
            <UpdateUserForm
              onCancel={() => setEditor(null)}
              onSaved={() => finishEditing('Đã cập nhật tài khoản nhân viên.')}
              user={editor.user}
            />
          )}
        </Card>
      ) : null}

      <Card>
        <form
          className="grid gap-3 sm:grid-cols-2 sm:items-end lg:grid-cols-[1fr_170px_180px_auto]"
          onSubmit={applySearch}
        >
          <Field label="Tìm nhân viên">
            <Input
              aria-label="Tìm nhân viên"
              onChange={(event) => setDraftSearch(event.target.value)}
              placeholder="Tên, email hoặc số điện thoại"
              value={draftSearch}
            />
          </Field>
          <Field label="Vai trò">
            <Select
              aria-label="Lọc theo vai trò"
              onChange={(event) => {
                setPage(1)
                setRole(event.target.value as '' | UserRole)
              }}
              value={role}
            >
              <option value="">Tất cả vai trò</option>
              <option value="STAFF">Nhân viên</option>
              <option value="ADMIN">Quản trị viên</option>
            </Select>
          </Field>
          <Field label="Trạng thái">
            <Select
              aria-label="Lọc theo trạng thái"
              onChange={(event) => {
                setPage(1)
                setStatus(event.target.value as '' | AccountStatus)
              }}
              value={status}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="LOCKED">Đã khóa</option>
            </Select>
          </Field>
          <Button type="submit">Tìm kiếm</Button>
        </form>
      </Card>

      {statusMutation.error ? (
        <Alert title="Không thể cập nhật trạng thái" tone="error">
          {getUserActionError(statusMutation.error)}
        </Alert>
      ) : null}

      {usersQuery.isPending ? (
        <LoadingState label="Đang tải danh sách nhân viên…" />
      ) : usersQuery.error ? (
        <ErrorState
          description={getUserActionError(usersQuery.error)}
          onRetry={() => void usersQuery.refetch()}
        />
      ) : usersQuery.data.data.length === 0 ? (
        <EmptyState
          description="Hãy thử thay đổi từ khóa hoặc bộ lọc."
          title="Không tìm thấy nhân viên"
        />
      ) : (
        <>
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <caption className="sr-only">
                  Danh sách tài khoản nhân viên
                </caption>
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4" scope="col">
                      Nhân viên
                    </th>
                    <th className="px-5 py-4" scope="col">
                      Liên hệ
                    </th>
                    <th className="px-5 py-4" scope="col">
                      Vai trò
                    </th>
                    <th className="px-5 py-4" scope="col">
                      Trạng thái
                    </th>
                    <th className="px-5 py-4" scope="col">
                      Cập nhật
                    </th>
                    <th className="px-5 py-4 text-right" scope="col">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {usersQuery.data.data.map((user) => (
                    <tr key={user.id}>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-950">
                          {user.fullName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          #{user.id}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        <p>{user.email}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {user.phone ?? 'Chưa có số điện thoại'}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <UserRoleBadge role={user.role} />
                      </td>
                      <td className="px-5 py-4">
                        <UserStatusBadge status={user.status} />
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatDateTime(user.updatedAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            disabled={statusMutation.isPending}
                            onClick={() =>
                              setEditor({ mode: 'update', user })
                            }
                            variant="outline"
                          >
                            Chỉnh sửa
                          </Button>
                          <Button
                            disabled={
                              statusMutation.isPending ||
                              (principal?.actorType === 'user' &&
                                principal.id === user.id)
                            }
                            loading={
                              statusMutation.isPending &&
                              statusMutation.variables?.id === user.id
                            }
                            onClick={() => toggleStatus(user)}
                            title={
                              principal?.actorType === 'user' &&
                              principal.id === user.id
                                ? 'Bạn không thể tự khóa tài khoản đang đăng nhập.'
                                : undefined
                            }
                            variant={
                              user.status === 'ACTIVE' ? 'danger' : 'outline'
                            }
                          >
                            {user.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <PaginationControls
            onPageChange={setPage}
            pagination={usersQuery.data.meta?.pagination}
          />
        </>
      )}
    </section>
  )
}

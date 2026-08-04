import { useEffect, useState, type FormEvent } from 'react'

import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import {
  Alert,
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/shared/components/Feedback'
import { Field, Input } from '@/shared/components/FormControls'
import { PageHeader } from '@/shared/components/PageHeader'
import { PaginationControls } from '@/shared/components/PaginationControls'
import { formatDateTime } from '@/shared/formatting/formatters'

import { AmenityForm } from '../components/AmenityForm'
import { getAmenityActionError } from '../errors'
import {
  useAdminAmenities,
  useCreateAmenity,
  useDeleteAmenity,
  useRestoreAmenity,
  useUpdateAmenity,
} from '../hooks'
import type { AdminAmenity, CreateAmenityInput } from '../types'

type EditorState =
  | { mode: 'create' }
  | { amenity: AdminAmenity; mode: 'edit' }
  | null

export function AmenityManagementPage() {
  const [page, setPage] = useState(1)
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [editor, setEditor] = useState<EditorState>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const query = useAdminAmenities({
    includeDeleted,
    page,
    search: search || undefined,
  })
  const createMutation = useCreateAmenity()
  const updateMutation = useUpdateAmenity()
  const deleteMutation = useDeleteAmenity()
  const restoreMutation = useRestoreAmenity()
  const editorMutation =
    editor?.mode === 'edit' ? updateMutation : createMutation
  const actionError =
    editorMutation.error ?? deleteMutation.error ?? restoreMutation.error

  useEffect(() => {
    const totalPages = query.data?.pagination?.totalPages
    if (totalPages !== undefined && page > Math.max(totalPages, 1)) {
      setPage(Math.max(totalPages, 1))
    }
  }, [page, query.data?.pagination?.totalPages])

  function applySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSearch(searchDraft.trim())
    setPage(1)
  }

  async function submitEditor(input: CreateAmenityInput) {
    try {
      if (editor?.mode === 'edit') {
        await updateMutation.mutateAsync({ id: editor.amenity.id, input })
        setSuccessMessage('Đã cập nhật tiện nghi.')
      } else {
        await createMutation.mutateAsync(input)
        setSuccessMessage('Đã tạo tiện nghi.')
      }
      setEditor(null)
    } catch {
      // Mutation state renders the API error while preserving form values.
    }
  }

  function removeAmenity(amenity: AdminAmenity) {
    if (window.confirm(`Xóa tiện nghi "${amenity.name}"?`)) {
      setSuccessMessage('')
      deleteMutation.mutate(amenity.id, {
        onSuccess: () => setSuccessMessage('Đã xóa tiện nghi.'),
      })
    }
  }

  function recoverAmenity(amenity: AdminAmenity) {
    setSuccessMessage('')
    restoreMutation.mutate(amenity.id, {
      onSuccess: () => setSuccessMessage('Đã khôi phục tiện nghi.'),
    })
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        actions={
          <Button
            onClick={() => {
              setSuccessMessage('')
              setEditor({ mode: 'create' })
            }}
          >
            Thêm tiện nghi
          </Button>
        }
        description="Quản lý danh mục tiện nghi dùng chung và gán chúng cho từng loại phòng."
        eyebrow="Quản trị"
        title="Tiện nghi"
      />

      {successMessage ? (
        <Alert tone="success">{successMessage}</Alert>
      ) : null}

      {editor ? (
        <Card>
          <h2 className="mb-5 text-lg font-bold text-ink">
            {editor.mode === 'edit'
              ? `Chỉnh sửa ${editor.amenity.name}`
              : 'Tạo tiện nghi mới'}
          </h2>
          {editorMutation.error ? (
            <Alert className="mb-5" tone="error">
              {getAmenityActionError(editorMutation.error)}
            </Alert>
          ) : null}
          <AmenityForm
            initialValue={
              editor.mode === 'edit' ? editor.amenity : undefined
            }
            loading={editorMutation.isPending}
            onCancel={() => setEditor(null)}
            onSubmit={submitEditor}
          />
        </Card>
      ) : null}

      {!editor && actionError ? (
        <Alert tone="error">{getAmenityActionError(actionError)}</Alert>
      ) : null}

      <Card>
        <form
          className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end"
          onSubmit={applySearch}
        >
          <Field label="Tìm tiện nghi">
            <Input
              maxLength={160}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Tên hoặc mô tả"
              value={searchDraft}
            />
          </Field>
          <Button type="submit" variant="outline">
            Tìm kiếm
          </Button>
          <label className="flex min-h-11 items-center gap-2 rounded-control border border-line px-3 text-sm font-medium text-ink">
            <input
              checked={includeDeleted}
              className="size-4 accent-blue-600"
              onChange={(event) => {
                setIncludeDeleted(event.target.checked)
                setPage(1)
              }}
              type="checkbox"
            />
            Hiện mục đã xóa
          </label>
        </form>
      </Card>

      {query.isPending ? (
        <LoadingState label="Đang tải tiện nghi..." />
      ) : query.isError ? (
        <ErrorState
          description={getAmenityActionError(query.error)}
          onRetry={() => void query.refetch()}
        />
      ) : query.data.items.length === 0 ? (
        <EmptyState
          description="Thử thay đổi từ khóa hoặc tạo tiện nghi đầu tiên."
          title="Chưa có tiện nghi phù hợp"
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {query.data.items.map((amenity) => (
              <Card
                aria-label={`Tiện nghi ${amenity.name}`}
                className={
                  amenity.deletedAt ? 'border-dashed bg-surface-muted' : ''
                }
                key={amenity.id}
                role="article"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-ink">
                      {amenity.name}
                    </h2>
                    <p className="mt-1 text-xs text-muted">Mã: {amenity.id}</p>
                  </div>
                  <Badge tone={amenity.deletedAt ? 'rose' : 'emerald'}>
                    {amenity.deletedAt ? 'Đã xóa' : 'Đang hoạt động'}
                  </Badge>
                </div>
                <p className="mt-4 min-h-12 text-sm leading-6 text-muted">
                  {amenity.description || 'Chưa có mô tả.'}
                </p>
                <p className="mt-4 text-xs text-muted">
                  {amenity.deletedAt ? 'Đã xóa' : 'Cập nhật'}:{' '}
                  {formatDateTime(amenity.deletedAt ?? amenity.updatedAt)}
                </p>
                <div className="mt-5 flex justify-end gap-2">
                  {amenity.deletedAt ? (
                    <Button
                      loading={
                        restoreMutation.isPending &&
                        restoreMutation.variables === amenity.id
                      }
                      onClick={() => recoverAmenity(amenity)}
                      variant="outline"
                    >
                      Khôi phục
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={() => {
                          setSuccessMessage('')
                          setEditor({ amenity, mode: 'edit' })
                        }}
                        variant="outline"
                      >
                        Chỉnh sửa
                      </Button>
                      <Button
                        loading={
                          deleteMutation.isPending &&
                          deleteMutation.variables === amenity.id
                        }
                        onClick={() => removeAmenity(amenity)}
                        variant="danger"
                      >
                        Xóa
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
          <PaginationControls
            onPageChange={setPage}
            pagination={query.data.pagination}
          />
        </>
      )}
    </div>
  )
}

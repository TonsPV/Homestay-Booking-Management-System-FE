import { useEffect, useState, type FormEvent } from 'react'

import { getErrorMessage } from '@/api/errors'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { ConfirmationDialog } from '@/shared/components/ConfirmationDialog'
import { Alert, EmptyState, ErrorState, LoadingState } from '@/shared/components/Feedback'
import { Field, Input } from '@/shared/components/FormControls'
import { PageHeader } from '@/shared/components/PageHeader'
import { PaginationControls } from '@/shared/components/PaginationControls'
import {
  formatDateTime,
  formatMoney,
  formatNumber,
} from '@/shared/formatting/formatters'
import { formatBedConfiguration } from '@/shared/formatting/bed-configuration'

import { RoomTypeForm } from '../components/RoomTypeForm'
import { RoomTypeAmenityEditor } from '../components/RoomTypeAmenityEditor'
import { getRoomTypeActionError } from '../errors'
import {
  useAdminRoomTypes,
  useCreateRoomType,
  useDeleteRoomType,
  useRestoreRoomType,
  useUpdateRoomType,
} from '../hooks'
import type { AdminRoomType, CreateRoomTypeInput } from '../types'

type EditorState =
  | { mode: 'create' }
  | { mode: 'edit'; roomType: AdminRoomType }
  | null

export function ManagementRoomTypesPage() {
  const [page, setPage] = useState(1)
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [editor, setEditor] = useState<EditorState>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [amenityRoomType, setAmenityRoomType] =
    useState<AdminRoomType | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminRoomType | null>(null)
  const query = useAdminRoomTypes({
    includeDeleted,
    page,
    search: search || undefined,
  })
  const totalPages = query.data?.pagination?.totalPages
  const createMutation = useCreateRoomType()
  const updateMutation = useUpdateRoomType()
  const deleteMutation = useDeleteRoomType()
  const restoreMutation = useRestoreRoomType()
  const editorMutation =
    editor?.mode === 'edit' ? updateMutation : createMutation
  const actionError =
    editorMutation.error ?? deleteMutation.error ?? restoreMutation.error

  useEffect(() => {
    if (totalPages === undefined) {
      return
    }

    const lastPage = Math.max(totalPages, 1)

    if (page > lastPage) {
      setPage(lastPage)
    }
  }, [page, totalPages])

  function applySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSearch(searchDraft.trim())
    setPage(1)
  }

  async function submitEditor(input: CreateRoomTypeInput) {
    try {
      if (editor?.mode === 'edit') {
        await updateMutation.mutateAsync({
          id: editor.roomType.id,
          input,
        })
        setSuccessMessage('Đã cập nhật loại phòng.')
      } else {
        await createMutation.mutateAsync(input)
        setSuccessMessage('Đã tạo loại phòng.')
      }

      setEditor(null)
    } catch {
      // Mutation state keeps the editor open and renders the API error.
    }
  }

  function requestRoomTypeRemoval(roomType: AdminRoomType) {
    deleteMutation.reset()
    setSuccessMessage('')
    setDeleteTarget(roomType)
  }

  function removeRoomType() {
    if (!deleteTarget || deleteMutation.isPending) {
      return
    }

    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null)
        setSuccessMessage('Đã xóa loại phòng.')
      },
    })
  }

  function recoverRoomType(roomType: AdminRoomType) {
    setSuccessMessage('')
    restoreMutation.mutate(roomType.id, {
      onSuccess: () => setSuccessMessage('Đã khôi phục loại phòng.'),
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
            Thêm loại phòng
          </Button>
        }
        description="Quản lý sức chứa, giá cơ bản và vòng đời của từng loại phòng."
        eyebrow="Quản trị"
        title="Loại phòng"
      />

      <RoomTypeAmenityEditor
        onClose={() => setAmenityRoomType(null)}
        onSaved={() => setSuccessMessage('Đã cập nhật tiện nghi loại phòng.')}
        roomType={amenityRoomType}
      />

      {successMessage ? (
        <Alert tone="success">{successMessage}</Alert>
      ) : null}

      {editor ? (
        <Card>
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-950">
              {editor.mode === 'edit'
                ? `Chỉnh sửa ${editor.roomType.name}`
                : 'Tạo loại phòng mới'}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Các trường có dấu * là bắt buộc.
            </p>
          </div>
          {editorMutation.error ? (
            <Alert className="mb-5" tone="error">
              {getErrorMessage(editorMutation.error)}
            </Alert>
          ) : null}
          <RoomTypeForm
            initialValue={
              editor.mode === 'edit' ? editor.roomType : undefined
            }
            loading={editorMutation.isPending}
            onCancel={() => setEditor(null)}
            onSubmit={submitEditor}
          />
        </Card>
      ) : null}

      {!editor && !deleteTarget && actionError ? (
        <Alert tone="error">{getRoomTypeActionError(actionError)}</Alert>
      ) : null}

      <Card>
        <form
          className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end"
          onSubmit={applySearch}
        >
          <Field label="Tìm loại phòng">
            <Input
              aria-label="Tìm loại phòng"
              maxLength={160}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Tên hoặc mô tả"
              value={searchDraft}
            />
          </Field>
          <Button type="submit" variant="outline">
            Tìm kiếm
          </Button>
          <label className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700">
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
        <LoadingState label="Đang tải loại phòng…" />
      ) : query.isError ? (
        <ErrorState
          description={getErrorMessage(query.error)}
          onRetry={() => void query.refetch()}
        />
      ) : query.data.items.length === 0 ? (
        <EmptyState
          description="Thử thay đổi từ khóa hoặc tạo loại phòng đầu tiên."
          title="Chưa có loại phòng phù hợp"
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {query.data.items.map((roomType) => (
              <Card
                aria-label={`Loại phòng ${roomType.name}`}
                className={
                  roomType.deletedAt
                    ? 'border-dashed bg-slate-50'
                    : undefined
                }
                key={roomType.id}
                role="article"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-lg font-bold text-slate-950">
                        {roomType.name}
                      </h2>
                      {roomType.deletedAt ? (
                        <Badge tone="rose">Đã xóa</Badge>
                      ) : (
                        <Badge tone="emerald">Đang hoạt động</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Mã loại phòng: {roomType.id}
                    </p>
                  </div>
                  <p className="shrink-0 text-right text-base font-black text-blue-700">
                    {formatMoney(roomType.basePrice)}
                    <span className="block text-xs font-medium text-slate-500">
                      / đêm
                    </span>
                  </p>
                </div>

                <p className="mt-4 min-h-12 text-sm leading-6 text-slate-600">
                  {roomType.description || 'Chưa có mô tả.'}
                </p>

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Giường:{' '}
                  {formatBedConfiguration(roomType.beds, roomType.bedType) ??
                    'Chưa cấu hình'}
                </p>

                <div className="mt-4 flex min-h-7 flex-wrap gap-2">
                  {roomType.amenities.length > 0 ? (
                    roomType.amenities.map((amenity) => (
                      <Badge key={amenity.id} tone="blue">
                        {amenity.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted">
                      Chưa gán tiện nghi.
                    </span>
                  )}
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                  <div>
                    <dt className="text-slate-500">Sức chứa</dt>
                    <dd className="mt-1 font-bold text-slate-900">
                      {formatNumber(roomType.maxGuests)} khách
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">
                      {roomType.deletedAt ? 'Đã xóa lúc' : 'Cập nhật'}
                    </dt>
                    <dd className="mt-1 font-bold text-slate-900">
                      {formatDateTime(
                        roomType.deletedAt ?? roomType.updatedAt,
                      )}
                    </dd>
                  </div>
                </dl>

                <div className="mt-5 flex flex-wrap justify-end gap-2">
                  {roomType.deletedAt ? (
                    <Button
                      loading={
                        restoreMutation.isPending &&
                        restoreMutation.variables === roomType.id
                      }
                      onClick={() => recoverRoomType(roomType)}
                      variant="outline"
                    >
                      Khôi phục
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={() => {
                          setSuccessMessage('')
                          setAmenityRoomType(roomType)
                        }}
                        variant="outline"
                      >
                        Tiện nghi
                      </Button>
                      <Button
                        onClick={() => {
                          setSuccessMessage('')
                          setEditor({ mode: 'edit', roomType })
                        }}
                        variant="outline"
                      >
                        Chỉnh sửa
                      </Button>
                      <Button
                        loading={
                          deleteMutation.isPending &&
                          deleteMutation.variables === roomType.id
                        }
                        onClick={() => requestRoomTypeRemoval(roomType)}
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

      <ConfirmationDialog
        busy={deleteMutation.isPending}
        confirmLabel="Xóa loại phòng"
        description={
          deleteTarget
            ? `Loại phòng “${deleteTarget.name}” sẽ bị ẩn khỏi danh mục. Bạn có thể khôi phục lại sau.`
            : undefined
        }
        onCancel={() => {
          if (!deleteMutation.isPending) {
            deleteMutation.reset()
            setDeleteTarget(null)
          }
        }}
        onConfirm={removeRoomType}
        open={deleteTarget !== null}
        title="Xóa loại phòng này?"
        tone="danger"
      >
        {deleteMutation.isError ? (
          <Alert tone="error">
            {getRoomTypeActionError(deleteMutation.error)}
          </Alert>
        ) : null}
      </ConfirmationDialog>
    </div>
  )
}

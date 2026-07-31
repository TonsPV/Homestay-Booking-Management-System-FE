import { zodResolver } from '@hookform/resolvers/zod'
import {
  useEffect,
  useState,
} from 'react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'

import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { ConfirmationDialog } from '@/shared/components/ConfirmationDialog'
import {
  Alert,
  ErrorState,
  LoadingState,
} from '@/shared/components/Feedback'
import {
  Field,
  Select,
  Textarea,
} from '@/shared/components/FormControls'
import { PageHeader } from '@/shared/components/PageHeader'
import { LinkButton } from '@/shared/components/LinkButton'
import {
  formatDateOnly,
  formatMoney,
} from '@/shared/formatting/formatters'
import { ManagementBookingPaymentPanel } from '@/features/payments/components/ManagementBookingPaymentPanel'

import { BookingDetails } from '../components/BookingDetails'
import { BookingPaymentStatusBadge } from '../components/BookingStatusBadges'
import { getBookingStatusLabel } from '../components/bookingStatusLabels'
import {
  isBookingPaymentWindowOpen,
} from '../eligibility'
import { getBookingActionError } from '../errors'
import {
  useManagementBooking,
  useUpdateBookingStatus,
} from '../hooks'
import {
  type UpdateBookingStatusFormValues,
  updateBookingStatusFormSchema,
} from '../schemas'
import { BOOKING_STATUSES } from '../types'

export function ManagementBookingDetailPage() {
  const params = useParams()
  const bookingId = params.bookingId ?? params.id
  const bookingQuery = useManagementBooking(bookingId)
  const updateMutation = useUpdateBookingStatus()
  const [cancellationReason, setCancellationReason] = useState<string | null>(
    null,
  )
  const [successMessage, setSuccessMessage] = useState<string>()
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm<UpdateBookingStatusFormValues>({
    defaultValues: {
      status: 'PENDING_PAYMENT',
      cancellationReason: '',
    },
    resolver: zodResolver(updateBookingStatusFormSchema),
  })
  const selectedStatus = watch('status')
  const booking = bookingQuery.data

  useEffect(() => {
    if (booking) {
      reset({ status: booking.status, cancellationReason: '' })
    }
  }, [booking, reset])

  if (bookingQuery.isPending) {
    return <LoadingState label="Đang tải chi tiết booking…" />
  }

  if (bookingQuery.isError || !booking) {
    return (
      <ErrorState
        description={getBookingActionError(bookingQuery.error)}
        onRetry={() => void bookingQuery.refetch()}
      />
    )
  }

  const commitStatusUpdate = (values: UpdateBookingStatusFormValues) => {
    if (!bookingId) {
      return
    }

    updateMutation.mutate({
      id: bookingId,
      input: {
        status: values.status,
        cancellationReason:
          values.status === 'CANCELLED'
            ? values.cancellationReason.trim() || undefined
            : undefined,
      },
    }, {
      onSuccess: () => {
        setSuccessMessage('Đã cập nhật trạng thái booking.')
        if (values.status === 'CANCELLED') {
          setCancellationReason(null)
        }
      },
    })
  }

  const submit = handleSubmit((values) => {
    setSuccessMessage(undefined)

    if (values.status === 'CANCELLED') {
      updateMutation.reset()
      setCancellationReason(values.cancellationReason.trim())
      return
    }

    commitStatusUpdate(values)
  })

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Quản lý booking"
        title={booking.bookingCode}
        actions={
          <LinkButton to=".." relative="path" variant="outline">
            Quay lại
          </LinkButton>
        }
      />

      <BookingDetails booking={booking} />
      <ManagementBookingPaymentPanel
        bookingId={booking.id}
        canRecord={isBookingPaymentWindowOpen(booking)}
      />

      <Card>
          <h2 className="text-lg font-bold text-ink">
            Cập nhật trạng thái
          </h2>
          <p className="mt-1 text-sm leading-body text-muted">
            Chọn trạng thái đích. Máy chủ là nguồn quyết định và sẽ kiểm tra
            thanh toán, ngày lưu trú, quyền thao tác cùng trạng thái vận hành
            của phòng trước khi cập nhật.
          </p>

          {successMessage ? (
            <Alert className="mt-4" tone="success">
              {successMessage}
            </Alert>
          ) : null}
          {updateMutation.isError ? (
            <Alert className="mt-4" tone="error">
              {getBookingActionError(updateMutation.error)}
            </Alert>
          ) : null}

          <form
            className="mt-5 grid gap-4 sm:max-w-xl"
            onSubmit={submit}
          >
            <Field
              required
              label="Trạng thái tiếp theo"
              error={errors.status?.message}
            >
              <Select {...register('status')}>
                {BOOKING_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {getBookingStatusLabel(status)}
                  </option>
                ))}
              </Select>
            </Field>

            {selectedStatus === 'CANCELLED' ? (
              <Field
                label="Lý do hủy"
                error={errors.cancellationReason?.message}
              >
                <Textarea {...register('cancellationReason')} />
              </Field>
            ) : null}

            <div>
              <Button loading={updateMutation.isPending} type="submit">
                Cập nhật trạng thái
              </Button>
            </div>
          </form>
      </Card>

      <ConfirmationDialog
        busy={updateMutation.isPending}
        confirmDisabled={!bookingId}
        confirmLabel="Xác nhận hủy booking"
        description="Hành động này thay đổi trạng thái booking và có thể giải phóng lịch phòng. Hãy kiểm tra đúng booking trước khi tiếp tục."
        onCancel={() => {
          updateMutation.reset()
          setCancellationReason(null)
        }}
        onConfirm={() => {
          if (cancellationReason === null) {
            return
          }

          commitStatusUpdate({
            status: 'CANCELLED',
            cancellationReason,
          })
        }}
        open={cancellationReason !== null}
        title={`Hủy booking ${booking.bookingCode}?`}
      >
        <dl className="grid grid-cols-2 gap-4 rounded-card bg-surface-muted p-4 text-sm">
          <div>
            <dt className="text-muted">Khách hàng</dt>
            <dd className="mt-1 font-semibold text-ink">
              {booking.contactName}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Phòng</dt>
            <dd className="mt-1 font-semibold text-ink">
              {booking.room.roomNumber} · {booking.room.name}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Nhận phòng</dt>
            <dd className="mt-1 font-semibold text-ink">
              {formatDateOnly(booking.checkInDate)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Trả phòng</dt>
            <dd className="mt-1 font-semibold text-ink">
              {formatDateOnly(booking.checkOutDate)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Tổng tiền</dt>
            <dd className="mt-1 font-semibold text-ink">
              {formatMoney(booking.totalAmount)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Thanh toán</dt>
            <dd className="mt-1">
              <BookingPaymentStatusBadge status={booking.paymentStatus} />
            </dd>
          </div>
        </dl>

        {cancellationReason ? (
          <div className="mt-4 rounded-card border border-line px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">
              Lý do hủy
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
              {cancellationReason}
            </p>
          </div>
        ) : null}

        {updateMutation.isError ? (
          <Alert className="mt-4" tone="error">
            {getBookingActionError(updateMutation.error)}
          </Alert>
        ) : null}
      </ConfirmationDialog>
    </div>
  )
}

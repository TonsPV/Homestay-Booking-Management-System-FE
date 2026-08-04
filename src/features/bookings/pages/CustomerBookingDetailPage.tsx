import { zodResolver } from '@hookform/resolvers/zod'
import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import { useForm } from 'react-hook-form'
import {
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'

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
  Textarea,
} from '@/shared/components/FormControls'
import { PageHeader } from '@/shared/components/PageHeader'
import { LinkButton } from '@/shared/components/LinkButton'
import { formatDateOnly } from '@/shared/formatting/formatters'
import { CustomerPaymentPanel } from '@/features/payments/components/CustomerPaymentPanel'

import { BookingDetails } from '../components/BookingDetails'
import { BookingExpiryNotice } from '../components/BookingExpiryNotice'
import { isBookingPaymentWindowOpen } from '../eligibility'
import { getBookingActionError } from '../errors'
import {
  useCancelCustomerBooking,
  useCustomerBooking,
} from '../hooks'
import {
  cancelBookingFormSchema,
  type CancelBookingFormValues,
} from '../schemas'

export function CustomerBookingDetailPage() {
  const params = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const bookingId = params.bookingId ?? params.id
  const bookingQuery = useCustomerBooking(bookingId)
  const cancelMutation = useCancelCustomerBooking()
  const [expiredPaymentDeadline, setExpiredPaymentDeadline] =
    useState<string | null>(null)
  const bookingCreated =
    typeof location.state === 'object' &&
    location.state !== null &&
    'bookingCreated' in location.state &&
    location.state.bookingCreated === true
  const [successMessage, setSuccessMessage] = useState<string | undefined>(
    bookingCreated
      ? 'Đã tạo đặt phòng. Hãy thanh toán trước thời hạn để giữ phòng.'
      : undefined,
  )
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const refetchBooking = bookingQuery.refetch
  useEffect(() => {
    if (bookingCreated) {
      navigate(`${location.pathname}${location.search}`, {
        replace: true,
        state: null,
      })
    }
  }, [bookingCreated, location.pathname, location.search, navigate])

  const handlePaymentExpired = useCallback(
    (expiresAt: string) => {
      setExpiredPaymentDeadline(expiresAt)
      void refetchBooking()
    },
    [refetchBooking],
  )
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<CancelBookingFormValues>({
    defaultValues: { reason: '' },
    resolver: zodResolver(cancelBookingFormSchema),
  })

  if (bookingQuery.isPending) {
    return <LoadingState label="Đang tải chi tiết đặt phòng…" />
  }

  if (bookingQuery.isError || !bookingQuery.data) {
    return (
      <ErrorState
        description={getBookingActionError(bookingQuery.error)}
        onRetry={() => void bookingQuery.refetch()}
      />
    )
  }

  const booking = bookingQuery.data
  const canCancel =
    booking.paymentStatus === 'UNPAID' &&
    (booking.status === 'PENDING_PAYMENT' ||
      booking.status === 'CONFIRMED')
  const canPay =
    isBookingPaymentWindowOpen(booking) &&
    expiredPaymentDeadline !== booking.paymentExpiresAt

  const confirmCancel = handleSubmit((values) => {
    if (!bookingId) {
      return
    }

    setSuccessMessage(undefined)
    cancelMutation.mutate(
      {
        id: bookingId,
        input: {
          reason: values.reason.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          reset()
          setCancelDialogOpen(false)
          setSuccessMessage('Đã hủy đặt phòng.')
        },
      },
    )
  })

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Chi tiết đặt phòng"
        title={booking.bookingCode}
        actions={
          <LinkButton to=".." relative="path" variant="outline">
            Quay lại
          </LinkButton>
        }
      />

      <BookingExpiryNotice
        booking={booking}
        onExpired={handlePaymentExpired}
      />
      {successMessage ? (
        <Alert tone="success">{successMessage}</Alert>
      ) : null}
      <BookingDetails audience="customer" booking={booking} />
      <CustomerPaymentPanel
        bookingId={booking.id}
        canPay={canPay}
      />

      {canCancel ? (
        <Card className="border-danger/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink">
                Không tiếp tục chuyến đi?
              </h2>
              <p className="mt-1 text-sm leading-body text-muted">
                Kiểm tra lại thông tin trước khi hủy đặt phòng này.
              </p>
            </div>
            <Button
              className="shrink-0"
              onClick={() => {
                cancelMutation.reset()
                setSuccessMessage(undefined)
                setCancelDialogOpen(true)
              }}
              variant="danger"
            >
              Hủy đặt phòng
            </Button>
          </div>
        </Card>
      ) : null}

      <ConfirmationDialog
        busy={cancelMutation.isPending}
        confirmDisabled={!bookingId}
        confirmLabel="Xác nhận hủy đặt phòng"
        description="Sau khi hủy, bạn sẽ không thể tiếp tục thanh toán cho đặt phòng này."
        onCancel={() => {
          cancelMutation.reset()
          reset()
          setCancelDialogOpen(false)
        }}
        onConfirm={() => void confirmCancel()}
        open={cancelDialogOpen}
        title={`Hủy đặt phòng ${booking.bookingCode}?`}
      >
        <dl className="grid grid-cols-2 gap-4 rounded-card bg-surface-muted p-4 text-sm">
          <div>
            <dt className="text-muted">Phòng</dt>
            <dd className="mt-1 font-semibold text-ink">
              {booking.room.roomNumber} · {booking.room.name}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Thời gian lưu trú</dt>
            <dd className="mt-1 font-semibold text-ink">
              {formatDateOnly(booking.checkInDate)} –{' '}
              {formatDateOnly(booking.checkOutDate)}
            </dd>
          </div>
        </dl>

        <div className="mt-4">
          <Field
            label="Lý do hủy"
            error={errors.reason?.message}
            hint="Không bắt buộc, tối đa 500 ký tự."
          >
            <Textarea
              {...register('reason')}
              placeholder="Cho chúng tôi biết lý do bạn thay đổi kế hoạch"
            />
          </Field>
        </div>

        {cancelMutation.isError ? (
          <Alert className="mt-4" tone="error">
            {getBookingActionError(cancelMutation.error)}
          </Alert>
        ) : null}
      </ConfirmationDialog>
    </div>
  )
}

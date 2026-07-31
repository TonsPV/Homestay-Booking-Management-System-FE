import { zodResolver } from '@hookform/resolvers/zod'
import {
  useCallback,
  useState,
} from 'react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'

import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
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
  const bookingId = params.bookingId ?? params.id
  const bookingQuery = useCustomerBooking(bookingId)
  const cancelMutation = useCancelCustomerBooking()
  const [expiredPaymentDeadline, setExpiredPaymentDeadline] =
    useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string>()
  const refetchBooking = bookingQuery.refetch
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

  const submitCancel = handleSubmit((values) => {
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
      <BookingDetails booking={booking} />
      <CustomerPaymentPanel
        bookingId={booking.id}
        canPay={canPay}
      />

      {canCancel ? (
        <Card className="border-danger/20">
          <h2 className="text-lg font-bold text-ink">Hủy đặt phòng</h2>
          <p className="mt-1 text-sm leading-body text-muted">
            Tình trạng phòng sẽ được kiểm tra lại sau khi yêu cầu hủy hoàn tất.
          </p>

          {cancelMutation.isError ? (
            <Alert className="mt-4" tone="error">
              {getBookingActionError(cancelMutation.error)}
            </Alert>
          ) : null}

          <form className="mt-5 grid gap-4" onSubmit={submitCancel}>
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
            <div>
              <Button
                loading={cancelMutation.isPending}
                type="submit"
                variant="danger"
              >
                Xác nhận hủy
              </Button>
            </div>
          </form>
        </Card>
      ) : null}
    </div>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import {
  Alert,
  ErrorState,
  LoadingState,
} from '@/shared/components/Feedback'
import {
  Field,
  Select,
} from '@/shared/components/FormControls'

import { getPaymentActionError } from '../errors'
import {
  useCreateManualPayment,
  useManagementBookingPayments,
} from '../hooks'
import {
  getOrCreateManualPaymentKey,
} from '../idempotency'
import {
  createManualPaymentFormSchema,
  type CreateManualPaymentFormValues,
} from '../schemas'
import { findPendingVnPayPayment } from '../safety'
import { PaymentList } from './PaymentList'

interface ManagementBookingPaymentPanelProps {
  bookingId: string
  canRecord: boolean
}

export function ManagementBookingPaymentPanel({
  bookingId,
  canRecord,
}: ManagementBookingPaymentPanelProps) {
  const paymentsQuery = useManagementBookingPayments(bookingId)
  const createMutation = useCreateManualPayment()
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CreateManualPaymentFormValues>({
    defaultValues: { method: 'CASH' },
    resolver: zodResolver(createManualPaymentFormSchema),
  })
  const pendingVnPayPayment = findPendingVnPayPayment(
    paymentsQuery.data?.data ?? [],
  )
  const canSubmit =
    canRecord &&
    paymentsQuery.isSuccess &&
    !paymentsQuery.isFetching &&
    pendingVnPayPayment === undefined

  const submit = handleSubmit((values) => {
    if (!canSubmit) {
      return
    }

    const idempotencyKey = getOrCreateManualPaymentKey(
      bookingId,
      values.method,
    )

    createMutation.mutate(
      {
        bookingId,
        idempotencyKey,
        input: { method: values.method },
      },
    )
  })

  return (
    <section className="grid gap-4" aria-labelledby="management-payments-title">
      <Card>
        <h2 id="management-payments-title" className="text-lg font-bold text-slate-950">
          Ghi nhận thanh toán
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Chỉ chọn phương thức. Tổng tiền luôn được lấy từ booking và không gửi
          từ giao diện.
        </p>

        {!canRecord ? (
          <Alert className="mt-4">
            Booking hiện không thể ghi nhận thêm thanh toán.
          </Alert>
        ) : paymentsQuery.isPending ||
          paymentsQuery.isFetching ? (
          <Alert className="mt-4">
            Đang đối chiếu lịch sử payment trước khi cho phép ghi nhận thủ
            công…
          </Alert>
        ) : paymentsQuery.isError ? (
          <Alert className="mt-4" tone="warning">
            Chưa thể xác nhận booking có VNPay đang xử lý hay không. Ghi nhận
            thủ công tạm thời bị khóa.
          </Alert>
        ) : pendingVnPayPayment ? (
          <Alert
            className="mt-4"
            tone="warning"
            title="VNPay đang xử lý"
          >
            Payment #{pendingVnPayPayment.id} chưa có kết quả cuối. Không ghi
            nhận CASH hoặc BANK_TRANSFER trong lúc attempt này còn PENDING.
          </Alert>
        ) : (
          <form className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end" onSubmit={submit}>
            <Field label="Phương thức" error={errors.method?.message}>
              <Select {...register('method')}>
                <option value="CASH">Tiền mặt</option>
                <option value="BANK_TRANSFER">Chuyển khoản</option>
              </Select>
            </Field>
            <Button loading={createMutation.isPending} type="submit">
              Ghi nhận đã thanh toán
            </Button>
          </form>
        )}

        {createMutation.isError ? (
          <Alert className="mt-4" tone="error">
            {getPaymentActionError(createMutation.error)}
          </Alert>
        ) : null}
        {createMutation.isSuccess ? (
          <Alert
            className="mt-4"
            tone="success"
            title="Đã ghi nhận thanh toán"
          >
            Payment #{createMutation.data.id} đã được Backend xác nhận thành
            công. Trạng thái booking đang được làm mới.
          </Alert>
        ) : null}
      </Card>

      {paymentsQuery.isPending ? (
        <LoadingState label="Đang tải lịch sử payment…" />
      ) : paymentsQuery.isError ? (
        <ErrorState
          description={getPaymentActionError(paymentsQuery.error)}
          onRetry={() => void paymentsQuery.refetch()}
        />
      ) : (
        <PaymentList payments={paymentsQuery.data.data} />
      )}
    </section>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useForm } from 'react-hook-form'

import { ApiError } from '@/api/errors'
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
  useCreateVnPayPayment,
  useCustomerPayments,
} from '../hooks'
import {
  clearVnPayAttempt,
  getOrCreateVnPayAttempt,
  getVnPayAttempt,
  rememberVnPayPayment,
} from '../idempotency'
import { resolveSecurePaymentUrl } from '../payment-url'
import {
  createVnPayFormSchema,
  type CreateVnPayFormValues,
} from '../schemas'
import {
  decideVnPayAttempt,
  findPendingVnPayPayment,
} from '../safety'
import { CustomerPaymentHistory } from './CustomerPaymentHistory'

interface CustomerPaymentPanelProps {
  bookingId: string
  canPay: boolean
}

export function CustomerPaymentPanel({
  bookingId,
  canPay,
}: CustomerPaymentPanelProps) {
  const paymentsQuery = useCustomerPayments(bookingId)
  const createMutation = useCreateVnPayPayment()
  const [attempt, setAttempt] = useState(() =>
    getVnPayAttempt(bookingId),
  )
  const [conflictBlocked, setConflictBlocked] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [redirectError, setRedirectError] = useState<string | null>(null)
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CreateVnPayFormValues>({
    defaultValues: { bankCode: '', locale: 'vn' },
    resolver: zodResolver(createVnPayFormSchema),
  })
  const payments = useMemo(
    () => paymentsQuery.data?.data ?? [],
    [paymentsQuery.data?.data],
  )
  const pendingPayment = findPendingVnPayPayment(payments)
  const attemptDecision = useMemo(
    () => decideVnPayAttempt(bookingId, payments, attempt),
    [attempt, bookingId, payments],
  )

  useEffect(() => {
    setAttempt(getVnPayAttempt(bookingId))
    setConflictBlocked(false)
    setRedirecting(false)
    setRedirectError(null)
  }, [bookingId])

  useEffect(() => {
    if (
      attemptDecision.kind === 'new' &&
      attemptDecision.clearStoredAttempt &&
      !redirecting
    ) {
      clearVnPayAttempt(bookingId)
      setAttempt(null)
    }
  }, [attemptDecision, bookingId, redirecting])

  const submit = handleSubmit((values) => {
    setRedirectError(null)

    if (
      !paymentsQuery.isSuccess ||
      paymentsQuery.isFetching ||
      conflictBlocked ||
      redirecting ||
      attemptDecision.kind === 'blocked'
    ) {
      return
    }

    if (
      attemptDecision.kind === 'new' &&
      attemptDecision.clearStoredAttempt
    ) {
      clearVnPayAttempt(bookingId)
    }

    const activeAttempt =
      attemptDecision.kind === 'replay'
        ? attemptDecision.attempt
        : getOrCreateVnPayAttempt(bookingId)
    setAttempt(activeAttempt)

    createMutation.mutate(
      {
        bookingId,
        idempotencyKey: activeAttempt.idempotencyKey,
        input: {
          bankCode: values.bankCode || undefined,
          locale: values.locale,
        },
      },
      {
        onError: (error) => {
          if (error instanceof ApiError && error.isStatus(409)) {
            setConflictBlocked(true)
          }
        },
        onSuccess: (result) => {
          const rememberedAttempt = rememberVnPayPayment(
            activeAttempt,
            result.payment.id,
          )
          setAttempt(rememberedAttempt)
          const paymentUrl = resolveSecurePaymentUrl(result.paymentUrl)

          if (!paymentUrl) {
            setRedirecting(false)
            setRedirectError(
              'Không thể mở cổng thanh toán. Yêu cầu của bạn không bị gửi lại; vui lòng kiểm tra lịch sử bên dưới rồi thử lại.',
            )
            void paymentsQuery.refetch()
            return
          }

          setRedirecting(true)
          window.location.assign(paymentUrl)
        },
      },
    )
  })

  return (
    <section className="grid gap-4" aria-labelledby="customer-payments-title">
      {canPay ? <Card>
        <h2 id="customer-payments-title" className="text-lg font-bold text-slate-950">
          Thanh toán
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Chọn kênh thanh toán phù hợp. Số tiền được lấy từ thông tin đặt phòng
          đã xác nhận.
        </p>

        {paymentsQuery.isPending ||
          paymentsQuery.isFetching ? (
          <Alert className="mt-4">
            Đang kiểm tra lịch sử thanh toán…
          </Alert>
        ) : paymentsQuery.isError ? (
          <Alert className="mt-4" tone="warning">
            Chưa thể kiểm tra các giao dịch trước đó. Tạm thời chưa thể tạo
            thanh toán mới; vui lòng thử lại sau.
          </Alert>
        ) : conflictBlocked ? (
          <Alert
            className="mt-4"
            title="Thông tin thanh toán vừa thay đổi"
            tone="warning"
          >
            Vui lòng kiểm tra lịch sử bên dưới và tải lại trang trước khi thử
            lại. Yêu cầu sẽ không được gửi thêm trong lúc này.
          </Alert>
        ) : attemptDecision.kind === 'blocked' ? (
          <Alert
            className="mt-4"
            tone="warning"
            title={
              attemptDecision.reason === 'pending-without-key'
                ? 'Giao dịch đang được xử lý'
                : 'Chưa thể tiếp tục thanh toán'
            }
          >
            {attemptDecision.reason === 'pending-without-key'
              ? 'Một giao dịch VNPay đang chờ kết quả. Để tránh thanh toán trùng, bạn chưa thể tạo giao dịch mới.'
              : 'Thông tin thanh toán trên thiết bị này chưa đồng bộ với lịch sử. Vui lòng tải lại trang hoặc liên hệ Homestay Green nếu tình trạng vẫn tiếp diễn.'}
          </Alert>
        ) : (
          <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
            <Field label="Kênh thanh toán" error={errors.bankCode?.message}>
              <Select {...register('bankCode')}>
                <option value="">Chọn tại cổng VNPay</option>
                <option value="VNPAYQR">VNPay QR</option>
                <option value="VNBANK">Thẻ/tài khoản nội địa</option>
                <option value="INTCARD">Thẻ quốc tế</option>
              </Select>
            </Field>
            <Field label="Ngôn ngữ cổng thanh toán" error={errors.locale?.message}>
              <Select {...register('locale')}>
                <option value="vn">Tiếng Việt</option>
                <option value="en">English</option>
              </Select>
            </Field>

            {createMutation.isError ? (
              <Alert className="sm:col-span-2" tone="error">
                {getPaymentActionError(createMutation.error)}
              </Alert>
            ) : null}

            {redirectError ? (
              <Alert className="sm:col-span-2" tone="error">
                {redirectError}
              </Alert>
            ) : null}

            {pendingPayment ? (
              <Alert className="sm:col-span-2" tone="warning">
                Một giao dịch VNPay đang chờ kết quả. Nếu tiếp tục, hệ thống sẽ
                mở lại đúng giao dịch đó để tránh thanh toán trùng.
              </Alert>
            ) : null}

            <div className="sm:col-span-2">
              <Button
                loading={createMutation.isPending || redirecting}
                type="submit"
              >
                {pendingPayment
                  ? 'Tiếp tục giao dịch VNPay'
                  : 'Thanh toán qua VNPay'}
              </Button>
            </div>
          </form>
        )}
      </Card> : null}

      <h2
        className="text-base font-bold text-slate-950"
        id={canPay ? undefined : 'customer-payments-title'}
      >
        {canPay ? 'Lịch sử thanh toán' : 'Thanh toán'}
      </h2>
      {paymentsQuery.isPending ? (
        <LoadingState label="Đang kiểm tra lịch sử thanh toán…" />
      ) : paymentsQuery.isError ? (
        <ErrorState
          description={getPaymentActionError(paymentsQuery.error)}
          onRetry={() => void paymentsQuery.refetch()}
        />
      ) : (
        <CustomerPaymentHistory payments={paymentsQuery.data.data} />
      )}
    </section>
  )
}

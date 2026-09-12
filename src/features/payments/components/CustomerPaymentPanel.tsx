import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { ApiError } from '@/api/errors'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import {
  Alert,
  ErrorState,
  LoadingState,
} from '@/shared/components/Feedback'

import { getCustomerPaymentActionError } from '../errors'
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
  const paymentStartInFlightRef = useRef(false)
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
    paymentStartInFlightRef.current = false
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

  const startPayment = () => {
    setRedirectError(null)

    if (
      paymentStartInFlightRef.current ||
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
    paymentStartInFlightRef.current = true
    setRedirecting(true)

    createMutation.mutate(
      {
        bookingId,
        idempotencyKey: activeAttempt.idempotencyKey,
        input: {},
      },
      {
        onError: (error) => {
          paymentStartInFlightRef.current = false
          setRedirecting(false)
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
            paymentStartInFlightRef.current = false
            setRedirecting(false)
            setRedirectError(
              'Không thể mở cổng thanh toán. Yêu cầu của bạn không bị gửi lại; vui lòng kiểm tra lịch sử bên dưới rồi thử lại.',
            )
            void paymentsQuery.refetch()
            return
          }

          window.location.assign(paymentUrl)
        },
      },
    )
  }

  return (
    <section className="grid gap-4" aria-labelledby="customer-payments-title">
      {canPay ? <Card>
        <h2 id="customer-payments-title" className="text-lg font-bold text-ink">
          Thanh toán
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
          Bạn sẽ chọn phương thức thanh toán và ngôn ngữ tại cổng VNPay ở bước
          tiếp theo. Số tiền được lấy từ thông tin đặt phòng đã xác nhận.
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
              : 'Chưa thể xác nhận giao dịch đang mở. Vui lòng tải lại trang hoặc liên hệ Homi Stay nếu tình trạng vẫn tiếp diễn.'}
          </Alert>
        ) : (
          <div className="mt-5 grid gap-4">
            {createMutation.isError ? (
              <Alert tone="error">
                {getCustomerPaymentActionError(createMutation.error)}
              </Alert>
            ) : null}

            {redirectError ? (
              <Alert tone="error">
                {redirectError}
              </Alert>
            ) : null}

            {pendingPayment ? (
              <Alert tone="warning">
                Một giao dịch VNPay đang chờ kết quả. Bạn có thể tiếp tục giao
                dịch này mà không tạo thêm khoản thanh toán mới.
              </Alert>
            ) : null}

            <div className="flex">
              <Button
                className="w-full sm:w-auto"
                loading={createMutation.isPending || redirecting}
                onClick={startPayment}
              >
                {pendingPayment
                  ? 'Tiếp tục giao dịch VNPay'
                  : 'Tiếp tục đến VNPay'}
              </Button>
            </div>
          </div>
        )}
      </Card> : null}

      <h2
        className="text-base font-bold text-ink"
        id={canPay ? undefined : 'customer-payments-title'}
      >
        {canPay ? 'Lịch sử thanh toán' : 'Thanh toán'}
      </h2>
      {paymentsQuery.isPending ? (
        <LoadingState label="Đang kiểm tra lịch sử thanh toán…" />
      ) : paymentsQuery.isError ? (
        <ErrorState
          description={getCustomerPaymentActionError(paymentsQuery.error)}
          onRetry={() => void paymentsQuery.refetch()}
        />
      ) : (
        <CustomerPaymentHistory payments={paymentsQuery.data.data} />
      )}
    </section>
  )
}

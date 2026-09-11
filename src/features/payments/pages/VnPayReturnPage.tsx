import {
  useEffect,
  useState,
} from 'react'
import { useLocation } from 'react-router-dom'

import { useAuth } from '@/auth/useAuth'
import { useCustomerBooking } from '@/features/bookings'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import {
  Alert,
  ErrorState,
  LoadingState,
} from '@/shared/components/Feedback'
import { LinkButton } from '@/shared/components/LinkButton'
import { PageHeader } from '@/shared/components/PageHeader'

import { getCustomerPaymentActionError } from '../errors'
import {
  useCustomerPayments,
  useVnPayReturn,
} from '../hooks'
import {
  getCurrentVnPayAttempt,
} from '../idempotency'
import { isTerminalPaymentStatus } from '../safety'
import {
  getVnPayCustomerBookingId,
  hasVnPayGatewayParameters,
  matchesVnPayReturnAttempt,
  parseVnPayFrontendReturn,
} from '../vnpayReturn'

const POLLING_DURATION = 120_000

export function VnPayReturnPage() {
  const location = useLocation()
  const { principal, status: authStatus } = useAuth()
  const [attempt] = useState(() => getCurrentVnPayAttempt())
  const [pollingDeadline, setPollingDeadline] = useState<number | null>(
    () => Date.now() + POLLING_DURATION,
  )
  const frontendReturnResult = parseVnPayFrontendReturn(
    location.search,
  )
  const hasGatewayParameters = hasVnPayGatewayParameters(
    location.search,
  )
  const returnQuery = useVnPayReturn(location.search)
  const returnResult = frontendReturnResult ?? returnQuery.data
  const returnMatchesAttempt = matchesVnPayReturnAttempt(
    attempt,
    returnResult,
  )
  const canReadCustomerHistory =
    authStatus === 'authenticated' &&
    principal?.actorType === 'customer' &&
    returnMatchesAttempt
  const customerBookingId = canReadCustomerHistory
    ? attempt?.bookingId
    : undefined
  const paymentId = returnResult?.paymentId ?? 'missing'
  const paymentsQuery = useCustomerPayments(
    customerBookingId,
    { limit: 20, page: 1 },
    {
      deadline:
        returnResult?.paymentStatus === 'PENDING'
          ? pollingDeadline
          : null,
      enabled: canReadCustomerHistory,
      paymentId,
    },
  )
  const bookingQuery = useCustomerBooking(customerBookingId)
  const refetchBooking = bookingQuery.refetch
  const authoritativePayment = paymentsQuery.data?.data.find(
    (payment) => payment.id === returnResult?.paymentId,
  )
  const paymentStatus =
    authoritativePayment?.status ?? returnResult?.paymentStatus ?? null
  const customerBookingIdForNavigation = getVnPayCustomerBookingId(
    attempt,
    returnResult,
  )
  const polling =
    canReadCustomerHistory &&
    paymentStatus === 'PENDING' &&
    pollingDeadline !== null

  useEffect(() => {
    if (pollingDeadline === null) {
      return
    }

    const remaining = pollingDeadline - Date.now()

    if (remaining <= 0) {
      setPollingDeadline(null)
      return
    }

    const timeout = window.setTimeout(
      () => setPollingDeadline(null),
      remaining,
    )
    return () => window.clearTimeout(timeout)
  }, [pollingDeadline])

  useEffect(() => {
    if (
      authoritativePayment &&
      isTerminalPaymentStatus(authoritativePayment.status)
    ) {
      void refetchBooking()
    }
  }, [
    authoritativePayment,
    refetchBooking,
  ])

  const retryAuthoritativeState = () => {
    setPollingDeadline(Date.now() + POLLING_DURATION)
    void returnQuery.refetch()

    if (canReadCustomerHistory) {
      void paymentsQuery.refetch()
      void refetchBooking()
    }
  }

  let content

  if (!hasGatewayParameters && !frontendReturnResult) {
    content = (
      <Alert tone="error" title="Không thể kiểm tra giao dịch">
        Thông tin thanh toán trả về chưa đầy đủ. Vui lòng mở lại đặt phòng để
        kiểm tra trạng thái hoặc thử thanh toán lại.
      </Alert>
    )
  } else if (hasGatewayParameters && returnQuery.isPending) {
    content = <LoadingState label="Đang kiểm tra kết quả thanh toán…" />
  } else if (hasGatewayParameters && returnQuery.isError) {
    content = (
      <ErrorState
        description={getCustomerPaymentActionError(returnQuery.error)}
        onRetry={() => void returnQuery.refetch()}
      />
    )
  } else if (!returnResult) {
    content = (
      <Alert tone="warning">
        Chưa thể kiểm tra kết quả thanh toán. Vui lòng thử lại sau ít phút.
      </Alert>
    )
  } else if (!returnResult.validSignature) {
    content = (
      <Alert tone="error" title="Thông tin thanh toán không hợp lệ">
        Chúng tôi không thể xác nhận thông tin vừa nhận. Vui lòng quay lại đặt
        phòng để kiểm tra trạng thái trước khi thanh toán lại.
      </Alert>
    )
  } else if (!returnResult.paymentId || !returnResult.paymentStatus) {
    content = (
      <Alert tone="warning" title="Chưa xác định được giao dịch">
        Chưa tìm thấy khoản thanh toán tương ứng. Vui lòng kiểm tra lịch sử
        trong chi tiết đặt phòng.
      </Alert>
    )
  } else if (attempt && !returnMatchesAttempt) {
    content = (
      <Alert tone="warning" title="Giao dịch không khớp">
        Thông tin vừa nhận không khớp với lần thanh toán được mở trên thiết bị
        này. Vui lòng kiểm tra trạng thái trong chi tiết đặt phòng.
      </Alert>
    )
  } else if (
    attempt &&
    authStatus === 'restoring'
  ) {
    content = (
      <LoadingState label="Đang khôi phục phiên đăng nhập…" />
    )
  } else if (
    canReadCustomerHistory &&
    paymentsQuery.isPending
  ) {
    content = (
      <LoadingState label="Đang kiểm tra trạng thái thanh toán…" />
    )
  } else if (
    canReadCustomerHistory &&
    paymentsQuery.isError
  ) {
    content = (
      <ErrorState
        description={getCustomerPaymentActionError(paymentsQuery.error)}
        onRetry={retryAuthoritativeState}
      />
    )
  } else if (
    canReadCustomerHistory &&
    !authoritativePayment
  ) {
    content = (
      <Alert tone="warning" title="Đang cập nhật kết quả">
        Chưa thấy giao dịch trong lịch sử đặt phòng. Trang sẽ tiếp tục cập nhật
        trong ít phút{polling ? '…' : '.'}
      </Alert>
    )
  } else if (paymentStatus === 'SUCCESS') {
    content = (
      <Alert
        tone={authoritativePayment ? 'success' : 'info'}
        title={
          authoritativePayment
            ? 'Thanh toán thành công'
            : 'Đang xác nhận thanh toán'
        }
      >
        {authoritativePayment
          ? 'Khoản thanh toán đã được ghi nhận. Trạng thái đặt phòng đang được cập nhật.'
          : 'VNPay đã gửi kết quả, nhưng khoản thanh toán chưa xuất hiện trong lịch sử. Vui lòng đăng nhập và kiểm tra chi tiết đặt phòng.'}
      </Alert>
    )
  } else if (paymentStatus === 'PENDING') {
    content = canReadCustomerHistory ? (
      <Alert tone="info" title="Giao dịch đang được xử lý">
        Chúng tôi đang cập nhật kết quả từ VNPay. Bạn chưa cần thanh toán lại
        {polling ? '…' : '.'}
        {!polling
          ? ' Quá trình kiểm tra tự động đã tạm dừng; bạn có thể kiểm tra lại ngay.'
          : null}
      </Alert>
    ) : (
      <Alert tone="warning" title="Chưa thể kiểm tra tự động">
        Vui lòng đăng nhập và mở chi tiết đặt phòng để xem kết quả. Không nên
        tạo thêm giao dịch khi trạng thái hiện tại chưa rõ ràng.
      </Alert>
    )
  } else if (paymentStatus === 'REQUIRES_REVIEW') {
    content = (
      <Alert tone="warning" title="Giao dịch đang được kiểm tra">
        Kết quả thanh toán đến sau khi đặt phòng đã đóng. Homestay Green đang
        kiểm tra và sẽ cập nhật khi có kết quả cuối cùng.
      </Alert>
    )
  } else if (paymentStatus === 'FAILED') {
    content = (
      <Alert tone="warning" title="Thanh toán chưa thành công">
        Giao dịch đã kết thúc mà chưa ghi nhận thanh toán. Vui lòng quay lại
        đặt phòng và kiểm tra trạng thái trước khi thử lại.
      </Alert>
    )
  } else {
    content = (
      <Alert title="Giao dịch đã hoàn tiền">
        Khoản thanh toán đã được ghi nhận hoàn tiền.
      </Alert>
    )
  }

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-6">
      <PageHeader
        eyebrow="Thanh toán VNPay"
        title="Kết quả thanh toán"
        description="Kết quả thanh toán sẽ được cập nhật trong chi tiết đặt phòng."
      />
      <Card>
        {content}
        <div className="mt-5 flex flex-wrap gap-3">
          {paymentStatus === 'PENDING' ? (
            <Button
              onClick={retryAuthoritativeState}
              variant="outline"
            >
              Kiểm tra lại
            </Button>
          ) : null}
          {customerBookingIdForNavigation ? (
            <LinkButton
              to={`/bookings/${customerBookingIdForNavigation}`}
            >
              Xem chi tiết đặt phòng
            </LinkButton>
          ) : (
            <LinkButton to="/bookings">
              Về danh sách đặt phòng
            </LinkButton>
          )}
        </div>
      </Card>
    </div>
  )
}

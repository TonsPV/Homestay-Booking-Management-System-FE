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
  const customerBookingIdForNavigation = getVnPayCustomerBookingId(
    attempt,
    returnResult,
  )
  const canReadCustomerHistory =
    authStatus === 'authenticated' &&
    principal?.actorType === 'customer' &&
    Boolean(customerBookingIdForNavigation)
  const customerBookingId =
    canReadCustomerHistory && customerBookingIdForNavigation
      ? customerBookingIdForNavigation
      : undefined
  const paymentId = returnResult?.paymentId ?? 'missing'
  const paymentsQuery = useCustomerPayments(
    customerBookingId,
    { limit: 20, page: 1 },
    {
      deadline: returnResult?.validSignature
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
  const paymentStatus = authoritativePayment?.status ?? null
  const paymentIsTerminal = Boolean(
    authoritativePayment &&
      isTerminalPaymentStatus(authoritativePayment.status),
  )
  const bookingDetailsPath = customerBookingIdForNavigation
    ? `/bookings/${customerBookingIdForNavigation}`
    : '/bookings'
  const requiresCustomerSignIn =
    authStatus === 'anonymous' &&
    Boolean(customerBookingIdForNavigation)
  const canRetryAuthoritativeState =
    canReadCustomerHistory &&
    (paymentsQuery.isError ||
      (!paymentIsTerminal && pollingDeadline === null))
  const refreshingAuthoritativeState =
    canRetryAuthoritativeState &&
    (paymentsQuery.isFetching || bookingQuery.isFetching)
  const polling =
    canReadCustomerHistory &&
    !paymentIsTerminal &&
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
    if (!canReadCustomerHistory) {
      return
    }

    setPollingDeadline(Date.now() + POLLING_DURATION)
    void paymentsQuery.refetch()
    void refetchBooking()
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
    content = <LoadingState label="Đang xác nhận thanh toán…" />
  } else if (hasGatewayParameters && returnQuery.isError) {
    content = (
      <Alert tone="error" title="Không thể xác nhận thanh toán">
        {getCustomerPaymentActionError(returnQuery.error)}
      </Alert>
    )
  } else if (!returnResult) {
    content = (
      <Alert tone="warning" title="Đang chờ kết quả thanh toán">
        Chúng tôi chưa nhận được kết quả từ VNPay. Vui lòng thử kiểm tra lại
        sau ít phút.
      </Alert>
    )
  } else if (!returnResult.validSignature) {
    content = (
      <Alert tone="error" title="Thông tin thanh toán không hợp lệ">
        Chúng tôi không thể xác nhận thông tin vừa nhận. Vui lòng quay lại đặt
        phòng để kiểm tra trạng thái trước khi thanh toán lại.
      </Alert>
    )
  } else if (!returnResult.paymentId) {
    content = (
      <Alert tone="warning" title="Chưa xác định được giao dịch">
        Chưa tìm thấy mã khoản thanh toán tương ứng. Vui lòng kiểm tra lịch sử
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
  } else if (authStatus === 'restoring') {
    content = <LoadingState label="Đang xác nhận thanh toán…" />
  } else if (requiresCustomerSignIn) {
    content = (
      <Alert tone="warning" title="Cần đăng nhập để kiểm tra">
        Phiên đăng nhập của bạn không còn trên trình duyệt này. Hãy đăng nhập
        để hệ thống xác nhận trạng thái mới nhất trong chi tiết đặt phòng.
      </Alert>
    )
  } else if (
    canReadCustomerHistory &&
    paymentsQuery.isPending
  ) {
    content = <LoadingState label="Đang xác nhận thanh toán…" />
  } else if (
    canReadCustomerHistory &&
    paymentsQuery.isError
  ) {
    content = (
      <Alert tone="error" title="Không thể xác nhận thanh toán">
        {getCustomerPaymentActionError(paymentsQuery.error)}
      </Alert>
    )
  } else if (polling) {
    content = <LoadingState label="Đang xác nhận thanh toán…" />
  } else if (
    canReadCustomerHistory &&
    paymentStatus === 'PENDING'
  ) {
    content = (
      <Alert tone="warning" title="Giao dịch vẫn đang được xử lý">
        VNPay chưa gửi kết quả cuối cùng. Bạn chưa cần thanh toán lại; hãy kiểm
        tra lại sau ít phút hoặc xem chi tiết đặt phòng.
      </Alert>
    )
  } else if (
    canReadCustomerHistory &&
    !authoritativePayment
  ) {
    content = (
      <Alert tone="warning" title="Chưa tìm thấy giao dịch">
        Hệ thống chưa thấy khoản thanh toán trong lịch sử đặt phòng. Bạn có thể
        kiểm tra lại sau ít phút.
      </Alert>
    )
  } else if (paymentStatus === 'SUCCESS') {
    content = (
      <Alert tone="success" title="Thanh toán thành công">
        Khoản thanh toán đã được ghi nhận. Trạng thái đặt phòng đang được cập
        nhật.
      </Alert>
    )
  } else if (paymentStatus === 'FAILED') {
    content = (
      <Alert tone="error" title="Thanh toán không thành công">
        Giao dịch chưa được ghi nhận. Hãy quay lại chi tiết đặt phòng để kiểm
        tra trạng thái trước khi thử thanh toán lại.
      </Alert>
    )
  } else if (paymentStatus === 'REQUIRES_REVIEW') {
    content = (
      <Alert tone="warning" title="Giao dịch đang được kiểm tra">
        Kết quả thanh toán đến sau khi đặt phòng đã đóng. Homi Stay đang
        kiểm tra và sẽ cập nhật khi có kết quả cuối cùng.
      </Alert>
    )
  } else if (paymentStatus === 'REFUND_PENDING') {
    content = (
      <Alert tone="warning" title="Hoàn tiền đang được xử lý">
        Yêu cầu hoàn tiền đang chờ VNPay xử lý. Trạng thái sẽ được cập nhật khi
        có kết quả.
      </Alert>
    )
  } else if (paymentStatus === 'REFUNDED') {
    content = (
      <Alert tone="success" title="Đã hoàn tiền">
        Khoản thanh toán đã được ghi nhận hoàn tiền.
      </Alert>
    )
  } else {
    content = (
      <Alert tone="info" title="Đang xác nhận thanh toán">
        VNPay đã gửi kết quả. Chúng tôi sẽ hiển thị trạng thái cuối cùng ngay
        khi hệ thống xác nhận giao dịch.
      </Alert>
    )
  }

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-6">
      <PageHeader
        eyebrow="Thanh toán VNPay"
        title="Kết quả thanh toán"
        description="Kết quả chỉ được hiển thị sau khi hệ thống xác nhận giao dịch."
      />
      <Card>
        {content}
        <div className="mt-5 flex flex-wrap gap-3">
          {requiresCustomerSignIn ? (
            <LinkButton
              state={{ returnTo: bookingDetailsPath }}
              to="/login"
              variant="outline"
            >
              Đăng nhập để kiểm tra
            </LinkButton>
          ) : hasGatewayParameters && returnQuery.isError ? (
            <Button
              loading={returnQuery.isFetching}
              onClick={() => void returnQuery.refetch()}
              variant="outline"
            >
              Thử lại
            </Button>
          ) : canRetryAuthoritativeState ? (
            <Button
              loading={refreshingAuthoritativeState}
              onClick={retryAuthoritativeState}
              variant="outline"
            >
              Kiểm tra lại
            </Button>
          ) : null}
          {!requiresCustomerSignIn && customerBookingIdForNavigation ? (
            <LinkButton to={bookingDetailsPath}>
              Xem chi tiết đặt phòng
            </LinkButton>
          ) : !requiresCustomerSignIn ? (
            <LinkButton to="/bookings">
              Về danh sách đặt phòng
            </LinkButton>
          ) : null}
        </div>
      </Card>
    </div>
  )
}

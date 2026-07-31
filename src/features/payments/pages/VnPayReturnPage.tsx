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

import { getPaymentActionError } from '../errors'
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
      <Alert tone="error">
        URL không chứa dữ liệu trả về từ VNPay. Không thể xác minh giao dịch.
      </Alert>
    )
  } else if (hasGatewayParameters && returnQuery.isPending) {
    content = <LoadingState label="Đang xác minh phản hồi VNPay…" />
  } else if (hasGatewayParameters && returnQuery.isError) {
    content = (
      <ErrorState
        description={getPaymentActionError(returnQuery.error)}
        onRetry={() => void returnQuery.refetch()}
      />
    )
  } else if (!returnResult) {
    content = (
      <Alert tone="warning">
        Máy chủ chưa trả về dữ liệu xác minh. Vui lòng kiểm tra lại.
      </Alert>
    )
  } else if (!returnResult.validSignature) {
    content = (
      <Alert tone="error" title="Không thể xác thực phản hồi">
        Chữ ký VNPay không hợp lệ. Không sử dụng thông tin trên URL để kết luận
        trạng thái thanh toán.
      </Alert>
    )
  } else if (!returnResult.paymentId || !returnResult.paymentStatus) {
    content = (
      <Alert tone="warning" title="Chưa tìm thấy giao dịch">
        Phản hồi có chữ ký hợp lệ nhưng hệ thống chưa xác định được payment.
        Vui lòng kiểm tra lịch sử booking.
      </Alert>
    )
  } else if (attempt && !returnMatchesAttempt) {
    content = (
      <Alert tone="warning" title="Phản hồi không khớp payment đã mở">
        Booking hoặc payment trên Return không khớp attempt VNPay đã lưu trên
        thiết bị này. Giao diện không polling và không xóa idempotency key; vui
        lòng mở lịch sử booking để kiểm tra trạng thái chính thức.
      </Alert>
    )
  } else if (
    attempt &&
    authStatus === 'restoring'
  ) {
    content = (
      <LoadingState label="Đang khôi phục phiên để đọc lịch sử payment…" />
    )
  } else if (
    canReadCustomerHistory &&
    paymentsQuery.isPending
  ) {
    content = (
      <LoadingState label="Đang đọc trạng thái từ lịch sử payment…" />
    )
  } else if (
    canReadCustomerHistory &&
    paymentsQuery.isError
  ) {
    content = (
      <ErrorState
        description={getPaymentActionError(paymentsQuery.error)}
        onRetry={retryAuthoritativeState}
      />
    )
  } else if (
    canReadCustomerHistory &&
    !authoritativePayment
  ) {
    content = (
      <Alert tone="warning" title="Đang đồng bộ lịch sử">
        Return đã xác định payment #{returnResult.paymentId}, nhưng lịch sử
        booking chưa trả về bản ghi tương ứng. Giao diện sẽ tiếp tục kiểm tra
        trong thời gian hữu hạn
        {polling ? '…' : '.'}
      </Alert>
    )
  } else if (paymentStatus === 'SUCCESS') {
    content = (
      <Alert
        tone={authoritativePayment ? 'success' : 'info'}
        title="Thanh toán VNPay thành công"
      >
        {authoritativePayment
          ? 'Hệ thống đã ghi nhận trạng thái SUCCESS từ lịch sử payment sau khi backend xử lý callback VNPay.'
          : 'Đây vẫn là kết quả tạm thời trên URL Return. Hãy đăng nhập và kiểm tra lịch sử booking để xác nhận trạng thái chính thức.'}
      </Alert>
    )
  } else if (paymentStatus === 'PENDING') {
    content = canReadCustomerHistory ? (
      <Alert tone="info" title="Đang chờ backend xác nhận">
        Return không tự đánh dấu đã thanh toán. Trang đang polling lịch sử
        payment và sẽ tải lại booking khi có kết quả cuối
        {polling ? '…' : '.'}
        {!polling
          ? ' Thời gian chờ tự động đã kết thúc; bạn có thể bắt đầu một lượt kiểm tra hữu hạn mới.'
          : null}
      </Alert>
    ) : (
      <Alert tone="warning" title="Chưa thể polling lịch sử">
        Return đang báo PENDING, nhưng không có booking attempt hoặc phiên
        Customer phù hợp để đọc lịch sử có kiểm soát quyền sở hữu. Giao diện
        không gửi thêm payment request; hãy đăng nhập và mở lịch sử booking.
      </Alert>
    )
  } else if (paymentStatus === 'REQUIRES_REVIEW') {
    content = (
      <Alert tone="warning" title="Giao dịch cần đối soát">
        VNPay báo thành công sau khi booking đã đóng. Bộ phận quản lý cần đối
        soát thủ công; booking không được tự khôi phục.
      </Alert>
    )
  } else if (paymentStatus === 'FAILED') {
    content = (
      <Alert tone="warning" title="Attempt thanh toán đã đóng">
        Hệ thống đã đóng attempt này. Lịch sử payment cần được tải lại trước
        khi tạo một giao dịch mới.
      </Alert>
    )
  } else {
    content = (
      <Alert title="Giao dịch đã hoàn tiền">
        Trạng thái hoàn tiền đã được ghi nhận trên hệ thống.
      </Alert>
    )
  }

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-6">
      <PageHeader
        eyebrow="VNPay Return"
        title="Kết quả thanh toán"
        description="Trạng thái trong lịch sử payment sau khi backend xử lý callback VNPay mới là kết quả chính thức."
      />
      <Card>
        {content}
        {returnResult?.paymentId ? (
          <p className="mt-4 text-sm text-slate-600">
            Mã payment: <strong>#{returnResult.paymentId}</strong>
          </p>
        ) : null}
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
              Về chi tiết booking
            </LinkButton>
          ) : (
            <LinkButton to="/bookings">
              Về danh sách booking
            </LinkButton>
          )}
        </div>
      </Card>
    </div>
  )
}

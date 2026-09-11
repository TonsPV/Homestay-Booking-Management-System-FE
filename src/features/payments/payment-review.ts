import type { Payment, PaymentReviewReason } from './types'

/**
 * Server-state capability rules for REQUIRES_REVIEW payments. The Backend
 * (payment-refund.service) remains the final authority; these predicates only
 * mirror its public contract so the UI renders the right action per reason:
 *
 * - Standard VNPay refund accepts a REQUIRES_REVIEW payment only when
 *   booking.status === CANCELLED && reviewReason === BOOKING_CANCELLED.
 * - Duplicate-charge resolution accepts a REQUIRES_REVIEW payment only when
 *   reviewReason === ANOTHER_SUCCESSFUL_PAYMENT with a canonical payment link.
 */
export function isStandardRefundEligible(payment: Payment) {
  if (payment.status === 'SUCCESS') {
    return true
  }

  return (
    payment.method === 'VNPAY' &&
    payment.status === 'REQUIRES_REVIEW' &&
    payment.reviewReason === 'BOOKING_CANCELLED'
  )
}

export function isDuplicateChargeResolutionEligible(payment: Payment) {
  return (
    payment.method === 'VNPAY' &&
    payment.status === 'REQUIRES_REVIEW' &&
    payment.reviewReason === 'ANOTHER_SUCCESSFUL_PAYMENT' &&
    payment.reviewCanonicalPaymentId !== null &&
    payment.reviewCanonicalPaymentId !== payment.id
  )
}

/**
 * Short reason headline rendered next to the status badge. The two reasons
 * must never share one explanation: one is a late payment on a cancelled
 * booking, the other is a duplicate successful charge for a live booking.
 */
export function getPaymentReviewReasonLabel(
  reason: PaymentReviewReason,
): string {
  return reason === 'BOOKING_CANCELLED'
    ? 'Thanh toán sau khi đặt phòng đã hủy'
    : 'Trùng thanh toán cho cùng đặt phòng'
}

/**
 * Full review explanation shown in the payment row/detail so an admin can
 * decide from the transaction record.
 */
export function getPaymentReviewExplanation(payment: Payment): string | null {
  if (payment.status !== 'REQUIRES_REVIEW' || !payment.reviewReason) {
    return null
  }

  if (payment.reviewReason === 'BOOKING_CANCELLED') {
    return 'VNPay báo thanh toán thành công sau khi đặt phòng đã hủy. Có thể gửi yêu cầu hoàn tiền qua VNPay.'
  }

  return payment.reviewCanonicalPaymentId
    ? 'Đã phát hiện khoản thanh toán trùng cho cùng một đặt phòng. Chọn “Xử lý giao dịch trùng” để hoàn tiền riêng giao dịch này mà không ảnh hưởng đến đặt phòng.'
    : 'Có nhiều khoản thanh toán thành công cho cùng một đặt phòng. Hãy kiểm tra lại trước khi xử lý.'
}

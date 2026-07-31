import type {
  PaymentMethod,
  PaymentStatus,
} from '../types'

const statusLabels: Record<PaymentStatus, string> = {
  PENDING: 'Đang xử lý',
  SUCCESS: 'Thành công',
  FAILED: 'Đã đóng',
  REQUIRES_REVIEW: 'Cần đối soát',
  REFUND_PENDING: 'Đang hoàn tiền',
  REFUNDED: 'Đã hoàn tiền',
}

const methodLabels: Record<PaymentMethod, string> = {
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản',
  VNPAY: 'VNPay',
}

export function getPaymentStatusLabel(status: PaymentStatus) {
  return statusLabels[status]
}

export function getPaymentMethodLabel(method: PaymentMethod) {
  return methodLabels[method]
}

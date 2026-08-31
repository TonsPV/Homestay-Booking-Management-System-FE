import type {
  CustomerPaymentDto,
  OnlinePaymentDto,
  PaymentCreateVnPayPaymentData,
  PaymentDto,
  PaymentListData,
  PaymentManagementCreateData,
  PaymentManagementRefundData,
  PaymentManagementResolveDuplicateChargeData,
  PaymentMethod as GeneratedPaymentMethod,
  PaymentReviewReason as GeneratedPaymentReviewReason,
  PaymentStatus as GeneratedPaymentStatus,
  VnPayReturnDto,
} from '@/api/generated'

export const PAYMENT_METHODS = [
  'CASH',
  'BANK_TRANSFER',
  'VNPAY',
] as const satisfies readonly GeneratedPaymentMethod[]

export type PaymentMethod = GeneratedPaymentMethod
export type PaymentReviewReason = GeneratedPaymentReviewReason

export const PAYMENT_STATUSES = [
  'PENDING',
  'SUCCESS',
  'FAILED',
  'REQUIRES_REVIEW',
  'REFUND_PENDING',
  'REFUNDED',
] as const satisfies readonly GeneratedPaymentStatus[]

export type PaymentStatus = GeneratedPaymentStatus
export type CustomerPayment = CustomerPaymentDto
export type Payment = PaymentDto
export type OnlinePayment = OnlinePaymentDto
export type VnPayReturnResult = VnPayReturnDto

export type CreateVnPayPaymentInput =
  PaymentCreateVnPayPaymentData['body']
export type CreateManualPaymentInput =
  PaymentManagementCreateData['body']
export type RefundPaymentInput = PaymentManagementRefundData['body']
export type ResolveDuplicateChargeInput =
  PaymentManagementResolveDuplicateChargeData['body']
export type PaymentListQuery = NonNullable<PaymentListData['query']>

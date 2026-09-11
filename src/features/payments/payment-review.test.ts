import { describe, expect, it } from 'vitest'

import type { Payment, PaymentReviewReason } from './types'
import {
  getPaymentReviewExplanation,
  getPaymentReviewReasonLabel,
  isDuplicateChargeResolutionEligible,
  isStandardRefundEligible,
} from './payment-review'

function payment(
  overrides: Partial<Record<string, unknown>> = {},
): Payment {
  return {
    amount: '1800000.00',
    bookingId: '901',
    createdAt: '2026-07-24T00:00:00.000Z',
    createdByUser: null,
    createdByUserId: null,
    currency: 'VND',
    expiresAt: null,
    gatewayName: 'VNPay',
    gatewayReference: 'P91',
    gatewayResponseCode: '00',
    gatewayTransactionDate: '20260724000102',
    gatewayTransactionId: 'TXN91',
    gatewayTransactionStatus: '00',
    id: '91',
    method: 'VNPAY',
    paidAt: '2026-07-24T00:01:00.000Z',
    refundedAt: null,
    refundedByUser: null,
    refundedByUserId: null,
    refundGatewayTransactionId: null,
    refundLastQueriedAt: null,
    refundMessage: null,
    refundPreviousStatus: null,
    refundReason: null,
    refundRequestId: null,
    refundRequestedAt: null,
    refundResponseCode: null,
    refundTransactionStatus: null,
    reviewCanonicalPaymentId: null,
    reviewReason: null,
    status: 'SUCCESS',
    updatedAt: '2026-07-24T00:00:00.000Z',
    ...overrides,
  } as Payment
}

interface Scenario {
  expected: {
    duplicateEligible: boolean
    explanation: string | null
    refundEligible: boolean
    reasonLabel: string | null
  }
  name: string
  payment: Payment
}

const reviewReason = (reason: PaymentReviewReason) => reason

const scenarios: Scenario[] = [
  {
    name: 'SUCCESS: standard refund available, no review copy',
    payment: payment(),
    expected: {
      refundEligible: true,
      duplicateEligible: false,
      reasonLabel: null,
      explanation: null,
    },
  },
  {
    name: 'REQUIRES_REVIEW + BOOKING_CANCELLED: standard refund, no duplicate resolution',
    payment: payment({
      status: 'REQUIRES_REVIEW',
      reviewReason: reviewReason('BOOKING_CANCELLED'),
    }),
    expected: {
      refundEligible: true,
      duplicateEligible: false,
      reasonLabel: 'Thanh toán sau khi đặt phòng đã hủy',
      explanation:
        'VNPay báo thanh toán thành công sau khi đặt phòng đã hủy. Có thể gửi yêu cầu hoàn tiền qua VNPay.',
    },
  },
  {
    name: 'REQUIRES_REVIEW + ANOTHER_SUCCESSFUL_PAYMENT: duplicate resolution only, standard refund hidden',
    payment: payment({
      status: 'REQUIRES_REVIEW',
      reviewReason: reviewReason('ANOTHER_SUCCESSFUL_PAYMENT'),
      reviewCanonicalPaymentId: '90',
    }),
    expected: {
      refundEligible: false,
      duplicateEligible: true,
      reasonLabel: 'Trùng thanh toán cho cùng đặt phòng',
      explanation:
        'Đã phát hiện khoản thanh toán trùng cho cùng một đặt phòng. Chọn “Xử lý giao dịch trùng” để hoàn tiền riêng giao dịch này mà không ảnh hưởng đến đặt phòng.',
    },
  },
  {
    name: 'REFUND_PENDING: neither action, reconciliation only',
    payment: payment({
      status: 'REFUND_PENDING',
      refundRequestId: 'R91',
      refundRequestedAt: '2026-07-29T01:00:00.000Z',
    }),
    expected: {
      refundEligible: false,
      duplicateEligible: false,
      reasonLabel: null,
      explanation: null,
    },
  },
  {
    name: 'REFUNDED: no further actions',
    payment: payment({
      status: 'REFUNDED',
      refundedAt: '2026-07-29T01:05:00.000Z',
      refundRequestId: 'R91',
    }),
    expected: {
      refundEligible: false,
      duplicateEligible: false,
      reasonLabel: null,
      explanation: null,
    },
  },
  {
    name: 'ANOTHER_SUCCESSFUL_PAYMENT without canonical link: no duplicate resolution',
    payment: payment({
      status: 'REQUIRES_REVIEW',
      reviewReason: reviewReason('ANOTHER_SUCCESSFUL_PAYMENT'),
      reviewCanonicalPaymentId: null,
    }),
    expected: {
      refundEligible: false,
      duplicateEligible: false,
      reasonLabel: 'Trùng thanh toán cho cùng đặt phòng',
      explanation:
        'Có nhiều khoản thanh toán thành công cho cùng một đặt phòng. Hãy kiểm tra lại trước khi xử lý.',
    },
  },
  {
    name: 'canonical payment pointing at itself: no duplicate resolution',
    payment: payment({
      status: 'REQUIRES_REVIEW',
      reviewReason: reviewReason('ANOTHER_SUCCESSFUL_PAYMENT'),
      reviewCanonicalPaymentId: '91',
    }),
    expected: {
      refundEligible: false,
      duplicateEligible: false,
      reasonLabel: 'Trùng thanh toán cho cùng đặt phòng',
      explanation:
        'Đã phát hiện khoản thanh toán trùng cho cùng một đặt phòng. Chọn “Xử lý giao dịch trùng” để hoàn tiền riêng giao dịch này mà không ảnh hưởng đến đặt phòng.',
    },
  },
  {
    name: 'duplicate review on CASH (not VNPAY): no duplicate resolution',
    payment: payment({
      method: 'CASH',
      status: 'REQUIRES_REVIEW',
      reviewReason: reviewReason('ANOTHER_SUCCESSFUL_PAYMENT'),
      reviewCanonicalPaymentId: '90',
      gatewayName: null,
      gatewayReference: null,
      gatewayTransactionId: null,
    }),
    expected: {
      refundEligible: false,
      duplicateEligible: false,
      reasonLabel: 'Trùng thanh toán cho cùng đặt phòng',
      explanation:
        'Đã phát hiện khoản thanh toán trùng cho cùng một đặt phòng. Chọn “Xử lý giao dịch trùng” để hoàn tiền riêng giao dịch này mà không ảnh hưởng đến đặt phòng.',
    },
  },
]

describe('payment review-reason capability matrix', () => {
  for (const scenario of scenarios) {
    it(scenario.name, () => {
      const { expected, payment: subject } = scenario

      expect(isStandardRefundEligible(subject)).toBe(
        expected.refundEligible,
      )
      expect(isDuplicateChargeResolutionEligible(subject)).toBe(
        expected.duplicateEligible,
      )
      expect(
        subject.reviewReason
          ? getPaymentReviewReasonLabel(subject.reviewReason)
          : null,
      ).toBe(expected.reasonLabel)
      expect(getPaymentReviewExplanation(subject)).toBe(
        expected.explanation,
      )

      // The two reasons must never share one explanation.
      if (
        subject.reviewReason === 'BOOKING_CANCELLED' ||
        subject.reviewReason === 'ANOTHER_SUCCESSFUL_PAYMENT'
      ) {
        expect(getPaymentReviewExplanation(subject)).not.toContain(
          getPaymentReviewReasonLabel(
            subject.reviewReason === 'BOOKING_CANCELLED'
              ? 'ANOTHER_SUCCESSFUL_PAYMENT'
              : 'BOOKING_CANCELLED',
          ),
        )
      }
    })
  }
})

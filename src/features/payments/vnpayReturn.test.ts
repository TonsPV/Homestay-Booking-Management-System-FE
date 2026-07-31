import { describe, expect, it } from 'vitest'

import type { PersistedVnPayAttempt } from './idempotency'
import {
  getVnPayCustomerBookingId,
  hasVnPayGatewayParameters,
  matchesVnPayReturnAttempt,
  parseVnPayFrontendReturn,
} from './vnpayReturn'

const attempt: PersistedVnPayAttempt = {
  bookingId: '12',
  createdAt: Date.now(),
  idempotencyKey: 'vnpay-attempt-1234',
  paymentId: '31',
}

describe('VNPay frontend return contract', () => {
  it('parses the normalized query produced by the Backend redirect', () => {
    const result = parseVnPayFrontendReturn(
      '?validSignature=true&paymentId=31&bookingId=12&paymentStatus=SUCCESS&responseCode=00&transactionStatus=00',
    )

    expect(result).toEqual({
      bookingId: '12',
      paymentId: '31',
      paymentStatus: 'SUCCESS',
      responseCode: '00',
      transactionStatus: '00',
      validSignature: true,
    })
    expect(matchesVnPayReturnAttempt(attempt, result ?? undefined)).toBe(
      true,
    )
  })

  it('accepts an invalid-signature redirect with nullable details', () => {
    expect(
      parseVnPayFrontendReturn('?validSignature=false'),
    ).toEqual({
      bookingId: null,
      paymentId: null,
      paymentStatus: null,
      responseCode: null,
      transactionStatus: null,
      validSignature: false,
    })
  })

  it('rejects malformed or duplicated normalized parameters', () => {
    expect(
      parseVnPayFrontendReturn(
        '?validSignature=true&validSignature=false',
      ),
    ).toBeNull()
    expect(
      parseVnPayFrontendReturn(
        '?validSignature=true&paymentId=abc&bookingId=12&paymentStatus=SUCCESS',
      ),
    ).toBeNull()
    expect(
      parseVnPayFrontendReturn(
        '?validSignature=true&paymentId=31&bookingId=12&paymentStatus=UNKNOWN',
      ),
    ).toBeNull()
  })

  it('does not match a forged booking or payment to the stored attempt', () => {
    expect(
      matchesVnPayReturnAttempt(attempt, {
        bookingId: '99',
        paymentId: '31',
        paymentStatus: 'SUCCESS',
        responseCode: '00',
        transactionStatus: '00',
        validSignature: true,
      }),
    ).toBe(false)
    expect(
      matchesVnPayReturnAttempt(attempt, {
        bookingId: '12',
        paymentId: '99',
        paymentStatus: 'SUCCESS',
        responseCode: '00',
        transactionStatus: '00',
        validSignature: true,
      }),
    ).toBe(false)
  })

  it('returns customers to the verified booking without trusting a mismatch', () => {
    const result = parseVnPayFrontendReturn(
      '?validSignature=true&paymentId=31&bookingId=12&paymentStatus=SUCCESS&responseCode=00&transactionStatus=00',
    )

    expect(
      getVnPayCustomerBookingId(attempt, result ?? undefined),
    ).toBe('12')
    expect(
      getVnPayCustomerBookingId(null, result ?? undefined),
    ).toBe('12')
    expect(
      getVnPayCustomerBookingId(
        { ...attempt, bookingId: '99' },
        result ?? undefined,
      ),
    ).toBeNull()
  })

  it('distinguishes raw gateway callbacks from frontend redirects', () => {
    expect(
      hasVnPayGatewayParameters('?vnp_TxnRef=P31&vnp_ResponseCode=00'),
    ).toBe(true)
    expect(
      hasVnPayGatewayParameters(
        '?validSignature=true&paymentId=31&bookingId=12',
      ),
    ).toBe(false)
  })
})

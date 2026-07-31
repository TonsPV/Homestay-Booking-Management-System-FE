import { describe, expect, it } from 'vitest'

import { resolveSecurePaymentUrl } from './payment-url'

describe('resolveSecurePaymentUrl', () => {
  it('accepts an absolute HTTPS payment URL', () => {
    expect(
      resolveSecurePaymentUrl(
        'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_TxnRef=booking-1',
      ),
    ).toBe(
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_TxnRef=booking-1',
    )
  })

  it.each([
    'http://localhost:5173/payments/vnpay/return',
    'http://127.0.0.1:5173/payments/vnpay/return',
    'http://[::1]:5173/payments/vnpay/return',
  ])('accepts HTTP only for a loopback development URL: %s', (value) => {
    expect(resolveSecurePaymentUrl(value)).toBe(value)
  })

  it.each([
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'http://sandbox.vnpayment.vn/payment',
    'http://127.0.0.2:5173/payments/vnpay/return',
    'https://user:secret@sandbox.vnpayment.vn/payment',
    '/payment',
    'not-a-url',
  ])('rejects an unsafe payment URL: %s', (value) => {
    expect(resolveSecurePaymentUrl(value)).toBeNull()
  })
})

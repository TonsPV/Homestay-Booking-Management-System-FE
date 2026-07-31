import { zodResolver } from '@hookform/resolvers/zod'
import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useForm } from 'react-hook-form'

import { ApiError } from '@/api/errors'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import {
  Alert,
  ErrorState,
  LoadingState,
} from '@/shared/components/Feedback'
import {
  Field,
  Select,
} from '@/shared/components/FormControls'

import { getPaymentActionError } from '../errors'
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
  createVnPayFormSchema,
  type CreateVnPayFormValues,
} from '../schemas'
import {
  decideVnPayAttempt,
  findPendingVnPayPayment,
} from '../safety'
import { PaymentList } from './PaymentList'

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
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CreateVnPayFormValues>({
    defaultValues: { bankCode: '', locale: 'vn' },
    resolver: zodResolver(createVnPayFormSchema),
  })
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

  const submit = handleSubmit((values) => {
    setRedirectError(null)

    if (
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

    createMutation.mutate(
      {
        bookingId,
        idempotencyKey: activeAttempt.idempotencyKey,
        input: {
          bankCode: values.bankCode || undefined,
          locale: values.locale,
        },
      },
      {
        onError: (error) => {
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
            setRedirecting(false)
            setRedirectError(
              'Không thể mở cổng thanh toán vì máy chủ trả về địa chỉ không an toàn. Giao dịch chưa bị gửi lại; vui lòng kiểm tra lịch sử thanh toán.',
            )
            void paymentsQuery.refetch()
            return
          }

          setRedirecting(true)
          window.location.assign(paymentUrl)
        },
      },
    )
  })

  return (
    <section className="grid gap-4" aria-labelledby="customer-payments-title">
      <Card>
        <h2 id="customer-payments-title" className="text-lg font-bold text-slate-950">
          Thanh toán
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Số tiền do máy chủ lấy trực tiếp từ booking. Không đóng hoặc gửi lại
          liên tục khi giao dịch đang được xử lý.
        </p>

        {!canPay ? (
          <Alert className="mt-4">
            Booking hiện không ở trạng thái có thể tạo thanh toán mới.
          </Alert>
        ) : paymentsQuery.isPending ||
          paymentsQuery.isFetching ? (
          <Alert className="mt-4">
            Đang đối chiếu lịch sử payment trước khi cho phép tạo giao dịch
            mới…
          </Alert>
        ) : paymentsQuery.isError ? (
          <Alert className="mt-4" tone="warning">
            Chưa thể xác nhận booking có attempt đang xử lý hay không. Thanh
            toán mới tạm thời bị khóa.
          </Alert>
        ) : conflictBlocked ? (
          <Alert className="mt-4" tone="warning">
            Máy chủ trả về xung đột nhưng chưa cung cấp mã lỗi nghiệp vụ để
            phân biệt nguyên nhân. Giao diện đã khóa thao tác và tải lại dữ
            liệu; vui lòng kiểm tra lịch sử rồi tải lại trang trước khi thao
            tác tiếp.
          </Alert>
        ) : attemptDecision.kind === 'blocked' ? (
          <Alert
            className="mt-4"
            tone="warning"
            title={
              attemptDecision.reason === 'pending-without-key'
                ? 'Đang có giao dịch VNPay chờ xử lý'
                : 'Chưa đối chiếu được attempt đã lưu'
            }
          >
            Payment #{attemptDecision.paymentId}{' '}
            {attemptDecision.reason === 'pending-without-key'
              ? 'không có idempotency key tương ứng trên thiết bị này.'
              : 'không xuất hiện trong trang lịch sử vừa tải.'}{' '}
            Để tránh tạo hoặc replay nhầm attempt, giao diện sẽ không gửi
            request thanh toán mới.
          </Alert>
        ) : (
          <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
            <Field label="Kênh thanh toán" error={errors.bankCode?.message}>
              <Select {...register('bankCode')}>
                <option value="">Chọn tại cổng VNPay</option>
                <option value="VNPAYQR">VNPay QR</option>
                <option value="VNBANK">Thẻ/tài khoản nội địa</option>
                <option value="INTCARD">Thẻ quốc tế</option>
              </Select>
            </Field>
            <Field label="Ngôn ngữ cổng thanh toán" error={errors.locale?.message}>
              <Select {...register('locale')}>
                <option value="vn">Tiếng Việt</option>
                <option value="en">English</option>
              </Select>
            </Field>

            {createMutation.isError ? (
              <Alert className="sm:col-span-2" tone="error">
                {getPaymentActionError(createMutation.error)}
              </Alert>
            ) : null}

            {redirectError ? (
              <Alert className="sm:col-span-2" tone="error">
                {redirectError}
              </Alert>
            ) : null}

            {pendingPayment ? (
              <Alert className="sm:col-span-2" tone="warning">
                Booking đang có payment #{pendingPayment.id} chờ xử lý. Thao
                tác tiếp theo chỉ replay idempotency key đã lưu, không tạo key
                mới.
              </Alert>
            ) : null}

            <div className="sm:col-span-2">
              <Button
                loading={createMutation.isPending || redirecting}
                type="submit"
              >
                {pendingPayment
                  ? 'Tiếp tục giao dịch VNPay'
                  : 'Thanh toán qua VNPay'}
              </Button>
            </div>
          </form>
        )}
      </Card>

      <h2 className="text-base font-bold text-slate-950">
        Lịch sử giao dịch
      </h2>
      {paymentsQuery.isPending ? (
        <LoadingState label="Đang tải lịch sử thanh toán…" />
      ) : paymentsQuery.isError ? (
        <ErrorState
          description={getPaymentActionError(paymentsQuery.error)}
          onRetry={() => void paymentsQuery.refetch()}
        />
      ) : (
        <PaymentList payments={paymentsQuery.data.data} />
      )}
    </section>
  )
}

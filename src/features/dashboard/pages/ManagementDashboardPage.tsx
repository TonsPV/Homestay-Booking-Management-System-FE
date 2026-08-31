import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

import { getErrorMessage } from "@/api/errors";
import {
  createDefaultDashboardDateRange,
  dashboardDateRangeSchema,
  formatDashboardMoney,
  formatDashboardPercentage,
  formatDashboardRange,
  useDashboardSummary,
  type DashboardDateRangeValues,
  type DashboardSummary,
} from "@/features/dashboard";
import { Button } from "@/shared/components/Button";
import { Card } from "@/shared/components/Card";
import {
  Alert,
  ErrorState,
  LoadingState,
} from "@/shared/components/Feedback";
import { Field, Input } from "@/shared/components/FormControls";
import { PageHeader } from "@/shared/components/PageHeader";
import {
  formatDateTime,
  formatNumber,
} from "@/shared/formatting/formatters";

interface CountRow {
  label: string;
  to?: string;
  value: number;
}

function SummaryRows({ rows }: { rows: CountRow[] }) {
  return (
    <dl className="mt-4 divide-y divide-line">
      {rows.map((row) => (
        <div
          className="flex min-h-12 items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
          key={row.label}
        >
          <dt className="text-sm text-muted">
            {row.to ? (
              <Link
                className="font-semibold text-ink underline-offset-4 hover:text-brand hover:underline"
                to={row.to}
              >
                {row.label}
              </Link>
            ) : (
              row.label
            )}
          </dt>
          <dd className="text-base font-semibold tabular-nums text-ink">
            {formatNumber(row.value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function DashboardSummaryContent({ summary }: { summary: DashboardSummary }) {
  const bookingTotal = Object.values(summary.bookings).reduce(
    (total, count) => total + count,
    0,
  );
  const roomsTotal = Object.values(summary.rooms).reduce(
    (total, count) => total + count,
    0,
  );
  const paymentsNeedingAttention = summary.payments.requiresReview;
  const refundsNeedingAttention = summary.payments.refundPending;
  const needsAttention =
    paymentsNeedingAttention > 0 || refundsNeedingAttention > 0;
  const attentionTotal = paymentsNeedingAttention + refundsNeedingAttention;
  const occupancyWidth = Math.min(
    100,
    Math.max(0, summary.occupancy.occupancyRate),
  );
  const hasNoRangeActivity =
    bookingTotal === 0 &&
    summary.revenue.total === 0 &&
    summary.totalRefunded === 0 &&
    summary.occupancy.roomNightsReserved === 0 &&
    paymentsNeedingAttention === 0 &&
    refundsNeedingAttention === 0;

  const bookingRows: CountRow[] = [
    {
      label: "Chờ thanh toán",
      to: "/management/bookings?status=PENDING_PAYMENT",
      value: summary.bookings.pendingPayment,
    },
    {
      label: "Đã xác nhận",
      to: "/management/bookings?status=CONFIRMED",
      value: summary.bookings.confirmed,
    },
    {
      label: "Đang lưu trú",
      to: "/management/bookings?status=CHECKED_IN",
      value: summary.bookings.checkedIn,
    },
    {
      label: "Đã trả phòng",
      to: "/management/bookings?status=CHECKED_OUT",
      value: summary.bookings.checkedOut,
    },
    {
      label: "Đã hủy",
      to: "/management/bookings?status=CANCELLED",
      value: summary.bookings.cancelled,
    },
  ];
  const roomRows: CountRow[] = [
    { label: "Sẵn sàng đón khách", value: summary.rooms.ready },
    { label: "Khách đang lưu trú", value: summary.rooms.occupied },
    { label: "Đang dọn", value: summary.rooms.cleaning },
    { label: "Bảo trì", value: summary.rooms.maintenance },
  ];

  return (
    <div className="space-y-6">
      <Card aria-labelledby="key-metrics-title" className="p-0">
        <div className="border-b border-line px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-eyebrow text-brand">
            {formatDashboardRange(summary.fromDate, summary.toDate)}
          </p>
          <h2
            className="mt-1 text-lg font-bold text-ink"
            id="key-metrics-title"
          >
            Chỉ số chính
          </h2>
        </div>
        <dl className="grid gap-px bg-line sm:grid-cols-3">
          <div className="bg-surface p-5">
            <dt className="text-sm font-semibold text-muted">
              Doanh thu ghi nhận
            </dt>
            <dd className="mt-2 text-3xl font-bold tracking-tight tabular-nums text-ink">
              {formatDashboardMoney(summary.revenue.total)}
            </dd>
            <p className="mt-1 text-xs text-muted">Thanh toán thành công</p>
          </div>
          <div className="bg-surface p-5">
            <dt className="text-sm font-semibold text-muted">Công suất</dt>
            <dd className="mt-2 text-2xl font-bold tracking-tight tabular-nums text-ink">
              {formatDashboardPercentage(summary.occupancy.occupancyRate)}
            </dd>
            <p className="mt-1 text-xs text-muted">
              Không tính đêm phòng bị khóa
            </p>
          </div>
          <div className="bg-surface p-5">
            <dt className="text-sm font-semibold text-muted">
              Booking tạo trong kỳ
            </dt>
            <dd className="mt-2 text-2xl font-bold tracking-tight tabular-nums text-ink">
              {formatNumber(bookingTotal)}
            </dd>
            <p className="mt-1 text-xs text-muted">Gồm mọi trạng thái</p>
          </div>
        </dl>
      </Card>

      {hasNoRangeActivity ? (
        <Alert title="Không có phát sinh trong kỳ">
          Khoảng ngày này chưa có booking, doanh thu hoặc đêm phòng đã giữ
          chỗ. Số 0 là dữ liệu hợp lệ; trạng thái phòng hiện tại vẫn được
          hiển thị bên dưới.
        </Alert>
      ) : null}

      {needsAttention ? (
        <Alert
          data-attention
          title={`${formatNumber(attentionTotal)} việc cần xử lý`}
          tone="warning"
        >
          <div className="flex flex-wrap items-center gap-3">
            <Link
              className="font-semibold underline-offset-4 hover:underline"
              to="/management/payments?status=REQUIRES_REVIEW"
            >
              Cần đối soát · {formatNumber(paymentsNeedingAttention)}
            </Link>
            <span aria-hidden="true" className="text-muted">
              ·
            </span>
            <Link
              className="font-semibold underline-offset-4 hover:underline"
              to="/management/payments?status=REFUND_PENDING"
            >
              Chờ hoàn tiền · {formatNumber(refundsNeedingAttention)}
            </Link>
          </div>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card aria-labelledby="booking-status-title">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                className="text-lg font-bold text-ink"
                id="booking-status-title"
              >
                Booking theo trạng thái
              </h2>
              <p className="mt-1 text-sm text-muted">
                Booking được tạo trong khoảng báo cáo.
              </p>
            </div>
            <Link
              className="shrink-0 text-sm font-semibold text-brand hover:text-brand-strong hover:underline"
              to="/management/bookings"
            >
              Xem tất cả
            </Link>
          </div>
          <SummaryRows rows={bookingRows} />
        </Card>

        <Card aria-labelledby="room-status-title">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                className="text-lg font-bold text-ink"
                id="room-status-title"
              >
                Trạng thái phòng hiện tại
              </h2>
              <p className="mt-1 text-sm text-muted">
                {formatNumber(roomsTotal)} phòng đang hoạt động.
              </p>
            </div>
            <Link
              className="shrink-0 text-sm font-semibold text-brand hover:text-brand-strong hover:underline"
              to="/management/rooms"
            >
              Quản lý phòng
            </Link>
          </div>
          <SummaryRows rows={roomRows} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card aria-labelledby="revenue-title">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-ink" id="revenue-title">
                Doanh thu và hoàn tiền
              </h2>
              <p className="mt-1 text-sm text-muted">
                Tổng tiền theo giao dịch đã hoàn tất trong kỳ.
              </p>
            </div>
            <Link
              className="shrink-0 text-sm font-semibold text-brand hover:text-brand-strong hover:underline"
              to="/management/payments"
            >
              Xem giao dịch
            </Link>
          </div>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted">VNPay</dt>
              <dd className="mt-1 text-lg font-bold tabular-nums text-ink">
                {formatDashboardMoney(summary.revenue.vnpay)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Tiền mặt / chuyển khoản</dt>
              <dd className="mt-1 text-lg font-bold tabular-nums text-ink">
                {formatDashboardMoney(summary.revenue.manual)}
              </dd>
            </div>
            <div className="border-t border-line pt-4 sm:col-span-2">
              <dt className="text-sm text-muted">Đã hoàn tiền</dt>
              <dd className="mt-1 text-lg font-bold tabular-nums text-ink">
                {formatDashboardMoney(summary.totalRefunded)}
              </dd>
            </div>
          </dl>
        </Card>

        <Card aria-labelledby="occupancy-title">
          <h2 className="text-lg font-bold text-ink" id="occupancy-title">
            Công suất phòng
          </h2>
          <p className="mt-1 text-sm text-muted">
            Đêm đã giữ chỗ trên năng lực phòng vận hành.
          </p>
          <div className="mt-6 flex items-end justify-between gap-4">
            <p className="text-3xl font-bold tracking-tight tabular-nums text-ink">
              {formatDashboardPercentage(summary.occupancy.occupancyRate)}
            </p>
            <p className="text-sm font-semibold tabular-nums text-muted">
              {formatNumber(summary.occupancy.roomNightsReserved)} /{" "}
              {formatNumber(summary.occupancy.roomNightsAvailable)} đêm
            </p>
          </div>
          <div
            aria-label={`Công suất phòng ${formatDashboardPercentage(summary.occupancy.occupancyRate)}`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={occupancyWidth}
            className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface-muted"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-base ease-calm motion-reduce:transition-none"
              style={{ width: `${occupancyWidth}%` }}
            />
          </div>
          <p className="mt-4 text-xs leading-5 text-muted">
            Đêm bị khóa và phòng ẩn không được tính vào năng lực khả dụng.
          </p>
        </Card>
      </div>

      <p className="text-right text-xs text-muted">
        Dữ liệu được tổng hợp lúc {formatDateTime(summary.generatedAt)}.
      </p>
    </div>
  );
}

export function ManagementDashboardPage() {
  const [appliedRange, setAppliedRange] = useState<DashboardDateRangeValues>(
    () => createDefaultDashboardDateRange(),
  );
  const summaryQuery = useDashboardSummary(appliedRange);
  const form = useForm<DashboardDateRangeValues>({
    defaultValues: appliedRange,
    resolver: zodResolver(dashboardDateRangeSchema),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        description="Theo dõi booking, phòng và thanh toán từ dữ liệu vận hành thực tế."
        eyebrow="Homestay Green"
        title="Tổng quan vận hành"
      />

      <form
        aria-label="Chọn khoảng báo cáo"
        className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
        noValidate
        onSubmit={form.handleSubmit(setAppliedRange)}
      >
        <Field
          error={form.formState.errors.from?.message}
          label="Từ ngày"
          required
        >
          <Input type="date" {...form.register("from")} />
        </Field>
        <Field
          error={form.formState.errors.to?.message}
          label="Đến ngày"
          required
        >
          <Input type="date" {...form.register("to")} />
        </Field>
        <Button
          className="w-full sm:w-auto"
          loading={summaryQuery.isFetching}
          type="submit"
        >
          Áp dụng
        </Button>
      </form>

      {summaryQuery.isPending ? (
        <LoadingState label="Đang tổng hợp dữ liệu vận hành…" />
      ) : summaryQuery.isError ? (
        <ErrorState
          description={getErrorMessage(summaryQuery.error)}
          onRetry={() => void summaryQuery.refetch()}
        />
      ) : (
        <DashboardSummaryContent summary={summaryQuery.data} />
      )}
    </div>
  );
}

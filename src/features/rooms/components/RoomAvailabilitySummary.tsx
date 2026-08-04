import { Badge } from "@/shared/components/Badge";
import { formatDateOnly } from "@/shared/formatting/formatters";

import type { ManagementRoom } from "../types";

type CalendarSummary = ManagementRoom["calendarSummary"];

const TODAY_PRESENTATION = {
  AVAILABLE: { label: "Trống hôm nay", tone: "emerald" },
  BLOCKED: { label: "Đã khóa hôm nay", tone: "amber" },
  RESERVED: { label: "Đã có booking hôm nay", tone: "blue" },
} as const;

function nextEventDescription(summary: CalendarSummary) {
  const event = summary.nextEvent;

  if (!event) {
    return "Chưa có booking hoặc lịch khóa sắp tới.";
  }

  if (event.booking) {
    return `Booking gần nhất ${event.booking.bookingCode}: ${formatDateOnly(event.booking.checkInDate)}–${formatDateOnly(event.booking.checkOutDate)}.`;
  }

  const reason = event.reason?.trim();

  return `Lịch khóa gần nhất: ${formatDateOnly(event.stayDate)}${reason ? ` · ${reason}` : "."}`;
}

export function RoomAvailabilitySummary({
  summary,
}: {
  summary?: CalendarSummary;
}) {
  if (!summary) {
    return (
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">
            Lịch phòng
          </span>
          <Badge tone="amber">Chưa đồng bộ</Badge>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Chưa nhận được tình trạng lịch đặt. Hãy tải lại trang trước khi nhận
          booking mới.
        </p>
      </div>
    );
  }

  const presentation = TODAY_PRESENTATION[summary.todayStatus];

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500">
          Lịch {formatDateOnly(summary.asOfDate)}
        </span>
        <Badge tone={presentation.tone}>{presentation.label}</Badge>
      </div>
      <p className="mt-1 break-words text-xs leading-relaxed text-slate-500">
        {nextEventDescription(summary)}
      </p>
    </div>
  );
}

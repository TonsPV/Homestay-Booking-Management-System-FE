import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { getErrorMessage } from '@/api/errors'
import { Badge } from '@/shared/components/Badge'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Alert } from '@/shared/components/Feedback'
import {
  Field,
  Input,
  Textarea,
} from '@/shared/components/FormControls'

import {
  useBlockRoomDates,
  useRoomCalendar,
  useUnblockRoomDates,
} from '../hooks'
import { getRoomCalendarActionError } from '../errors'
import {
  roomBlockFormSchema,
  roomCalendarRangeFormSchema,
} from '../schemas'
import type {
  RoomBlockFormValues,
  RoomCalendarRangeFormValues,
} from '../schemas'

interface RoomCalendarManagerProps {
  bookingBasePath?: string
  roomId: string
}

type FormErrors = Partial<Record<'from' | 'reason' | 'to', string>>

function toLocalDateOnly(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function addLocalDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function initialRange(): RoomCalendarRangeFormValues {
  const today = new Date()

  return {
    from: toLocalDateOnly(today),
    to: toLocalDateOnly(addLocalDays(today, 30)),
  }
}

function issuesToErrors(
  issues: { message: string; path: PropertyKey[] }[],
): FormErrors {
  const errors: FormErrors = {}

  for (const issue of issues) {
    const field = issue.path[0]

    if (
      (field === 'from' || field === 'to' || field === 'reason') &&
      errors[field] === undefined
    ) {
      errors[field] = issue.message
    }
  }

  return errors
}

export function RoomCalendarManager({
  bookingBasePath = '/management/bookings',
  roomId,
}: RoomCalendarManagerProps) {
  const [range, setRange] = useState(initialRange)
  const [rangeDraft, setRangeDraft] = useState(initialRange)
  const [blockDraft, setBlockDraft] = useState<RoomBlockFormValues>(() => ({
    ...initialRange(),
    reason: '',
  }))
  const [rangeErrors, setRangeErrors] = useState<FormErrors>({})
  const [blockErrors, setBlockErrors] = useState<FormErrors>({})
  const [successMessage, setSuccessMessage] = useState<string>()
  const calendarQuery = useRoomCalendar(roomId, range)
  const blockMutation = useBlockRoomDates()
  const unblockMutation = useUnblockRoomDates()
  const actionError = blockMutation.error ?? unblockMutation.error

  function submitRange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = roomCalendarRangeFormSchema.safeParse(rangeDraft)

    if (!parsed.success) {
      setRangeErrors(issuesToErrors(parsed.error.issues))
      return
    }

    setRangeErrors({})
    setSuccessMessage(undefined)
    setRange(parsed.data)
  }

  async function submitBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = roomBlockFormSchema.safeParse(blockDraft)

    if (!parsed.success) {
      setBlockErrors(issuesToErrors(parsed.error.issues))
      return
    }

    setBlockErrors({})
    setSuccessMessage(undefined)

    try {
      const entries = await blockMutation.mutateAsync({
        input: parsed.data,
        roomId,
      })
      setSuccessMessage(`Đã khóa ${entries.length} đêm.`)
      setRange({ from: parsed.data.from, to: parsed.data.to })
      setRangeDraft({ from: parsed.data.from, to: parsed.data.to })
      setBlockDraft((current) => ({ ...current, reason: '' }))
    } catch {
      // The mutation error is rendered below.
    }
  }

  async function unblockVisibleRange() {
    setSuccessMessage(undefined)

    try {
      const result = await unblockMutation.mutateAsync({ range, roomId })
      setSuccessMessage(`Đã mở khóa ${result.removedCount} đêm.`)
    } catch {
      // The mutation error is rendered below.
    }
  }

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-950">
            Lịch phòng
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Ngày kết thúc không nằm trong khoảng khóa hoặc đặt phòng.
          </p>
        </div>
        <Button
          disabled={calendarQuery.isFetching}
          loading={unblockMutation.isPending}
          onClick={() => void unblockVisibleRange()}
          variant="outline"
        >
          Mở khóa khoảng đang xem
        </Button>
      </div>

      {successMessage ? (
        <Alert className="mt-5" tone="success">
          {successMessage}
        </Alert>
      ) : null}
      {actionError ? (
        <Alert className="mt-5" tone="error">
          {getRoomCalendarActionError(actionError)}
        </Alert>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="grid content-start gap-6">
          <form className="grid gap-4" onSubmit={submitRange}>
            <h3 className="font-bold text-slate-950">Khoảng đang xem</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                error={rangeErrors.from}
                label="Từ ngày"
                required
              >
                <Input
                  onChange={(event) =>
                    setRangeDraft((current) => ({
                      ...current,
                      from: event.target.value,
                    }))
                  }
                  type="date"
                  value={rangeDraft.from}
                />
              </Field>
              <Field error={rangeErrors.to} label="Đến ngày" required>
                <Input
                  onChange={(event) =>
                    setRangeDraft((current) => ({
                      ...current,
                      to: event.target.value,
                    }))
                  }
                  type="date"
                  value={rangeDraft.to}
                />
              </Field>
            </div>
            <Button className="justify-self-start" type="submit">
              Xem lịch
            </Button>
          </form>

          <form
            className="grid gap-4 border-t border-slate-100 pt-6"
            onSubmit={(event) => void submitBlock(event)}
          >
            <h3 className="font-bold text-slate-950">Khóa phòng</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                error={blockErrors.from}
                label="Từ ngày"
                required
              >
                <Input
                  onChange={(event) =>
                    setBlockDraft((current) => ({
                      ...current,
                      from: event.target.value,
                    }))
                  }
                  type="date"
                  value={blockDraft.from}
                />
              </Field>
              <Field error={blockErrors.to} label="Đến ngày" required>
                <Input
                  onChange={(event) =>
                    setBlockDraft((current) => ({
                      ...current,
                      to: event.target.value,
                    }))
                  }
                  type="date"
                  value={blockDraft.to}
                />
              </Field>
            </div>
            <Field
              error={blockErrors.reason}
              label="Lý do"
              required
            >
              <Textarea
                maxLength={500}
                onChange={(event) =>
                  setBlockDraft((current) => ({
                    ...current,
                    reason: event.target.value,
                  }))
                }
                placeholder="Ví dụ: Bảo trì máy lạnh"
                value={blockDraft.reason}
              />
            </Field>
            <Button
              className="justify-self-start"
              loading={blockMutation.isPending}
              type="submit"
            >
              Khóa ngày
            </Button>
          </form>
        </div>

        <section aria-labelledby="room-calendar-results">
          <div className="flex items-center justify-between gap-3">
            <h3
              className="font-bold text-slate-950"
              id="room-calendar-results"
            >
              Ngày không khả dụng
            </h3>
            <span className="text-sm text-slate-500">
              {range.from} đến {range.to}
            </span>
          </div>

          {calendarQuery.isPending ? (
            <p className="mt-4 text-sm text-slate-500" role="status">
              Đang tải lịch phòng...
            </p>
          ) : calendarQuery.isError ? (
            <Alert className="mt-4" tone="error">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>{getErrorMessage(calendarQuery.error)}</span>
                <Button
                  loading={calendarQuery.isFetching}
                  onClick={() => void calendarQuery.refetch()}
                  variant="outline"
                >
                  Thử lại
                </Button>
              </div>
            </Alert>
          ) : calendarQuery.data.length === 0 ? (
            <p className="mt-4 border-t border-slate-100 py-8 text-center text-sm text-slate-500">
              Phòng đang trống trong khoảng này.
            </p>
          ) : (
            <>
              <div className="mt-4 grid gap-3 sm:hidden">
                {calendarQuery.data.map((entry) => (
                  <article
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    key={entry.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Ngày
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {entry.stayDate}
                        </p>
                      </div>
                      <Badge
                        tone={entry.status === 'RESERVED' ? 'blue' : 'amber'}
                      >
                        {entry.status === 'RESERVED' ? 'Đã đặt' : 'Đã khóa'}
                      </Badge>
                    </div>
                    <div className="mt-4 border-t border-slate-200 pt-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Thông tin
                      </p>
                      {entry.booking ? (
                        <Link
                          className="mt-1 inline-flex min-h-11 items-center font-semibold text-brand-strong hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                          to={`${bookingBasePath}/${entry.booking.id}`}
                        >
                          {entry.booking.bookingCode}
                        </Link>
                      ) : (
                        <p className="mt-1 text-sm text-slate-600">
                          {entry.reason}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-4 hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[34rem] text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-3 font-bold">Ngày</th>
                      <th className="px-3 py-3 font-bold">Trạng thái</th>
                      <th className="px-3 py-3 font-bold">Thông tin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {calendarQuery.data.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-3 py-3 font-semibold text-slate-900">
                          {entry.stayDate}
                        </td>
                        <td className="px-3 py-3">
                          <Badge
                            tone={
                              entry.status === 'RESERVED' ? 'blue' : 'amber'
                            }
                          >
                            {entry.status === 'RESERVED' ? 'Đã đặt' : 'Đã khóa'}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-slate-600">
                          {entry.booking ? (
                            <Link
                              className="font-semibold text-brand-strong hover:underline"
                              to={`${bookingBasePath}/${entry.booking.id}`}
                            >
                              {entry.booking.bookingCode}
                            </Link>
                          ) : (
                            entry.reason
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </Card>
  )
}

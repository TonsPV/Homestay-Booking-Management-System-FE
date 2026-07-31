import {
  formatDateOnly,
  formatMoney,
  formatNumber,
} from '@/shared/formatting/formatters'

export function formatDashboardMoney(value: number) {
  return formatMoney(String(value))
}

export function formatDashboardPercentage(value: number) {
  return `${formatNumber(value)}%`
}

export function formatDashboardRange(from: string, to: string) {
  return `${formatDateOnly(from)} – ${formatDateOnly(to)}`
}

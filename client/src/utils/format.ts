// Display only. The API keeps amounts as exact decimal strings.
export function formatMoney(value: number | string, currency = 'BDT') {
  const n = Number(value)
  const digits = Number.isInteger(n) ? 0 : 2
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n)
}

// "2026-10-02" -> "Oct 2, 2026" (no time zone shifting)
export function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Today's date in the user's own time zone, as YYYY-MM-DD
export const todayLocal = () => new Date().toLocaleDateString('en-CA')

// 12500 -> "12.5K" (for chart axes and tight spaces)
export const formatCompact = (value: number) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value)

// Whole days from today until a YYYY-MM-DD date (negative if it has passed)
export function daysUntil(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  const [ty, tm, td] = todayLocal().split('-').map(Number)
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(ty, tm - 1, td)) / 86_400_000)
}
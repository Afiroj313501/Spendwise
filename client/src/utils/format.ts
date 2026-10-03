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
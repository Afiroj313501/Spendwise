const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function isRealDate(value: string) {
  if (!ISO_DATE.test(value)) return false
  const d = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value // rejects 2026-02-31
}

export const toDbDate = (value: string) => new Date(`${value}T00:00:00.000Z`)
export const fromDbDate = (date: Date) => date.toISOString().slice(0, 10)

// "2026-10" shifted by -1 -> "2026-09"
export function shiftMonth(month: string, by: number) {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + by, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}
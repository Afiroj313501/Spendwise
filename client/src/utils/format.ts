// Display only. The API keeps amounts as exact decimal strings.
export function formatMoney(value: number | string, currency = 'BDT') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
  }).format(Number(value))
}
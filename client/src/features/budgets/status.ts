import type { BudgetStatus } from '../../types/finance'

export const statusLabel: Record<BudgetStatus, string> = {
  ok: 'On track',
  warning: 'Near limit',
  over: 'Over budget',
}

export const statusPill: Record<BudgetStatus, string> = {
  ok: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  over: 'bg-red-50 text-red-700',
}

export const statusTone: Record<BudgetStatus, 'success' | 'warning' | 'danger'> = {
  ok: 'success',
  warning: 'warning',
  over: 'danger',
}

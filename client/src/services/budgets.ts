import { api } from './api'
import type { BudgetList } from '../types/finance'

export const getBudgets = (month: string) => api<BudgetList>(`/budgets?month=${month}`)

export const saveBudget = (input: { categoryId: string; month: string; amount: string }) =>
  api<{ id: string }>('/budgets', { method: 'PUT', body: JSON.stringify(input) })

export const deleteBudget = (id: string) => api<null>(`/budgets/${id}`, { method: 'DELETE' })

export const copyBudgets = (from: string, to: string) =>
  api<{ copied: number }>('/budgets/copy', { method: 'POST', body: JSON.stringify({ from, to }) })
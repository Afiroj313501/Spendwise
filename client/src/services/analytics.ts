import { api } from './api'
import type { Breakdown, Cashflow, Summary } from '../types/finance'

export const getSummary = (month: string) => api<Summary>(`/analytics/summary?month=${month}`)

export const getCashflow = (month: string, months = 6) =>
  api<Cashflow>(`/analytics/cashflow?month=${month}&months=${months}`)

export const getBreakdown = (month: string) => api<Breakdown>(`/analytics/breakdown?month=${month}`)
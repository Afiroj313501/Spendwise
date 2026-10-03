import { api } from './api'
import type { Summary } from '../types/finance'

export const getSummary = (month: string) => api<Summary>(`/analytics/summary?month=${month}`)
import { api } from './api'
import type { Goal, GoalInput } from '../types/finance'

export const getGoals = () => api<Goal[]>('/goals')

export const createGoal = (input: GoalInput) =>
  api<Goal>('/goals', { method: 'POST', body: JSON.stringify(input) })

export const updateGoal = (id: string, input: Partial<Omit<GoalInput, 'savedAmount'>>) =>
  api<Goal>(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify(input) })

export const goalFunds = (id: string, amount: string, action: 'add' | 'withdraw') =>
  api<Goal>(`/goals/${id}/funds`, { method: 'POST', body: JSON.stringify({ amount, action }) })

export const deleteGoal = (id: string) => api<null>(`/goals/${id}`, { method: 'DELETE' })
import { api } from './api'
import type { Category, Transaction, TransactionInput, TransactionList } from '../types/finance'

export const listCategories = () => api<Category[]>('/categories')

export const listTransactions = (query: string) => api<TransactionList>(`/transactions?${query}`)

export const createTransaction = (input: TransactionInput) =>
  api<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(input) })

export const updateTransaction = (id: string, input: Partial<TransactionInput>) =>
  api<Transaction>(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(input) })

export const deleteTransaction = (id: string) => api<null>(`/transactions/${id}`, { method: 'DELETE' })
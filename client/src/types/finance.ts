export type TxType = 'INCOME' | 'EXPENSE'

export type Category = { id: string; name: string; type: TxType }

export type Transaction = {
  id: string
  amount: string // exact decimal string, e.g. "450.50"
  type: TxType
  date: string // YYYY-MM-DD
  description: string | null
  category: Category | null
  createdAt: string
  updatedAt: string
}

export type TransactionList = {
  data: Transaction[]
  meta: { page: number; limit: number; total: number; totalPages: number }
  summary: { income: string; expense: string; net: string }
}

export type TransactionInput = {
  amount: string
  type: TxType
  date: string
  description: string | null
  categoryId: string | null
}
export type Delta = { current: string; previous: string; change: string; percent: string | null }

export type Insight =
  | { kind: 'category_up'; category: string; percent: string; amount: string }
  | { kind: 'spending_down'; percent: string }
  | { kind: 'no_data' }

export type Summary = {
  month: string
  partial: boolean
  balance: Delta
  income: Delta
  expense: Delta
  insight: Insight | null
}
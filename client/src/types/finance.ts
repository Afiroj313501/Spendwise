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
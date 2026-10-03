import { ArrowDownLeft, ArrowUpRight, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react'
import type { Transaction } from '../../types/finance'
import { formatDate, formatMoney } from '../../utils/format'

export type SortKey = 'date' | 'amount'

type Props = {
  items: Transaction[]
  currency: string
  sortBy: SortKey
  order: 'asc' | 'desc'
  onSort: (key: SortKey) => void
  onEdit: (t: Transaction) => void
  onDelete: (t: Transaction) => void
}

const th = 'px-4 py-3 text-left text-sm font-medium text-slate-500 first:rounded-l-2xl last:rounded-r-2xl'

export default function TransactionTable({ items, currency, sortBy, order, onSort, onEdit, onDelete }: Props) {
  const sortHead = (label: string, key: SortKey) => (
    <button onClick={() => onSort(key)} className="inline-flex items-center gap-1 hover:text-slate-800">
      {label}
      {sortBy === key &&
        (order === 'asc' ? <ChevronUp size={14} className="text-brand-600" /> : <ChevronDown size={14} className="text-brand-600" />)}
    </button>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px]">
        <thead>
          <tr className="bg-slate-50">
            <th className={th}>Description</th>
            <th className={th}>{sortHead('Amount', 'amount')}</th>
            <th className={th}>Category</th>
            <th className={th}>{sortHead('Date', 'date')}</th>
            <th className={th}>Type</th>
            <th className={`${th} text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((t) => {
            const income = t.type === 'INCOME'
            return (
              <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid size-10 shrink-0 place-items-center rounded-full ${
                        income ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                      }`}
                    >
                      {income ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                    </span>
                    <span className="max-w-[240px] truncate font-medium">
                      {t.description || t.category?.name || (income ? 'Income' : 'Expense')}
                    </span>
                  </div>
                </td>
                <td className={`px-4 py-4 font-semibold ${income ? 'text-green-600' : 'text-red-500'}`}>
                  {income ? '+' : '-'}
                  {formatMoney(t.amount, currency)}
                </td>
                <td className="px-4 py-4">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {t.category?.name ?? 'Uncategorized'}
                  </span>
                </td>
                <td className="px-4 py-4 text-slate-600">{formatDate(t.date)}</td>
                <td className="px-4 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      income ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                    }`}
                  >
                    {income ? 'Income' : 'Expense'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => onEdit(t)}
                      aria-label="Edit transaction"
                      className="grid size-9 place-items-center rounded-full text-slate-500 hover:bg-brand-50 hover:text-brand-600"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(t)}
                      aria-label="Delete transaction"
                      className="grid size-9 place-items-center rounded-full text-slate-500 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
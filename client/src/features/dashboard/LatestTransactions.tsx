import { ArrowDownLeft, ArrowUpRight, Receipt } from 'lucide-react'
import { Link } from 'react-router-dom'
import Card from '../../components/ui/Card'
import type { Transaction } from '../../types/finance'
import { formatDate, formatMoney } from '../../utils/format'

type Props = { items: Transaction[] | null; currency: string; monthText: string; className?: string }

const th = 'px-3 py-2.5 text-left text-sm font-medium text-slate-500 first:rounded-l-xl last:rounded-r-xl'

export default function LatestTransactions({ items, currency, monthText, className = '' }: Props) {
  return (
    <Card className={className}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-medium">Latest Transactions</h3>
          <p className="text-sm text-slate-400">{monthText}</p>
        </div>
        <Link to="/app/transactions" className="rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-100">
          View all
        </Link>
      </div>

      {items === null ? (
        <div className="mt-5 space-y-3" aria-busy="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="grid place-items-center py-12 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-brand-50 text-brand-600">
            <Receipt size={24} />
          </span>
          <p className="mt-3 font-medium">No transactions in {monthText}</p>
          <Link to="/app/transactions" className="mt-1 text-sm font-medium text-brand-600 hover:underline">
            Add one
          </Link>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[460px]">
            <thead>
              <tr className="bg-slate-50">
                <th className={th}>Payment</th>
                <th className={th}>Amount</th>
                <th className={th}>Category</th>
                <th className={th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => {
                const income = t.type === 'INCOME'
                return (
                  <tr key={t.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <span className={`grid size-9 shrink-0 place-items-center rounded-full ${income ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                          {income ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                        </span>
                        <span className="max-w-[160px] truncate font-medium">
                          {t.description || t.category?.name || (income ? 'Income' : 'Expense')}
                        </span>
                      </div>
                    </td>
                    <td className={`px-3 py-3 font-semibold ${income ? 'text-green-600' : 'text-red-500'}`}>
                      {income ? '+' : '-'}{formatMoney(t.amount, currency)}
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {t.category?.name ?? 'Uncategorized'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-600">{formatDate(t.date)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
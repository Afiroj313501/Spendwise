import { useMemo } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { TrendingUp } from 'lucide-react'
import Card from '../../components/ui/Card'
import type { Cashflow } from '../../types/finance'
import { formatCompact, formatMoney } from '../../utils/format'
import { monthLabel, monthShort } from '../../utils/months'

const INCOME = '#0a56f0'
const EXPENSE = '#09c3ff'

type TipProps = {
  active?: boolean
  label?: string | number
  payload?: readonly { name?: string | number; value?: number | string; color?: string }[]
}

function Tip({ active, payload, label, currency }: TipProps & { currency: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="min-w-40 rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-slate-100">
      <p className="mb-1.5 text-xs font-medium text-slate-400">{label}</p>
      {payload.map((p) => (
        <div key={String(p.name)} className="flex items-center gap-2 text-sm">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}</span>
          <span className="ml-auto pl-3 font-semibold">{formatMoney(Number(p.value), currency)}</span>
        </div>
      ))}
    </div>
  )
}

type Props = { data: Cashflow | null; currency: string; className?: string }

export default function CashFlowChart({ data, currency, className = '' }: Props) {
  const rows = useMemo(
    () =>
      (data?.points ?? []).map((p) => ({
        label: monthShort(p.month),
        income: Number(p.income),
        expense: Number(p.expense),
      })),
    [data],
  )

  const hasData = rows.some((r) => r.income > 0 || r.expense > 0)
  const first = data?.points[0]
  const last = data?.points[data.points.length - 1]

  return (
    <Card className={className}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-medium">Monthly Cash Flow</h3>
          {first && last && (
            <p className="text-sm text-slate-400">{monthShort(first.month)} – {monthLabel(last.month)}</p>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: INCOME }} /> Income</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: EXPENSE }} /> Expense</span>
        </div>
      </div>

      {data === null ? (
        <div className="mt-6 h-[300px] animate-pulse rounded-2xl bg-slate-100" aria-busy="true" />
      ) : !hasData ? (
        <div className="grid h-[300px] place-items-center text-center">
          <div>
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-brand-50 text-brand-600">
              <TrendingUp size={24} />
            </span>
            <p className="mt-3 font-medium">No cash flow yet</p>
            <p className="text-sm text-slate-500">Add transactions to see your trend.</p>
          </div>
        </div>
      ) : (
        <div className="mt-6 h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 6" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13 }} dy={8} />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={52}
                tick={{ fill: '#94a3b8', fontSize: 13 }}
                tickFormatter={(v: number) => formatCompact(v)}
              />
              <Tooltip
                cursor={{ stroke: INCOME, strokeDasharray: '4 4', strokeOpacity: 0.5 }}
                content={(props) => <Tip {...(props as unknown as TipProps)} currency={currency} />}
              />
              <Line type="monotone" dataKey="income" name="Income" stroke={INCOME} strokeWidth={3}
                dot={false} activeDot={{ r: 6, strokeWidth: 3, stroke: '#fff' }} />
              <Line type="monotone" dataKey="expense" name="Expense" stroke={EXPENSE} strokeWidth={3}
                dot={false} activeDot={{ r: 6, strokeWidth: 3, stroke: '#fff' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
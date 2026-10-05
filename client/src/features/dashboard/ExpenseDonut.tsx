import { useMemo } from 'react'
import { Pie, PieChart, ResponsiveContainer } from 'recharts'
import Card from '../../components/ui/Card'
import type { Breakdown } from '../../types/finance'
import { formatCompact, formatMoney } from '../../utils/format'
import { monthLabel } from '../../utils/month'

const COLORS = ['#0a56f0', '#09c3ff', '#6b9cff', '#8fe3ff']
const OTHER = '#cbd5e1'

type Props = { data: Breakdown | null; month: string; currency: string; className?: string }

export default function ExpenseDonut({ data, month, currency, className = '' }: Props) {
  const slices = useMemo(
    () =>
      (data?.items ?? []).map((item, i) => ({
        ...item,
        value: Number(item.amount),
        fill: item.name === 'Other' ? OTHER : COLORS[i % COLORS.length],
      })),
    [data],
  )

  return (
    <Card className={className}>
      <h3 className="text-xl font-medium">Expense Breakdown</h3>
      <p className="text-sm text-slate-400">{monthLabel(month)}</p>

      {data === null ? (
        <div className="mt-6 space-y-5" aria-busy="true">
          <div className="mx-auto size-56 animate-pulse rounded-full bg-slate-100" />
          <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      ) : slices.length === 0 ? (
        <div className="mt-6 grid place-items-center text-center">
          <div className="grid size-56 place-items-center rounded-full border-[28px] border-slate-100">
            <span className="px-4 text-sm text-slate-500">No expenses this month</span>
          </div>
        </div>
      ) : (
        <>
          <div className="relative mx-auto mt-6 size-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="68%"
                  outerRadius="100%"
                  paddingAngle={slices.length > 1 ? 3 : 0}
                  cornerRadius={8}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="text-3xl font-semibold tracking-tight">{formatCompact(Number(data.total))}</p>
                <p className="text-xs text-slate-400">Total spent</p>
              </div>
            </div>
          </div>

          <ul className="mt-6 space-y-3">
            {slices.map((s) => (
              <li key={s.name} className="flex items-center gap-3 text-sm">
                <span className="size-3 shrink-0 rounded-full" style={{ background: s.fill }} />
                <span className="truncate font-medium">{s.name}</span>
                <span className="ml-auto text-slate-500">{formatMoney(s.amount, currency)}</span>
                <span className="w-12 text-right font-medium">{Number(s.percent).toFixed(0)}%</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  )
}
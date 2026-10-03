import type { ReactNode } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Card from './Card'

type Props = {
  title: string
  value: string
  icon: LucideIcon
  percent: string | null
  good: boolean
  note: ReactNode
}

export default function StatCard({ title, value, icon: Icon, percent, good, note }: Props) {
  const n = percent === null ? null : Number(percent)
  const Arrow = n !== null && n < 0 ? TrendingDown : TrendingUp
  const tone =
    n === null || n === 0
      ? 'bg-slate-100 text-slate-500'
      : good
        ? 'bg-green-50 text-green-600'
        : 'bg-red-50 text-red-500'

  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-full bg-slate-900 text-white">
          <Icon size={20} />
        </span>
        <h3 className="text-lg text-slate-700">{title}</h3>
      </div>

      <div className="mt-6 flex items-end justify-between gap-2">
        <p className="text-4xl font-semibold tracking-tight">{value}</p>
        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${tone}`}>
          {n !== null && <Arrow size={14} />}
          {n === null ? 'New' : `${Math.abs(n).toFixed(1)}%`}
        </span>
      </div>

      <p className="mt-6 text-sm text-slate-500">{note}</p>
    </Card>
  )
}
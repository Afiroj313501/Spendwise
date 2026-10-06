import { Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import Card from '../../components/ui/Card'
import ProgressBar from '../../components/ui/ProgressBar'
import type { Goal } from '../../types/finance'
import { formatMoney } from '../../utils/format'

type Props = { goals: Goal[] | null; currency: string; className?: string }

export default function SavingsGoalsCard({ goals, currency, className = '' }: Props) {
  // Unfinished goals first, then at most three
  const shown = [...(goals ?? [])].sort((a, b) => Number(a.completed) - Number(b.completed)).slice(0, 3)

  return (
    <Card className={className}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-medium">Savings Goals</h3>
        <Link to="/app/goals" className="rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-100">
          View all
        </Link>
      </div>

      {goals === null ? (
        <div className="mt-5 space-y-4" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div className="grid place-items-center py-10 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-brand-50 text-brand-600"><Target size={24} /></span>
          <p className="mt-3 font-medium">No goals yet</p>
          <Link to="/app/goals" className="mt-1 text-sm font-medium text-brand-600 hover:underline">Create your first goal</Link>
        </div>
      ) : (
        <ul className="mt-5 space-y-5">
          {shown.map((g) => (
            <li key={g.id}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium">{g.name}</span>
                <span className="shrink-0 text-slate-500">
                  {formatMoney(g.savedAmount, currency)} / {formatMoney(g.targetAmount, currency)}
                </span>
              </div>
              <ProgressBar className="mt-2" percent={Number(g.percent)} tone={g.completed ? 'success' : 'brand'} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
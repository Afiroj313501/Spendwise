import type { Budget } from '../../types/finance'
import Card from '../../components/ui/Card'
import { formatMoney } from '../../utils/format'

type Props = { budgets: Budget[] | null }

export default function BudgetAlerts({ budgets }: Props) {
  if (!budgets) return null

  const alerts = budgets.filter((budget) => budget.status === 'warning' || budget.status === 'over')
  if (alerts.length === 0) return null

  return (
    <Card className="mb-6 border border-amber-100 bg-amber-50/60">
      <h2 className="font-semibold text-slate-800">Budget alerts</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {alerts.map((budget) => (
          <div key={budget.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-700">{budget.category.name}</span>
            <span className={budget.status === 'over' ? 'font-medium text-red-600' : 'font-medium text-amber-700'}>
              {budget.status === 'over'
                ? `${formatMoney(Math.abs(Number(budget.remaining)))} over`
                : `${formatMoney(Number(budget.remaining))} left`}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

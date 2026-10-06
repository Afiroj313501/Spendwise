import { useEffect, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react'
import InsightCard from '../components/ui/InsightCard'
import StatCard from '../components/ui/StatCard'
import { useAuth } from '../features/auth/AuthContext'
import BudgetAlerts from '../features/dashboard/BudgetAlerts'
import CashFlowChart from '../features/dashboard/CashFlowChart'
import ExpenseDonut from '../features/dashboard/ExpenseDonut'
import LatestTransactions from '../features/dashboard/LatestTransactions'
import MonthPicker from '../features/dashboard/MonthPicker'
import SavingsGoalsCard from '../features/dashboard/SavingsGoalsCard'
import { insightContent } from '../features/dashboard/insights'
import { getBreakdown, getCashflow, getSummary } from '../services/analytics'
import { getBudgets } from '../services/budgets'
import { listTransactions } from '../services/finance'
import { getGoals } from '../services/goals'
import type { Breakdown, BudgetList, Cashflow, Delta, Goal, Summary, Transaction } from '../types/finance'
import { errorMessage } from '../utils/error'
import { formatMoney } from '../utils/format'
import { currentMonth, monthLabel, monthRange } from '../utils/months'

function SkeletonCard({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-card bg-white/80 shadow-soft ${className}`} />
}

// Whether an increase is good (income, balance) or bad (expenses)
const isGood = (d: Delta, upIsGood: boolean) => (Number(d.percent ?? 0) >= 0) === upIsGood

function ChangeNote({
  delta, upIsGood, basis, money,
}: { delta: Delta; upIsGood: boolean; basis: string; money: (v: number | string) => string }) {
  const change = Number(delta.change)
  if (change === 0) return <>No change {basis}.</>
  const up = change > 0
  const good = up === upIsGood
  return (
    <>
      {up ? 'Increased' : 'Decreased'}{' '}
      <span className={`font-medium ${good ? 'text-green-600' : 'text-red-500'}`}>
        {up ? '+' : '-'}{money(Math.abs(change))}
      </span>{' '}
      {basis}.
    </>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const currency = user?.currency ?? 'BDT'
  const money = (v: number | string) => formatMoney(v, currency)

  const [month, setMonth] = useState(currentMonth)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [latest, setLatest] = useState<Transaction[] | null>(null)
  const [cashflow, setCashflow] = useState<Cashflow | null>(null)
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null)
  const [budgets, setBudgets] = useState<BudgetList | null>(null)
  const [goals, setGoals] = useState<Goal[] | null>(null)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let ignore = false // drops responses from an outdated month
    setError('')
    const { from, to } = monthRange(month)
    const q = new URLSearchParams({ limit: '6', sortBy: 'date', order: 'desc', from, to })

    Promise.all([
      getSummary(month),
      listTransactions(q.toString()),
      getCashflow(month),
      getBreakdown(month),
      getBudgets(month),
      getGoals(),
    ])
      .then(([s, t, c, b, bud, g]) => {
        if (ignore) return
        setSummary(s)
        setLatest(t.data)
        setCashflow(c)
        setBreakdown(b)
        setBudgets(bud)
        setGoals(g)
      })
      .catch((err) => {
        if (!ignore) setError(errorMessage(err))
      })
    return () => {
      ignore = true
    }
  }, [month, reloadKey])

  const stale = summary !== null && summary.month !== month
  const insight = insightContent(summary?.insight ?? null, money)
  const monthBasis = summary?.partial ? 'vs. the same days last month' : 'from last month'

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard Overview</h1>
          <p className="mt-1 text-lg text-slate-500">Your financial health at a glance, with smart insights and trends.</p>
        </div>
        <MonthPicker month={month} onChange={setMonth} />
      </div>

      {error && (
        <div role="alert" className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-red-50 px-5 py-3 text-red-600">
          <span>{error}</span>
          <button onClick={() => setReloadKey((k) => k + 1)} className="rounded-full bg-white px-4 py-1.5 text-sm font-medium shadow-soft">
            Retry
          </button>
        </div>
      )}

      <BudgetAlerts budgets={stale ? null : (budgets?.budgets ?? null)} />

      <div className={`grid gap-6 transition-opacity xl:grid-cols-2 ${stale ? 'opacity-60' : ''}`}>
        {/* Left column */}
        <div className="grid content-start gap-6 sm:grid-cols-2">
          {summary ? (
            <>
              <StatCard
                title="Total Balance"
                value={money(summary.balance.current)}
                icon={Wallet}
                percent={summary.balance.percent}
                good={isGood(summary.balance, true)}
                note={<ChangeNote delta={summary.balance} upIsGood basis="from last month" money={money} />}
              />
              <StatCard
                title="Monthly Income"
                value={money(summary.income.current)}
                icon={ArrowDownLeft}
                percent={summary.income.percent}
                good={isGood(summary.income, true)}
                note={<ChangeNote delta={summary.income} upIsGood basis={monthBasis} money={money} />}
              />
            </>
          ) : (
            <>
              <SkeletonCard className="h-[208px]" />
              <SkeletonCard className="h-[208px]" />
            </>
          )}
          <CashFlowChart data={stale ? null : cashflow} currency={currency} className="sm:col-span-2" />
          <SavingsGoalsCard goals={goals} currency={currency} className="min-h-[300px] sm:col-span-2" />
        </div>

        {/* Right column */}
        <div className="grid content-start gap-6 sm:grid-cols-2">
          {summary ? (
            <StatCard
              title="Monthly Expense"
              value={money(summary.expense.current)}
              icon={ArrowUpRight}
              percent={summary.expense.percent}
              good={isGood(summary.expense, false)}
              note={<ChangeNote delta={summary.expense} upIsGood={false} basis={monthBasis} money={money} />}
            />
          ) : (
            <SkeletonCard className="h-[208px]" />
          )}
          <ExpenseDonut
            data={stale ? null : breakdown}
            month={month}
            currency={currency}
            className="min-h-[420px] sm:row-span-2"
          />
          {summary ? (
            <InsightCard message={insight.message} action={insight.action} to={insight.to} />
          ) : (
            <SkeletonCard className="min-h-[300px]" />
          )}
          <LatestTransactions
            items={stale ? null : latest}
            currency={currency}
            monthText={monthLabel(month)}
            className="min-h-[480px] sm:col-span-2"
          />
        </div>
      </div>
    </div>
  )
}
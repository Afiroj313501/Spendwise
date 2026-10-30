import { useEffect, useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, BarChart3, CalendarDays, Download, FileText, Receipt, TrendingUp, Wallet } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Card from '../components/ui/Card'
import MonthPicker from '../features/dashboard/MonthPicker'
import { useAuth } from '../features/auth/AuthContext'
import { getReport } from '../services/analytics'
import type { Delta, MonthlyReport } from '../types/finance'
import { errorMessage } from '../utils/error'
import { formatDate, formatMoney } from '../utils/format'
import { currentMonth, monthLabel } from '../utils/months'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const COLORS = ['#0a56f0', '#09c3ff', '#6b9cff', '#8fe3ff', '#b9eefd']

function csvCell(value: string | number | null) {
  const text = String(value ?? '')
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text
  return `"${safe.replaceAll('"', '""')}"`
}

function downloadReportCsv(report: MonthlyReport, currency: string) {
  const rows: (string | number | null)[][] = [
    ['SpendWise analytics report', monthLabel(report.month)],
    ['Currency', currency],
    [],
    ['Summary', 'Current', 'Previous', 'Change', 'Change %'],
    ['Income', report.income.current, report.income.previous, report.income.change, report.income.percent],
    ['Expenses', report.expense.current, report.expense.previous, report.expense.change, report.expense.percent],
    ['Net savings', report.net.current, report.net.previous, report.net.change, report.net.percent],
    ['Savings rate', report.savingsRate.current, report.savingsRate.previous, null, null],
    [],
    ['Category', 'Amount', 'Share %', 'Previous', 'Change %'],
    ...report.categories.map((item) => [item.name, item.amount, item.share, item.previous, item.changePercent]),
    [],
    ['Weekday', 'Expense total'],
    ...report.weekdays.map((item) => [WEEKDAYS[item.day], item.total]),
    [],
    ['Largest expenses', 'Category', 'Amount', 'Date'],
    ...report.topExpenses.map((item) => [item.description || 'Expense', item.category, item.amount, item.date]),
  ]
  const csv = rows.map((row) => row.map((cell) => csvCell(cell)).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `spendwise-analytics-${report.month}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function LoadingCard({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-card bg-white/80 shadow-soft ${className}`} aria-busy="true" />
}

function Comparison({ delta, inverse = false }: { delta: Delta; inverse?: boolean }) {
  const change = Number(delta.change)
  if (change === 0) return <span className="text-sm text-slate-400">No change from last period</span>
  const positive = inverse ? change < 0 : change > 0
  return (
    <span className={`text-sm font-medium ${positive ? 'text-green-600' : 'text-red-500'}`}>
      {change > 0 ? '+' : ''}{Number(delta.percent ?? 0).toFixed(1)}% from last period
    </span>
  )
}

function Metric({ title, value, icon: Icon, delta, inverse = false }: {
  title: string
  value: string
  icon: typeof Wallet
  delta: Delta
  inverse?: boolean
}) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-full bg-slate-900 text-white"><Icon size={20} /></span>
        <h2 className="text-lg text-slate-700">{title}</h2>
      </div>
      <p className="mt-6 text-3xl font-semibold tracking-tight">{value}</p>
      <div className="mt-3"><Comparison delta={delta} inverse={inverse} /></div>
    </Card>
  )
}

function TooltipContent({ active, payload, currency }: {
  active?: boolean
  payload?: readonly { value?: unknown; payload?: { name?: unknown } }[]
  currency: string
}) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="rounded-2xl bg-white px-4 py-3 text-sm shadow-xl ring-1 ring-slate-100">
      <p className="font-medium">{String(item.payload?.name ?? '')}</p>
      <p className="mt-1 text-slate-500">{formatMoney(Number(item.value ?? 0), currency)}</p>
    </div>
  )
}

export default function Analytics() {
  useDocumentTitle('Analytics')
  const { user } = useAuth()
  const currency = user?.currency ?? 'BDT'
  const [month, setMonth] = useState(currentMonth)
  const [report, setReport] = useState<MonthlyReport | null>(null)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let ignore = false
    getReport(month)
      .then((result) => {
        if (!ignore) {
          setReport(result)
          setError('')
        }
      })
      .catch((err) => {
        if (!ignore) setError(errorMessage(err))
      })
    return () => { ignore = true }
  }, [month, reloadKey])

  const categories = useMemo(
    () => (report?.categories ?? []).slice(0, 8).map((item) => ({ ...item, amountValue: Number(item.amount) })),
    [report],
  )
  const weekdays = useMemo(
    () => (report?.weekdays ?? []).map((item) => ({ ...item, name: WEEKDAYS[item.day], amount: Number(item.total) })),
    [report],
  )

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
          <p className="mt-1 text-lg text-slate-500">Understand your spending patterns and make better decisions.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
          {report && (
            <>
              <button
                type="button"
                onClick={() => downloadReportCsv(report, currency)}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-soft transition hover:bg-brand-50 hover:text-brand-700"
              >
                <Download size={17} /> CSV
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-soft transition hover:bg-slate-700"
              >
                <FileText size={17} /> PDF
              </button>
            </>
          )}
          <MonthPicker month={month} onChange={(next) => { setError(''); setReport(null); setMonth(next) }} />
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-red-50 px-5 py-3 text-red-600 print:hidden">
          <span>{error}</span>
          <button onClick={() => { setError(''); setReport(null); setReloadKey((key) => key + 1) }} className="rounded-full bg-white px-4 py-1.5 text-sm font-medium shadow-soft">Retry</button>
        </div>
      )}

      {!report ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <LoadingCard className="h-48" /><LoadingCard className="h-48" /><LoadingCard className="h-48" /><LoadingCard className="h-48" />
          <LoadingCard className="h-[420px] sm:col-span-2" /><LoadingCard className="h-[420px] sm:col-span-2" />
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <Metric title="Income" value={formatMoney(report.income.current, currency)} icon={ArrowDownLeft} delta={report.income} />
            <Metric title="Expenses" value={formatMoney(report.expense.current, currency)} icon={ArrowUpRight} delta={report.expense} inverse />
            <Metric title="Net savings" value={formatMoney(report.net.current, currency)} icon={Wallet} delta={report.net} />
            <Card>
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-full bg-slate-900 text-white"><TrendingUp size={20} /></span>
                <h2 className="text-lg text-slate-700">Savings rate</h2>
              </div>
              <p className="mt-6 text-3xl font-semibold tracking-tight">{report.savingsRate.current === null ? '—' : `${report.savingsRate.current}%`}</p>
              <p className="mt-3 text-sm text-slate-400">{report.savingsRate.previous === null ? 'No previous data' : `${report.savingsRate.previous}% last period`}</p>
            </Card>
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="text-xl font-medium">Spending by category</h2><p className="text-sm text-slate-400">{monthLabel(month)}</p></div>
                <BarChart3 className="text-brand-600" />
              </div>
              {categories.length === 0 ? <EmptyState text="No categorized expenses this month." /> : (
                <div className="mt-6 h-[330px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categories} layout="vertical" margin={{ left: 8, right: 12 }}>
                      <CartesianGrid horizontal={false} stroke="#e2e8f0" strokeDasharray="4 6" />
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" width={90} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} content={(props) => <TooltipContent {...props} currency={currency} />} />
                      <Bar dataKey="amountValue" name="Amount" radius={[0, 8, 8, 0]} barSize={24}>
                        {categories.map((item, index) => <Cell key={item.name} fill={COLORS[index % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card>
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="text-xl font-medium">Spending by weekday</h2><p className="text-sm text-slate-400">Total expenses by day</p></div>
                <CalendarDays className="text-brand-600" />
              </div>
              {weekdays.every((item) => item.amount === 0) ? <EmptyState text="No expenses recorded this month." /> : (
                <div className="mt-6 h-[330px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weekdays} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 6" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} width={48} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} content={(props) => <TooltipContent {...props} currency={currency} />} />
                      <Bar dataKey="amount" name="Amount" fill="#0a56f0" radius={[8, 8, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="text-xl font-medium">Category details</h2>
              <p className="text-sm text-slate-400">Compared with the previous period</p>
              {categories.length === 0 ? <EmptyState text="Category trends will appear after you add expenses." /> : (
                <ul className="mt-5 divide-y divide-slate-100">
                  {report.categories.map((item) => (
                    <li key={item.name} className="flex items-center gap-3 py-3 text-sm">
                      <span className="size-2.5 rounded-full bg-brand-500" />
                      <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
                      <span className="text-slate-500">{formatMoney(item.amount, currency)}</span>
                      <span className={`w-16 text-right ${item.changePercent !== null && Number(item.changePercent) > 0 ? 'text-red-500' : 'text-green-600'}`}>
                        {item.changePercent === null ? 'New' : `${Number(item.changePercent) > 0 ? '+' : ''}${item.changePercent}%`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="text-xl font-medium">Largest expenses</h2><p className="text-sm text-slate-400">Your top transactions in {monthLabel(month)}</p></div>
                <Receipt className="text-brand-600" />
              </div>
              {report.topExpenses.length === 0 ? <EmptyState text="No expenses recorded this month." /> : (
                <ul className="mt-5 divide-y divide-slate-100">
                  {report.topExpenses.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 py-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500"><Receipt size={16} /></span>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.description || item.category || 'Expense'}</p><p className="text-xs text-slate-400">{formatDate(item.date)}</p></div>
                      <span className="font-semibold">{formatMoney(item.amount, currency)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <p className="mt-6 text-center text-sm text-slate-400">
            {report.partial ? `Showing the first ${report.daysCounted} days of ${monthLabel(month)}.` : `${report.transactionCount} transaction${report.transactionCount === 1 ? '' : 's'} in ${monthLabel(month)}. Daily average: ${formatMoney(report.dailyAverage, currency)}.`}
          </p>
        </>
      )}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="grid min-h-64 place-items-center text-center text-sm text-slate-500">{text}</div>
}

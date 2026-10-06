import { useEffect, useState } from 'react'
import { Copy, Pencil, Plus, Trash2, Wallet } from 'lucide-react'
import Card from '../components/ui/Card'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ProgressBar from '../components/ui/ProgressBar'
import { primaryButton } from '../components/ui/styles'
import { useAuth } from '../features/auth/AuthContext'
import BudgetFormModal from '../features/budgets/BudgetFormModal'
import { statusLabel, statusPill, statusTone } from '../features/budgets/status'
import MonthPicker from '../features/dashboard/MonthPicker'
import { copyBudgets, deleteBudget, getBudgets } from '../services/budgets'
import { listCategories } from '../services/finance'
import type { Budget, BudgetList, Category } from '../types/finance'
import { errorMessage } from '../utils/error'
import { formatMoney } from '../utils/format'
import { currentMonth, monthLabel, shiftMonth } from '../utils/months'

export default function Budgets() {
  const { user } = useAuth()
  const currency = user?.currency ?? 'BDT'
  const money = (v: number | string) => formatMoney(v, currency)

  const [month, setMonth] = useState(currentMonth)
  const [data, setData] = useState<BudgetList | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Budget | null>(null)
  const [deleting, setDeleting] = useState<Budget | null>(null)
  const [busy, setBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [copying, setCopying] = useState(false)

  useEffect(() => {
    listCategories().then(setCategories).catch(() => undefined)
  }, [])

  useEffect(() => {
    let ignore = false
    setError('')
    getBudgets(month)
      .then((d) => {
        if (!ignore) setData(d)
      })
      .catch((err) => {
        if (!ignore) setError(errorMessage(err))
      })
    return () => {
      ignore = true
    }
  }, [month, reloadKey])

  const reload = () => setReloadKey((k) => k + 1)
  const stale = data !== null && data.month !== month
  const budgets = data?.budgets ?? []
  const budgeted = new Set(budgets.map((b) => b.category.id))
  const available = categories.filter((c) => c.type === 'EXPENSE' && !budgeted.has(c.id))
  const over = budgets.filter((b) => b.status === 'over')
  const near = budgets.filter((b) => b.status === 'warning')
  const prevMonth = shiftMonth(month, -1)

  function changeMonth(next: string) {
    setNotice('')
    setMonth(next)
  }

  async function handleCopy() {
    setCopying(true)
    setNotice('')
    setError('')
    try {
      const { copied } = await copyBudgets(prevMonth, month)
      setNotice(
        copied > 0
          ? `Copied ${copied} ${copied === 1 ? 'budget' : 'budgets'} from ${monthLabel(prevMonth)}.`
          : `Nothing to copy from ${monthLabel(prevMonth)}.`,
      )
      reload()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setCopying(false)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    setBusy(true)
    setDeleteError('')
    try {
      await deleteBudget(deleting.id)
      setDeleting(null)
      reload()
    } catch (err) {
      setDeleteError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Budgets</h1>
          <p className="mt-1 text-lg text-slate-500">Set monthly limits and see how you are doing.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <MonthPicker month={month} onChange={changeMonth} allowFuture />
          <button
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
            className={primaryButton}
          >
            <Plus size={18} /> Set budget
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-red-50 px-5 py-3 text-red-600">
          <span>{error}</span>
          <button onClick={reload} className="rounded-full bg-white px-4 py-1.5 text-sm font-medium shadow-soft">Retry</button>
        </div>
      )}
      {notice && <p className="mb-6 rounded-2xl bg-brand-50 px-5 py-3 text-brand-700">{notice}</p>}

      {(over.length > 0 || near.length > 0) && (
        <div className="mb-6 rounded-2xl bg-amber-50 px-5 py-4 text-amber-800">
          {over.length > 0 && (
            <p><span className="font-semibold">Over budget:</span> {over.map((b) => b.category.name).join(', ')}</p>
          )}
          {near.length > 0 && (
            <p><span className="font-semibold">Close to the limit:</span> {near.map((b) => b.category.name).join(', ')}</p>
          )}
        </div>
      )}

      {data === null && !error ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-card bg-white/80 shadow-soft" />
          ))}
        </div>
      ) : data && budgets.length === 0 ? (
        <Card className="grid place-items-center py-14 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-brand-50 text-brand-600"><Wallet size={28} /></span>
          <h3 className="mt-4 text-xl font-semibold">No budgets for {monthLabel(month)}</h3>
          <p className="mt-1 max-w-sm text-slate-500">Set a limit per category, or copy last month's budgets to start quickly.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button onClick={handleCopy} disabled={copying}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-medium shadow-soft ring-1 ring-slate-200 disabled:opacity-60">
              <Copy size={16} /> {copying ? 'Copying...' : `Copy from ${monthLabel(prevMonth)}`}
            </button>
            <button onClick={() => setFormOpen(true)} className={primaryButton}>Set budget</button>
          </div>
        </Card>
      ) : data ? (
        <div className={`transition-opacity ${stale ? 'opacity-60' : ''}`}>
          <Card>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">Total spent of total budget</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight">
                  {money(data.totals.spent)} <span className="text-lg font-normal text-slate-400">of {money(data.totals.budget)}</span>
                </p>
              </div>
              <p className={`text-sm font-medium ${Number(data.totals.remaining) < 0 ? 'text-red-500' : 'text-green-600'}`}>
                {Number(data.totals.remaining) < 0
                  ? `${money(Math.abs(Number(data.totals.remaining)))} over in total`
                  : `${money(data.totals.remaining)} left in total`}
              </p>
            </div>
            <ProgressBar
              className="mt-4"
              percent={Number(data.totals.percent)}
              tone={Number(data.totals.percent) > 100 ? 'danger' : Number(data.totals.percent) >= 80 ? 'warning' : 'brand'}
            />
          </Card>

          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {budgets.map((b) => {
              const remaining = Number(b.remaining)
              return (
                <Card key={b.id} className="!p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{b.category.name}</h3>
                      <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-medium ${statusPill[b.status]}`}>
                        {statusLabel[b.status]}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(b); setFormOpen(true) }} aria-label="Edit budget"
                        className="grid size-9 place-items-center rounded-full text-slate-500 hover:bg-brand-50 hover:text-brand-600">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => { setDeleteError(''); setDeleting(b) }} aria-label="Delete budget"
                        className="grid size-9 place-items-center rounded-full text-slate-500 hover:bg-red-50 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-2">
                    <p className="text-2xl font-semibold">{money(b.spent)}</p>
                    <p className="text-sm text-slate-500">of {money(b.amount)}</p>
                  </div>
                  <ProgressBar className="mt-3" percent={Number(b.percent)} tone={statusTone[b.status]} />
                  <p className="mt-3 text-sm text-slate-500">
                    {remaining >= 0 ? `${money(remaining)} left` : `${money(Math.abs(remaining))} over`} · {Number(b.percent).toFixed(0)}% used
                  </p>
                </Card>
              )
            })}
          </div>

          {available.length > 0 && (
            <button onClick={handleCopy} disabled={copying}
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:underline disabled:opacity-60">
              <Copy size={14} /> {copying ? 'Copying...' : `Add missing budgets from ${monthLabel(prevMonth)}`}
            </button>
          )}
        </div>
      ) : null}

      {formOpen && (
        <BudgetFormModal
          month={month}
          categories={available}
          initial={editing}
          currency={currency}
          onClose={() => {
            setFormOpen(false)
            setEditing(null)
          }}
          onSaved={() => {
            setFormOpen(false)
            setEditing(null)
            setNotice('')
            reload()
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete budget"
          message={<>Delete the <span className="font-medium text-slate-900">{deleting.category.name}</span> budget for {monthLabel(month)}? Your transactions are not affected.</>}
          busy={busy}
          error={deleteError}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
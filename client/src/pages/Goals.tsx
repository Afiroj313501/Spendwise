import { useEffect, useState } from 'react'
import { Minus, Pencil, Plus, Target, Trash2 } from 'lucide-react'
import Card from '../components/ui/Card'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ProgressBar from '../components/ui/ProgressBar'
import { primaryButton } from '../components/ui/styles'
import { useAuth } from '../features/auth/AuthContext'
import FundsModal from '../features/goals/FundsModal'
import GoalFormModal from '../features/goals/GoalFormModal'
import { deleteGoal, getGoals } from '../services/goals'
import type { Goal } from '../types/finance'
import { errorMessage } from '../utils/error'
import { daysUntil, formatDate, formatMoney } from '../utils/format'

function deadlineText(goal: Goal) {
  if (!goal.deadline || goal.completed) return null
  const days = daysUntil(goal.deadline)
  const when = formatDate(goal.deadline)
  if (days < 0) return { text: `Was due ${when} (${Math.abs(days)} days ago)`, late: true }
  if (days === 0) return { text: `Due today (${when})`, late: false }
  return { text: `Due ${when} · ${days} ${days === 1 ? 'day' : 'days'} left`, late: false }
}

export default function Goals() {
  const { user } = useAuth()
  const currency = user?.currency ?? 'BDT'
  const money = (v: number | string) => formatMoney(v, currency)

  const [goals, setGoals] = useState<Goal[] | null>(null)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [funds, setFunds] = useState<{ goal: Goal; action: 'add' | 'withdraw' } | null>(null)
  const [deleting, setDeleting] = useState<Goal | null>(null)
  const [busy, setBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    let ignore = false
    setError('')
    getGoals()
      .then((g) => {
        if (!ignore) setGoals(g)
      })
      .catch((err) => {
        if (!ignore) setError(errorMessage(err))
      })
    return () => {
      ignore = true
    }
  }, [reloadKey])

  const reload = () => setReloadKey((k) => k + 1)

  async function confirmDelete() {
    if (!deleting) return
    setBusy(true)
    setDeleteError('')
    try {
      await deleteGoal(deleting.id)
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
          <h1 className="text-3xl font-semibold tracking-tight">Goals &amp; Savings</h1>
          <p className="mt-1 text-lg text-slate-500">Save towards what matters and watch your progress.</p>
        </div>
        <button
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
          className={primaryButton}
        >
          <Plus size={18} /> New goal
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-red-50 px-5 py-3 text-red-600">
          <span>{error}</span>
          <button onClick={reload} className="rounded-full bg-white px-4 py-1.5 text-sm font-medium shadow-soft">Retry</button>
        </div>
      )}

      {goals === null && !error ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-card bg-white/80 shadow-soft" />
          ))}
        </div>
      ) : goals && goals.length === 0 ? (
        <Card className="grid place-items-center py-14 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-brand-50 text-brand-600"><Target size={28} /></span>
          <h3 className="mt-4 text-xl font-semibold">No savings goals yet</h3>
          <p className="mt-1 max-w-sm text-slate-500">Create a goal like an emergency fund or a new laptop, then add money as you save.</p>
          <button onClick={() => setFormOpen(true)} className={`${primaryButton} mt-5`}>Create your first goal</button>
        </Card>
      ) : goals ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((g) => {
            const due = deadlineText(g)
            return (
              <Card key={g.id} className="!p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold">{g.name}</h3>
                    <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-medium ${
                      g.completed ? 'bg-green-50 text-green-600' : 'bg-brand-50 text-brand-600'
                    }`}>
                      {g.completed ? 'Goal reached' : 'In progress'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(g); setFormOpen(true) }} aria-label="Edit goal"
                      className="grid size-9 place-items-center rounded-full text-slate-500 hover:bg-brand-50 hover:text-brand-600">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => { setDeleteError(''); setDeleting(g) }} aria-label="Delete goal"
                      className="grid size-9 place-items-center rounded-full text-slate-500 hover:bg-red-50 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-end justify-between gap-2">
                  <p className="text-2xl font-semibold">{money(g.savedAmount)}</p>
                  <p className="text-sm text-slate-500">of {money(g.targetAmount)}</p>
                </div>
                <ProgressBar className="mt-3" percent={Number(g.percent)} tone={g.completed ? 'success' : 'brand'} />
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-600">{Math.min(100, Number(g.percent)).toFixed(0)}% saved</span>
                  {due && <span className={due.late ? 'text-red-500' : 'text-slate-500'}>{due.text}</span>}
                </div>

                <div className="mt-5 flex gap-2">
                  <button onClick={() => setFunds({ goal: g, action: 'add' })}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-brand-600 to-brand-500 py-2.5 text-sm font-medium text-white">
                    <Plus size={16} /> Add funds
                  </button>
                  <button onClick={() => setFunds({ goal: g, action: 'withdraw' })} disabled={Number(g.savedAmount) <= 0}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-slate-100 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50">
                    <Minus size={16} /> Withdraw
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      ) : null}

      {formOpen && (
        <GoalFormModal
          initial={editing}
          currency={currency}
          onClose={() => {
            setFormOpen(false)
            setEditing(null)
          }}
          onSaved={() => {
            setFormOpen(false)
            setEditing(null)
            reload()
          }}
        />
      )}

      {funds && (
        <FundsModal
          goal={funds.goal}
          action={funds.action}
          currency={currency}
          onClose={() => setFunds(null)}
          onSaved={() => {
            setFunds(null)
            reload()
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete goal"
          message={<>Delete <span className="font-medium text-slate-900">{deleting.name}</span>? Its saved progress will be lost.</>}
          busy={busy}
          error={deleteError}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
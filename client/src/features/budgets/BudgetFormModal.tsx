import { useState } from 'react'
import type { FormEvent } from 'react'
import Modal from '../../components/ui/Modal'
import { control, primaryButton } from '../../components/ui/styles'
import { saveBudget } from '../../services/budgets'
import type { Budget, Category } from '../../types/finance'
import { errorMessage } from '../../utils/error'
import { monthLabel } from '../../utils/months'

type Props = {
  month: string
  categories: Category[] // categories that don't have a budget yet (for new budgets)
  initial: Budget | null
  currency: string
  onClose: () => void
  onSaved: () => void
}

export default function BudgetFormModal({ month, categories, initial, currency, onClose, onSaved }: Props) {
  const [categoryId, setCategoryId] = useState(initial?.category.id ?? categories[0]?.id ?? '')
  const [amount, setAmount] = useState(initial?.amount ?? '')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!initial && categories.length === 0) {
    return (
      <Modal title="Set budget" onClose={onClose}>
        <p className="text-slate-600">Every expense category already has a budget for {monthLabel(month)}.</p>
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className={primaryButton}>Close</button>
        </div>
      </Modal>
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    const value = amount.trim()
    if (!/^\d{1,10}(\.\d{1,2})?$/.test(value) || Number(value) <= 0) {
      setError('Enter a valid amount greater than zero, with up to 2 decimal places')
      return
    }

    setSubmitting(true)
    try {
      await saveBudget({ categoryId, month, amount: value })
      onSaved()
    } catch (err) {
      setError(errorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <Modal title={initial ? 'Edit budget' : 'Set budget'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-500">For {monthLabel(month)}</p>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-600">Category</span>
          {initial ? (
            <p className="rounded-2xl bg-slate-50 px-4 py-2.5 font-medium">{initial.category.name}</p>
          ) : (
            <select className={control} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-600">Monthly limit ({currency})</span>
          <input className={control} inputMode="decimal" placeholder="0.00" value={amount}
            onChange={(e) => setAmount(e.target.value)} autoFocus required />
        </label>

        {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-full px-5 py-2.5 font-medium text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button disabled={submitting} className={primaryButton}>
            {submitting ? 'Saving...' : 'Save budget'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
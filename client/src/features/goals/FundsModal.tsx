import { useState } from 'react'
import type { FormEvent } from 'react'
import Modal from '../../components/ui/Modal'
import { control, primaryButton } from '../../components/ui/styles'
import { goalFunds } from '../../services/goals'
import type { Goal } from '../../types/finance'
import { errorMessage } from '../../utils/error'
import { formatMoney } from '../../utils/format'

type Props = {
  goal: Goal
  action: 'add' | 'withdraw'
  currency: string
  onClose: () => void
  onSaved: () => void
}

export default function FundsModal({ goal, action, currency, onClose, onSaved }: Props) {
  const adding = action === 'add'
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    const value = amount.trim()
    if (!/^\d{1,10}(\.\d{1,2})?$/.test(value) || Number(value) <= 0) {
      return setError('Enter a valid amount greater than zero')
    }

    setSubmitting(true)
    try {
      await goalFunds(goal.id, value, action)
      onSaved()
    } catch (err) {
      setError(errorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <Modal title={adding ? 'Add funds' : 'Withdraw funds'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-slate-600">
          <span className="font-medium text-slate-900">{goal.name}</span> · saved{' '}
          {formatMoney(goal.savedAmount, currency)} of {formatMoney(goal.targetAmount, currency)}
        </p>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-600">Amount ({currency})</span>
          <input className={control} inputMode="decimal" placeholder="0.00" value={amount}
            onChange={(e) => setAmount(e.target.value)} autoFocus required />
        </label>

        {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-full px-5 py-2.5 font-medium text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button disabled={submitting} className={primaryButton}>
            {submitting ? 'Saving...' : adding ? 'Add funds' : 'Withdraw'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
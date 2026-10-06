import { useState } from 'react'
import type { FormEvent } from 'react'
import Modal from '../../components/ui/Modal'
import { control, primaryButton } from '../../components/ui/styles'
import { createGoal, updateGoal } from '../../services/goals'
import type { Goal } from '../../types/finance'
import { errorMessage } from '../../utils/error'

type Props = { initial: Goal | null; currency: string; onClose: () => void; onSaved: () => void }

const MONEY = /^\d{1,10}(\.\d{1,2})?$/

export default function GoalFormModal({ initial, currency, onClose, onSaved }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [target, setTarget] = useState(initial?.targetAmount ?? '')
  const [saved, setSaved] = useState('')
  const [deadline, setDeadline] = useState(initial?.deadline ?? '')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    const targetValue = target.trim()
    if (!name.trim()) return setError('Give your goal a name')
    if (!MONEY.test(targetValue) || Number(targetValue) <= 0) {
      return setError('Enter a valid target amount greater than zero')
    }
    if (!initial && saved.trim() && !MONEY.test(saved.trim())) {
      return setError('Already saved must be a valid amount')
    }

    setSubmitting(true)
    try {
      if (initial) {
        await updateGoal(initial.id, { name: name.trim(), targetAmount: targetValue, deadline: deadline || null })
      } else {
        await createGoal({
          name: name.trim(),
          targetAmount: targetValue,
          deadline: deadline || null,
          savedAmount: saved.trim() || undefined,
        })
      }
      onSaved()
    } catch (err) {
      setError(errorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <Modal title={initial ? 'Edit goal' : 'New savings goal'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-600">Goal name</span>
          <input className={control} maxLength={60} placeholder="e.g. Emergency fund" value={name}
            onChange={(e) => setName(e.target.value)} autoFocus required />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-600">Target amount ({currency})</span>
          <input className={control} inputMode="decimal" placeholder="0.00" value={target}
            onChange={(e) => setTarget(e.target.value)} required />
        </label>

        <div className="grid grid-cols-2 gap-3">
          {!initial && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-600">Already saved</span>
              <input className={control} inputMode="decimal" placeholder="0.00" value={saved}
                onChange={(e) => setSaved(e.target.value)} />
            </label>
          )}
          <label className={`block ${initial ? 'col-span-2' : ''}`}>
            <span className="mb-1.5 block text-sm font-medium text-slate-600">Deadline (optional)</span>
            <input className={control} type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </label>
        </div>

        {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-full px-5 py-2.5 font-medium text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button disabled={submitting} className={primaryButton}>
            {submitting ? 'Saving...' : initial ? 'Save changes' : 'Create goal'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
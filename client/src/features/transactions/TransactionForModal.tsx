import { useState } from 'react'
import type { FormEvent } from 'react'
import Modal from '../../components/ui/Modal'
import { control, primaryButton } from '../../components/ui/styles'
import { createTransaction, updateTransaction } from '../../services/finance'
import type { Category, Transaction, TransactionInput, TxType } from '../../types/finance'
import { errorMessage } from '../../utils/error'
import { todayLocal } from '../../utils/format'

type Props = {
  initial: Transaction | null
  categories: Category[]
  currency: string
  onClose: () => void
  onSaved: () => void
}

export default function TransactionFormModal({ initial, categories, currency, onClose, onSaved }: Props) {
  const [type, setType] = useState<TxType>(initial?.type ?? 'EXPENSE')
  const [amount, setAmount] = useState(initial?.amount ?? '')
  const [date, setDate] = useState(initial?.date ?? todayLocal())
  const [categoryId, setCategoryId] = useState(initial?.category?.id ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const options = categories.filter((c) => c.type === type)

  function changeType(next: TxType) {
    if (next === type) return
    setType(next)
    setCategoryId('') // categories belong to one type
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    const value = amount.trim()
    if (!/^\d{1,10}(\.\d{1,2})?$/.test(value) || Number(value) <= 0) {
      setError('Enter a valid amount greater than zero, with up to 2 decimal places')
      return
    }
    if (!date) {
      setError('Choose a date')
      return
    }

    const payload: TransactionInput = {
      amount: value,
      type,
      date,
      description: description.trim() || null,
      categoryId: categoryId || null,
    }

    setSubmitting(true)
    try {
      if (initial) await updateTransaction(initial.id, payload)
      else await createTransaction(payload)
      onSaved()
    } catch (err) {
      setError(errorMessage(err))
      setSubmitting(false)
    }
  }

  const seg = (active: boolean, color: string) =>
    `flex-1 rounded-full py-2 text-sm font-medium transition ${active ? `${color} text-white shadow` : 'text-slate-600'}`

  return (
    <Modal title={initial ? 'Edit transaction' : 'Add transaction'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex rounded-full bg-slate-100 p-1">
          <button type="button" onClick={() => changeType('EXPENSE')} className={seg(type === 'EXPENSE', 'bg-red-500')}>
            Expense
          </button>
          <button type="button" onClick={() => changeType('INCOME')} className={seg(type === 'INCOME', 'bg-green-600')}>
            Income
          </button>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-600">Amount ({currency})</span>
          <input className={control} inputMode="decimal" placeholder="0.00" value={amount}
            onChange={(e) => setAmount(e.target.value)} autoFocus required />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-600">Date</span>
            <input className={control} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-600">Category</span>
            <select className={control} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Uncategorized</option>
              {options.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-600">Description (optional)</span>
          <input className={control} maxLength={200} placeholder="e.g. Lunch with team" value={description}
            onChange={(e) => setDescription(e.target.value)} />
        </label>

        {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-full px-5 py-2.5 font-medium text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button disabled={submitting} className={primaryButton}>
            {submitting ? 'Saving...' : initial ? 'Save changes' : 'Add transaction'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
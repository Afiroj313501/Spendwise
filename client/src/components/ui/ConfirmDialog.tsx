import type { ReactNode } from 'react'
import Modal from './Modal'

type Props = {
  title: string
  message: ReactNode
  confirmLabel?: string
  busy: boolean
  error: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ title, message, confirmLabel = 'Delete', busy, error, onConfirm, onCancel }: Props) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-slate-600">{message}</p>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onCancel} className="rounded-full px-5 py-2.5 font-medium text-slate-600 hover:bg-slate-100">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={busy}
          className="rounded-full bg-red-500 px-5 py-2.5 font-medium text-white transition hover:bg-red-600 disabled:opacity-60">
          {busy ? 'Working...' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
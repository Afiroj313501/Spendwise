import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Check, X } from 'lucide-react'

type Kind = 'success' | 'error'
type Item = { id: number; kind: Kind; message: string }
type ToastApi = { success: (message: string) => void; error: (message: string) => void }

const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((item) => item.id !== id))
  }, [])

  const push = useCallback((kind: Kind, message: string) => {
    const id = nextId.current++
    setItems((list) => [...list.slice(-3), { id, kind, message }])
    window.setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 3500)
  }, [dismiss])

  const api = useMemo<ToastApi>(() => ({
    success: (message) => push('success', message),
    error: (message) => push('error', message),
  }), [push])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-24 z-[60] flex flex-col items-end gap-2 sm:left-auto lg:bottom-6">
        {items.map((item) => (
          <div key={item.id} role={item.kind === 'error' ? 'alert' : 'status'} className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-100 animate-pop">
            <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-white ${item.kind === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
              {item.kind === 'success' ? <Check size={14} /> : <X size={14} />}
            </span>
            <p className="flex-1 text-sm font-medium text-slate-800">{item.message}</p>
            <button onClick={() => dismiss(item.id)} aria-label="Dismiss notification" className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}

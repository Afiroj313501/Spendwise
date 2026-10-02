import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Eye, EyeOff, X } from 'lucide-react'
import { useAuth } from './AuthContext'
import { ApiError } from '../../services/api'
import Logo from '../../components/Logo'

type Mode = 'login' | 'register'
type Props = { mode: Mode; onClose: () => void; onSwitch: (mode: Mode) => void }

const DEMO = { email: 'demo@spendwise.app', password: 'Demo@1234' }

const field =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100'

export default function AuthModal({ mode, onClose, onSwitch }: Props) {
  const isLogin = mode === 'login'
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Close on Escape and lock page scroll while the popup is open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  async function run(action: () => Promise<void>) {
    setError('')
    setSubmitting(true)
    try {
      await action()
      navigate('/app', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? (err.details?.[0]?.message ?? err.message) : 'Cannot reach the server')
    } finally {
      setSubmitting(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    void run(() => (isLogin ? login(email, password) : register(name, email, password)))
  }

  function switchMode(next: Mode) {
    setError('')
    onSwitch(next)
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isLogin ? 'Log in' : 'Create account'}
        className="relative grid w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl animate-pop md:grid-cols-5"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100"
        >
          <X size={20} />
        </button>

        {/* Left brand panel */}
        <div className="hidden flex-col justify-between bg-gradient-to-br from-brand-700 via-brand-600 to-cyan-brand p-8 text-white md:col-span-2 md:flex">
          <div>
            <h2 className="text-2xl font-semibold leading-snug">
              {isLogin ? 'Welcome back' : 'Start tracking smarter'}
            </h2>
            <p className="mt-2 text-white/80">Your money, clearly organized.</p>
          </div>
          <ul className="space-y-3 text-sm">
            {['Dashboards and charts', 'Monthly budgets', 'Private and secure'].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="grid size-5 place-items-center rounded-full bg-white/20"><Check size={12} /></span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Form */}
        <div className="p-8 md:col-span-3">
          <Logo compact />
          <h3 className="mt-6 text-2xl font-semibold">{isLogin ? 'Log in to your account' : 'Create your account'}</h3>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {!isLogin && (
              <input className={field} placeholder="Full name" autoComplete="name" value={name}
                onChange={(e) => setName(e.target.value)} required autoFocus />
            )}
            <input className={field} type="email" placeholder="Email address" autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)} required autoFocus={isLogin} />
            <div className="relative">
              <input className={`${field} pr-12`} type={showPassword ? 'text' : 'password'} placeholder="Password"
                autoComplete={isLogin ? 'current-password' : 'new-password'} value={password}
                onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {!isLogin && <p className="text-xs text-slate-500">At least 8 characters, with a letter and a number.</p>}

            {error && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600" role="alert">{error}</p>}

            <button disabled={submitting}
              className="w-full rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 py-3 font-medium text-white shadow-lg shadow-brand-600/25 transition hover:opacity-90 disabled:opacity-60">
              {submitting ? 'Please wait...' : isLogin ? 'Log in' : 'Create account'}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" /> or <span className="h-px flex-1 bg-slate-200" />
          </div>

          <button type="button" disabled={submitting} onClick={() => void run(() => login(DEMO.email, DEMO.password))}
            className="w-full rounded-2xl border border-slate-200 py-3 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">
            Continue with demo account
          </button>

          <p className="mt-5 text-center text-sm text-slate-500">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button type="button" onClick={() => switchMode(isLogin ? 'register' : 'login')}
              className="font-medium text-brand-600 hover:underline">
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
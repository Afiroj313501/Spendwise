import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { ApiError } from '../services/api'

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isLogin = mode === 'login'
  const { user, login, register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (isLogin) await login(email, password)
      else await register(name, email, password)
      navigate('/', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) setError(err.details?.[0]?.message ?? err.message)
      else setError('Cannot reach the server')
    } finally {
      setSubmitting(false)
    }
  }

  const input =
    'w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white outline-none focus:border-emerald-500'

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold">SpendWise</h1>
          <p className="text-slate-400 mt-1">{isLogin ? 'Welcome back' : 'Create your account'}</p>
        </div>

        {!isLogin && (
          <input className={input} placeholder="Full name" value={name}
            onChange={(e) => setName(e.target.value)} required />
        )}
        <input className={input} type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)} required />
        <input className={input} type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)} required />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button disabled={submitting}
          className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 py-2 font-medium">
          {submitting ? 'Please wait...' : isLogin ? 'Log in' : 'Sign up'}
        </button>

        <p className="text-center text-sm text-slate-400">
          {isLogin ? 'No account? ' : 'Already registered? '}
          <Link className="text-emerald-400 hover:underline" to={isLogin ? '/register' : '/login'}>
            {isLogin ? 'Sign up' : 'Log in'}
          </Link>
        </p>
      </form>
    </main>
  )
}
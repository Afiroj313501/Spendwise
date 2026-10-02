import { useEffect, useState } from 'react'

type Health = { status: string; time: string }

export default function App() {
  const [health, setHealth] = useState<Health | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => setError('API is not reachable'))
  }, [])

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold">SpendWise</h1>
        <p className="text-slate-400">Personal Finance & Expense Analytics</p>
        {health && <p className="text-emerald-400">API status: {health.status}</p>}
        {error && <p className="text-red-400">{error}</p>}
      </div>
    </main>
  )
}
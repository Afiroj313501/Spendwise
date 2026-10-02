import { useAuth } from '../features/auth/AuthContext'

export default function Home() {
  const { user, logout } = useAuth()

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Hello, {user?.name}</h1>
        <p className="text-slate-400">{user?.email} · {user?.currency}</p>
        <button onClick={logout} className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2">
          Log out
        </button>
      </div>
    </main>
  )
}
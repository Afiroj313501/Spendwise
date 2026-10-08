import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, LayoutGrid, LogOut, Receipt, Target, TrendingUp, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import ErrorBoundary from '../components/ErrorBoundary'
import Logo from '../components/Logo'
import { useAuth } from '../features/auth/AuthContext'

const links: { to: string; label: string; short: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/app', label: 'Dashboard', short: 'Home', icon: LayoutGrid, end: true },
  { to: '/app/transactions', label: 'Transactions', short: 'Activity', icon: Receipt },
  { to: '/app/budgets', label: 'Budgets', short: 'Budgets', icon: Wallet },
  { to: '/app/goals', label: 'Goals & Savings', short: 'Goals', icon: Target },
  { to: '/app/analytics', label: 'Analytics', short: 'Reports', icon: TrendingUp },
]

export default function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  async function handleLogout() {
    navigate('/')
    await logout()
  }

  const initials = (user?.name ?? '').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:shadow-soft">Skip to content</a>
      <header className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-5 md:px-8">
        <Link to="/" aria-label="SpendWise home"><Logo /></Link>
        <nav aria-label="Primary" className="hidden rounded-full bg-white/70 p-2 shadow-soft lg:block">
          <ul className="flex gap-1">
            {links.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink to={to} end={end} className={({ isActive }) => `flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-[15px] font-medium transition ${isActive ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md' : 'text-slate-700 hover:bg-white'}`}>
                  <Icon size={18} />{label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen((open) => !open)} aria-label="Account menu" aria-expanded={menuOpen} aria-haspopup="true" className="flex items-center gap-2 rounded-full bg-white p-1.5 pr-3 shadow-soft">
            <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-brand-600 to-cyan-brand font-semibold text-white">{initials}</span>
            <ChevronDown size={18} className="text-slate-600" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-40 mt-2 w-56 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-slate-100 animate-pop">
              <div className="px-3 py-2"><p className="truncate font-medium">{user?.name}</p><p className="truncate text-sm text-slate-500">{user?.email}</p></div>
              <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-red-500 hover:bg-red-50"><LogOut size={16} /> Log out</button>
            </div>
          )}
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-[1500px] px-4 pb-28 outline-none md:px-8 lg:pb-10">
        <ErrorBoundary key={pathname}><Outlet /></ErrorBoundary>
      </main>
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {links.map(({ to, short, icon: Icon, end }) => (
            <li key={to}><NavLink to={to} end={end} className={({ isActive }) => `flex flex-col items-center gap-1 py-2.5 text-xs font-medium ${isActive ? 'text-brand-600' : 'text-slate-500'}`}><Icon size={22} />{short}</NavLink></li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

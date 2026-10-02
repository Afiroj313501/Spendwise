import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  Bell, ChevronDown, LayoutGrid, LogOut, Receipt, Search, Settings, Target, TrendingUp, Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Logo from '../components/Logo'
import { useAuth } from '../features/auth/AuthContext'

const links: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/transactions', label: 'Transactions', icon: Receipt },
  { to: '/budgets', label: 'Budgets', icon: Wallet },
  { to: '/goals', label: 'Goals & Savings', icon: Target },
  { to: '/analytics', label: 'Analytics', icon: TrendingUp },
]

const roundBtn =
  'grid size-12 place-items-center rounded-full bg-white text-slate-700 shadow-soft hover:bg-brand-50'

export default function AppShell() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const initials = (user?.name ?? '')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
        <Logo />

        <nav className="order-last w-full overflow-x-auto rounded-full bg-white/70 p-2 shadow-soft lg:order-none lg:w-auto">
          <ul className="flex gap-1">
            {links.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-[15px] font-medium transition ${
                      isActive
                        ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md'
                        : 'text-slate-700 hover:bg-white'
                    }`
                  }
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <button className={roundBtn} aria-label="Search"><Search size={20} /></button>
          <button className={`${roundBtn} hidden sm:grid`} aria-label="Settings"><Settings size={20} /></button>
          <button className={`${roundBtn} hidden sm:grid`} aria-label="Notifications"><Bell size={20} /></button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-full bg-white p-1.5 pr-3 shadow-soft"
              aria-label="Account menu"
            >
              <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-brand-600 to-cyan-brand font-semibold text-white">
                {initials}
              </span>
              <ChevronDown size={18} className="text-slate-600" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl bg-white p-2 shadow-soft ring-1 ring-slate-100">
                <div className="px-3 py-2">
                  <p className="font-medium">{user?.name}</p>
                  <p className="truncate text-sm text-slate-500">{user?.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-red-500 hover:bg-red-50"
                >
                  <LogOut size={16} /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 pb-10 md:px-8">
        <Outlet />
      </main>
    </div>
  )
}
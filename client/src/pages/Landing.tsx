import { useCallback, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Check, Download, Receipt, ShieldCheck, Target, TrendingUp, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Logo from '../components/Logo'
import AuthModal from '../features/auth/AuthModal'
import { useAuth } from '../features/auth/AuthContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-600 to-brand-500 px-7 py-3.5 font-medium text-white shadow-lg shadow-brand-600/25 transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60'
const ghostBtn =
  'inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 font-medium text-slate-800 shadow-soft ring-1 ring-slate-200 transition hover:-translate-y-0.5 disabled:opacity-60'

const features: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Receipt, title: 'Effortless tracking', text: 'Log income and expenses in seconds, then search, filter and sort your full history.' },
  { icon: TrendingUp, title: 'Visual analytics', text: 'Cash-flow trends and category breakdowns that make your spending habits obvious.' },
  { icon: Wallet, title: 'Smart budgets', text: 'Set monthly limits per category and get warned before you overspend.' },
  { icon: Target, title: 'Savings goals', text: 'Set a target, track your progress, and watch the bar fill up.' },
  { icon: Download, title: 'Export your data', text: 'Download your transactions as CSV any time. Your data is yours.' },
  { icon: ShieldCheck, title: 'Private and secure', text: 'Hashed passwords, protected API routes, and data that belongs only to you.' },
]

const steps = [
  { n: '01', title: 'Create your account', text: 'Sign up in seconds. Common categories are ready for you.' },
  { n: '02', title: 'Add your transactions', text: 'Record income and expenses in a few clicks.' },
  { n: '03', title: 'Understand your money', text: 'Dashboards, budgets and insights update automatically.' },
]

const miniStats = [
  { label: 'Balance', value: '৳128,430', tone: 'text-green-600', delta: '+10.6%' },
  { label: 'Income', value: '৳55,000', tone: 'text-green-600', delta: '+25.7%' },
  { label: 'Expense', value: '৳39,800', tone: 'text-red-500', delta: '+24.5%' },
]

function DashboardPreview() {
  return (
    <div className="relative animate-fade-up [animation-delay:200ms]">
      <div className="rounded-[2rem] bg-white p-5 shadow-2xl shadow-brand-600/15 ring-1 ring-slate-100">
        <div className="mb-4 flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-red-400" />
          <span className="size-2.5 rounded-full bg-amber-400" />
          <span className="size-2.5 rounded-full bg-green-400" />
          <span className="ml-3 text-sm font-medium text-slate-400">Dashboard Overview</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {miniStats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-canvas p-3">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="mt-1 text-base font-semibold sm:text-lg">{s.value}</p>
              <p className={`text-xs font-medium ${s.tone}`}>{s.delta}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-canvas p-4">
          <p className="mb-2 text-sm font-medium text-slate-600">Monthly Cash Flow</p>
          <svg viewBox="0 0 400 140" className="w-full" aria-hidden="true">
            <defs>
              <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#0a56f0" stopOpacity="0.25" />
                <stop offset="1" stopColor="#0a56f0" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 100 C40 80 70 30 110 40 S180 110 220 80 S300 20 340 50 S380 90 400 70 L400 140 L0 140 Z" fill="url(#area)" />
            <path d="M0 100 C40 80 70 30 110 40 S180 110 220 80 S300 20 340 50 S380 90 400 70" fill="none" stroke="#0a56f0" strokeWidth="3" strokeLinecap="round" />
            <path d="M0 90 C40 110 80 60 120 85 S190 40 230 70 S310 110 350 80 S390 60 400 65" fill="none" stroke="#09c3ff" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Floating donut */}
      <div className="absolute -bottom-10 -left-4 hidden animate-float rounded-3xl bg-white p-4 shadow-xl ring-1 ring-slate-100 sm:block">
        <p className="mb-2 text-xs font-medium text-slate-500">Expense Breakdown</p>
        <div
          className="grid size-24 place-items-center rounded-full"
          style={{ background: 'conic-gradient(#0a56f0 0 50%, #09c3ff 50% 75%, #dbe7ff 75% 100%)' }}
        >
          <div className="grid size-14 place-items-center rounded-full bg-white text-sm font-semibold">৳39.8K</div>
        </div>
      </div>

      {/* Floating budget */}
      <div className="absolute -right-3 -top-6 hidden w-48 animate-float rounded-3xl bg-white p-4 shadow-xl ring-1 ring-slate-100 [animation-delay:1.5s] sm:block">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-600">Food budget</span>
          <span className="font-semibold text-brand-600">62%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-brand-100">
          <div className="h-2 w-[62%] rounded-full bg-gradient-to-r from-brand-600 to-cyan-brand" />
        </div>
        <p className="mt-2 flex items-center gap-1 text-xs text-green-600"><Check size={12} /> On track this month</p>
      </div>
    </div>
  )
}

export default function Landing() {
  useDocumentTitle('')
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [demoLoading, setDemoLoading] = useState(false)

  const authParam = params.get('auth')
  const authMode = authParam === 'login' || authParam === 'register' ? authParam : null
  const showAuth = authMode !== null && !user && !loading

  const openAuth = (mode: 'login' | 'register') => setParams({ auth: mode })
  const closeAuth = useCallback(() => setParams({}), [setParams])

  async function tryDemo() {
    setDemoLoading(true)
    try {
      await login('demo@spendwise.app', 'Demo@1234')
      navigate('/app')
    } catch {
      openAuth('login')
    } finally {
      setDemoLoading(false)
    }
  }

  return (
    <div className="relative overflow-x-hidden">
      {/* Navbar */}
      <header className="fixed inset-x-0 top-0 z-40 px-4">
        <div className="mx-auto mt-4 flex max-w-6xl items-center justify-between rounded-full bg-white/70 px-5 py-3 shadow-soft ring-1 ring-white/60 backdrop-blur-xl">
          <Link to="/"><Logo compact /></Link>

          <nav className="hidden items-center gap-8 text-[15px] font-medium text-slate-600 md:flex">
            <a href="#features" className="hover:text-brand-600">Features</a>
            <a href="#how" className="hover:text-brand-600">How it works</a>
            <a href="#security" className="hover:text-brand-600">Security</a>
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <Link to="/app" className={`${primaryBtn} !px-5 !py-2.5`}>Open dashboard <ArrowRight size={16} /></Link>
            ) : (
              <>
                <button onClick={() => openAuth('login')} className="rounded-full px-4 py-2.5 font-medium text-slate-700 hover:bg-white">
                  Log in
                </button>
                <button onClick={() => openAuth('register')} className={`${primaryBtn} !px-5 !py-2.5`}>Sign up</button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pb-24 pt-36">
        <div className="pointer-events-none absolute -top-40 left-1/2 size-[900px] -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-500/20 via-cyan-brand/20 to-transparent blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-4 lg:grid-cols-2">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-medium text-brand-600 shadow-soft ring-1 ring-brand-100">
              <span className="size-2 rounded-full bg-green-500" /> Personal finance, simplified
            </span>
            <h1 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              Take control of your{' '}
              <span className="bg-gradient-to-r from-brand-600 to-cyan-brand bg-clip-text text-transparent">money</span>.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-slate-600">
              SpendWise turns your income and expenses into clear dashboards, budgets and insights, so you always know where you stand.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <Link to="/app" className={primaryBtn}>Open dashboard <ArrowRight size={18} /></Link>
              ) : (
                <>
                  <button onClick={() => openAuth('register')} className={primaryBtn}>
                    Get started free <ArrowRight size={18} />
                  </button>
                  <button onClick={tryDemo} disabled={demoLoading} className={ghostBtn}>
                    {demoLoading ? 'Loading demo...' : 'Try live demo'}
                  </button>
                </>
              )}
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
              {['Free to use', 'No bank connection needed', 'Your data stays yours'].map((t) => (
                <li key={t} className="flex items-center gap-1.5"><Check size={16} className="text-green-600" /> {t}</li>
              ))}
            </ul>
          </div>

          <DashboardPreview />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-medium text-brand-600">Features</p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight">Everything you need to manage your money</h2>
          <p className="mt-4 text-lg text-slate-600">Simple enough for daily use, powerful enough to show you the full picture.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-card bg-white p-7 shadow-soft transition hover:-translate-y-1 hover:shadow-xl">
              <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-cyan-brand text-white">
                <Icon size={22} />
              </span>
              <h3 className="mt-5 text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-medium text-brand-600">How it works</p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight">Up and running in three steps</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-card bg-white p-7 shadow-soft">
              <span className="bg-gradient-to-r from-brand-600 to-cyan-brand bg-clip-text text-5xl font-semibold text-transparent">{s.n}</span>
              <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Security */}
      <section id="security" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-10 text-white md:p-14">
          <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-gradient-to-br from-brand-500/40 to-cyan-brand/30 blur-3xl" />
          <div className="relative grid items-center gap-10 md:grid-cols-2">
            <div>
              <p className="font-medium text-cyan-brand">Security</p>
              <h2 className="mt-2 text-4xl font-semibold tracking-tight">Built with your privacy in mind</h2>
              <p className="mt-4 text-lg text-slate-300">
                Financial data deserves careful engineering. SpendWise is designed so your information stays protected.
              </p>
            </div>
            <ul className="space-y-4">
              {[
                'Passwords are hashed with bcrypt, never stored in plain text',
                'Short-lived access tokens with a secure, httpOnly refresh cookie',
                'Every query is scoped to your account only',
                'Amounts are stored as exact decimals, not floating-point numbers',
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-cyan-brand/20 text-cyan-brand"><Check size={14} /></span>
                  <span className="text-slate-200">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      {!user && (
        <section className="mx-auto max-w-6xl px-4 pb-24 pt-10">
          <div className="rounded-[2.5rem] bg-gradient-to-br from-brand-700 via-brand-600 to-cyan-brand p-10 text-center text-white md:p-16">
            <h2 className="text-4xl font-semibold tracking-tight">Ready to know where your money goes?</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">Create a free account, or explore the live demo first.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button onClick={() => openAuth('register')}
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-medium text-brand-600 transition hover:-translate-y-0.5">
                Create free account <ArrowRight size={18} />
              </button>
              <button onClick={tryDemo} disabled={demoLoading}
                className="rounded-full border border-white/40 px-7 py-3.5 font-medium text-white transition hover:bg-white/10 disabled:opacity-60">
                Try live demo
              </button>
            </div>
          </div>
        </section>
      )}

      <footer className="border-t border-slate-200/70 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} SpendWise · A full-stack portfolio project
      </footer>

      {showAuth && authMode && (
        <AuthModal mode={authMode} onClose={closeAuth} onSwitch={openAuth} />
      )}
    </div>
  )
}
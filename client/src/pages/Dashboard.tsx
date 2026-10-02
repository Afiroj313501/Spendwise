import type { ReactNode } from 'react'
import { ArrowDownLeft, ArrowUpRight, Calendar, ChevronDown, Wallet } from 'lucide-react'
import Card from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import InsightCard from '../components/ui/InsightCard'
import { useAuth } from '../features/auth/AuthContext'
import { formatMoney } from '../utils/format'

function Placeholder({ title, className = '', note }: { title: string; className?: string; note: ReactNode }) {
  return (
    <Card className={className}>
      <h3 className="text-xl font-medium">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{note}</p>
    </Card>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const money = (n: number) => formatMoney(n, user?.currency)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard Overview</h1>
          <p className="mt-1 text-lg text-slate-500">Your financial health at a glance, with smart insights and trends.</p>
        </div>
        <button className="flex items-center gap-3 rounded-full bg-white px-5 py-3 shadow-soft">
          <Calendar size={20} />
          <span className="font-medium">This month</span>
          <ChevronDown size={18} />
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Left column */}
        <div className="grid content-start gap-6 sm:grid-cols-2">
          <StatCard
            title="Total Balance"
            value={money(128430)}
            icon={Wallet}
            percent="10.65%"
            good
            note={<>Increased <span className="font-medium text-green-600">+{money(24000)}</span> from last month.</>}
          />
          <StatCard
            title="Monthly Income"
            value={money(55000)}
            icon={ArrowDownLeft}
            percent="25.75%"
            good
            note={<>Increased <span className="font-medium text-green-600">+{money(16500)}</span> from last month.</>}
          />
          <Placeholder title="Monthly Cash Flow" className="h-[430px] sm:col-span-2" note="Line chart: Day 7" />
          <Placeholder title="Savings Goals" className="h-[340px] sm:col-span-2" note="Progress bars: Day 8" />
        </div>

        {/* Right column */}
        <div className="grid content-start gap-6 sm:grid-cols-2">
          <StatCard
            title="Monthly Expense"
            value={money(39800)}
            icon={ArrowUpRight}
            percent="24.55%"
            good={false}
            note={<>Increased <span className="font-medium text-red-500">+{money(26800)}</span> from last month.</>}
          />
          <Placeholder title="Expense Breakdown" className="min-h-[420px] sm:row-span-2" note="Donut chart: Day 7" />
          <InsightCard
            message="You tend to overspend on weekends. Try setting a weekend budget to save an extra ৳1,500."
            action="Set Budget"
          />
          <Placeholder title="Latest Transactions" className="h-[480px] sm:col-span-2" note="Table: Day 5" />
        </div>
      </div>
    </div>
  )
}
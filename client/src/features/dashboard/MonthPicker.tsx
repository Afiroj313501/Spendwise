import { ChevronLeft, ChevronRight } from 'lucide-react'
import { currentMonth, monthLabel, shiftMonth } from '../../utils/months'

type Props = { month: string; onChange: (month: string) => void; allowFuture?: boolean }

const arrow =
  'grid size-10 place-items-center rounded-full text-slate-600 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent'

export default function MonthPicker({ month, onChange, allowFuture = false }: Props) {
  const atLatest = !allowFuture && month >= currentMonth() // "YYYY-MM" strings compare correctly

  return (
    <div className="flex items-center gap-1 rounded-full bg-white p-1.5 shadow-soft">
      <button className={arrow} onClick={() => onChange(shiftMonth(month, -1))} aria-label="Previous month">
        <ChevronLeft size={20} />
      </button>
      <span className="min-w-36 text-center font-medium">{monthLabel(month)}</span>
      <button className={arrow} disabled={atLatest} onClick={() => onChange(shiftMonth(month, 1))} aria-label="Next month">
        <ChevronRight size={20} />
      </button>
    </div>
  )
}
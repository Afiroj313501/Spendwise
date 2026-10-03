import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = { page: number; limit: number; total: number; totalPages: number; onPage: (page: number) => void }

const btn =
  'grid size-10 place-items-center rounded-full bg-white shadow-soft ring-1 ring-slate-200 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white'

export default function Pagination({ page, limit, total, totalPages, onPage }: Props) {
  if (total === 0) return null
  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
      <p>
        Showing <span className="font-medium text-slate-800">{start}–{end}</span> of{' '}
        <span className="font-medium text-slate-800">{total}</span>
      </p>
      <div className="flex items-center gap-3">
        <button className={btn} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft size={18} />
        </button>
        <span>Page {page} of {totalPages}</span>
        <button className={btn} disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Next page">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
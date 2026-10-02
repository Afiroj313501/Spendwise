import { ChevronRight, Sparkles } from 'lucide-react'

export default function InsightCard({ message, action }: { message: string; action: string }) {
  return (
    <section className="flex min-h-[300px] flex-col justify-between rounded-card bg-gradient-to-br from-brand-700 via-brand-600 to-cyan-brand p-6 text-white shadow-soft">
      <div>
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-full bg-white text-brand-600">
            <Sparkles size={20} />
          </span>
          <h3 className="text-xl font-medium">Smart Insight</h3>
        </div>
        <p className="mt-6 text-xl font-medium leading-snug">{message}</p>
      </div>
      <button className="mt-6 inline-flex w-fit items-center gap-1 self-end rounded-full bg-white px-5 py-2.5 font-medium text-brand-600 hover:bg-brand-50">
        {action}
        <ChevronRight size={16} />
      </button>
    </section>
  )
}
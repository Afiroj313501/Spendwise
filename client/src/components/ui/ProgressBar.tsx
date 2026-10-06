type Tone = 'brand' | 'warning' | 'danger' | 'success'

const fills: Record<Tone, string> = {
  brand: 'bg-gradient-to-r from-brand-600 to-cyan-brand',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  success: 'bg-green-500',
}

type Props = { percent: number; tone?: Tone; className?: string }

export default function ProgressBar({ percent, tone = 'brand', className = '' }: Props) {
  const value = Math.max(0, Math.min(100, percent))
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      className={`h-2.5 w-full overflow-hidden rounded-full bg-slate-100 ${className}`}
    >
      <div className={`h-full rounded-full transition-all duration-500 ${fills[tone]}`} style={{ width: `${value}%` }} />
    </div>
  )
}
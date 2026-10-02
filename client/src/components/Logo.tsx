export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg viewBox="0 0 40 40" className="size-9" aria-hidden="true">
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#09c3ff" />
            <stop offset="1" stopColor="#0a56f0" />
          </linearGradient>
        </defs>
        <path d="M20 4 38 34H2Z" fill="url(#logo-grad)" />
        <path d="M20 16 29 31H11Z" fill="#fff" opacity="0.9" />
      </svg>
      <span className="text-3xl font-semibold tracking-tight">SpendWise</span>
    </div>
  )
}
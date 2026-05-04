import clsx from 'clsx'
export default function Select({ label, error, children, className, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>}
      <div className="relative">
        <select className={clsx('select', error && 'error', className)} {...props}>{children}</select>
        <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
      {error && <p className="text-xs text-danger font-medium mt-0.5">{error}</p>}
    </div>
  )
}

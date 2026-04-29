import clsx from 'clsx'
export default function Select({ label, error, children, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-ink-2 uppercase tracking-wider">{label}</label>}
      <select
        className={clsx('input-base appearance-none cursor-pointer', error && 'border-red-500/60', className)}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

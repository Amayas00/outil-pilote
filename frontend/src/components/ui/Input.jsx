import clsx from 'clsx'

export default function Input({ label, error, hint, icon, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-ink-2 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 w-4 h-4">
            {icon}
          </span>
        )}
        <input
          className={clsx(
            'input-base',
            icon && 'pl-9',
            error && 'border-red-500/60 focus:border-red-500 focus:shadow-none',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-ink-3">{hint}</p>}
    </div>
  )
}

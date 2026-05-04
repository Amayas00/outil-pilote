import clsx from 'clsx'

export default function Input({ label, error, hint, icon, className, id, ...props }) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 flex items-center">{icon}</span>}
        <input
          id={inputId}
          className={clsx('input', icon && 'pl-9', error && 'error', className)}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger font-medium mt-0.5">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
    </div>
  )
}

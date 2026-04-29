import clsx from 'clsx'

const variants = {
  primary:  'bg-brand-600 hover:bg-brand-500 text-white shadow-card active:bg-brand-700',
  secondary:'bg-surface-4 hover:bg-surface-5 text-ink-1 border border-surface-5',
  ghost:    'hover:bg-surface-4 text-ink-2 hover:text-ink-1',
  danger:   'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30',
}
const sizes = {
  xs: 'px-2.5 py-1 text-xs gap-1.5',
  sm: 'px-3 py-1.5 text-sm gap-2',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2.5',
}

export default function Button({
  children, variant = 'primary', size = 'md',
  loading = false, icon, className, ...props
}) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-md',
        'transition-all duration-150 focus-ring',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variants[variant], sizes[size], className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading
        ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        : icon && <span className="shrink-0">{icon}</span>
      }
      {children}
    </button>
  )
}

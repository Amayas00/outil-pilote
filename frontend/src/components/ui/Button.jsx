import clsx from 'clsx'

export default function Button({ children, variant = 'primary', size = 'md', loading, icon, className, ...props }) {
  return (
    <button
      className={clsx('btn', `btn-${variant}`, `btn-${size}`, className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading
        ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin-sm" />
        : icon && <span className="w-4 h-4 shrink-0 flex items-center">{icon}</span>
      }
      {children}
    </button>
  )
}

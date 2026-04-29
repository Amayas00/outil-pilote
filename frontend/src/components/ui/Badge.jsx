import clsx from 'clsx'

const variants = {
  default: 'bg-surface-5 text-ink-2',
  brand:   'bg-brand-600/20 text-brand-300 border border-brand-500/30',
  success: 'bg-green-500/15 text-green-300 border border-green-500/25',
  warning: 'bg-amber-500/15 text-amber-300 border border-amber-500/25',
  danger:  'bg-red-500/15 text-red-300 border border-red-500/25',
  info:    'bg-cyan-500/15 text-cyan-300 border border-cyan-500/25',
}

export default function Badge({ children, variant = 'default', dot, className }) {
  return (
    <span className={clsx('badge', variants[variant], className)}>
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', dot)} />}
      {children}
    </span>
  )
}

import clsx from 'clsx'
const V = {
  default: 'bg-slate-100 text-slate-600 border-slate-200',
  brand:   'bg-axa-light text-axa-dark border-axa/30',
  success: 'bg-success-bg text-success border-success-border',
  warning: 'bg-warning-bg text-warning border-warning-border',
  danger:  'bg-danger-bg text-danger border-danger-border',
  info:    'bg-info-bg text-axa border-info-border',
  outline: 'bg-transparent text-slate-600 border-slate-300',
}
export default function Badge({ children, variant = 'default', dot, className }) {
  return (
    <span className={clsx('badge', V[variant] || V.default, className)}>
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', dot)} />}
      {children}
    </span>
  )
}

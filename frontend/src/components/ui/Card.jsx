import clsx from 'clsx'

export default function Card({ children, className, hover = false, padding = true }) {
  return (
    <div className={clsx(
      'bg-surface-2 border border-surface-5/60 rounded-lg shadow-card',
      padding && 'p-4',
      hover && 'transition-all duration-200 hover:bg-surface-3 hover:border-surface-5 hover:shadow-card-md cursor-pointer',
      className
    )}>
      {children}
    </div>
  )
}

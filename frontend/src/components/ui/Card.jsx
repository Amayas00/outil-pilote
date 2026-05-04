import clsx from 'clsx'
export default function Card({ children, className, hover, padding = true }) {
  return (
    <div className={clsx('card', padding && 'p-5',
      hover && 'cursor-pointer hover:shadow hover:border-slate-200 transition-all duration-120',
      className)}>
      {children}
    </div>
  )
}

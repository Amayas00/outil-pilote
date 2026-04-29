import clsx from 'clsx'
import Skeleton from './Skeleton'

export function Table({ children, className }) {
  return (
    <div className={clsx('overflow-hidden rounded-lg border border-surface-5/60', className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    </div>
  )
}

export function Thead({ children }) {
  return (
    <thead className="bg-surface-0 border-b border-surface-5">
      <tr>{children}</tr>
    </thead>
  )
}

export function Th({ children, className, sortable, sorted, onClick }) {
  return (
    <th
      className={clsx(
        'px-4 py-2.5 text-left text-[10px] font-semibold text-ink-3 uppercase tracking-wider whitespace-nowrap',
        sortable && 'cursor-pointer hover:text-ink-1 transition-colors select-none',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortable && (
          <svg className={clsx('w-3 h-3 transition-transform', sorted === 'desc' && 'rotate-180', !sorted && 'opacity-30')}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
          </svg>
        )}
      </div>
    </th>
  )
}

export function Tbody({ children }) {
  return <tbody className="divide-y divide-surface-5/40">{children}</tbody>
}

export function Tr({ children, className, onClick }) {
  return (
    <tr
      className={clsx(
        'bg-surface-2 transition-colors duration-100',
        onClick ? 'cursor-pointer hover:bg-surface-3' : 'hover:bg-surface-2/80',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

export function Td({ children, className, muted }) {
  return (
    <td className={clsx(
      'px-4 py-3 text-sm whitespace-nowrap',
      muted ? 'text-ink-3' : 'text-ink-1',
      className
    )}>
      {children}
    </td>
  )
}

export function TableSkeleton({ cols = 5, rows = 6 }) {
  return (
    <Table>
      <Thead>
        <tr>
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i} className="px-4 py-2.5">
              <Skeleton className="h-3 w-20" />
            </th>
          ))}
        </tr>
      </Thead>
      <Tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <Tr key={i}>
            {Array.from({ length: cols }).map((_, j) => (
              <Td key={j}><Skeleton className={clsx('h-4', j === 0 ? 'w-8' : j === 1 ? 'w-32' : 'w-20')} /></Td>
            ))}
          </Tr>
        ))}
      </Tbody>
    </Table>
  )
}

export function TableEmpty({ message = 'Aucun résultat', hint, icon }) {
  return (
    <Table>
      <Tbody>
        <tr>
          <td colSpan={99}>
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-4 flex items-center justify-center text-ink-4">
                {icon || <DefaultIcon />}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-ink-2">{message}</p>
                {hint && <p className="text-xs text-ink-4 mt-1">{hint}</p>}
              </div>
            </div>
          </td>
        </tr>
      </Tbody>
    </Table>
  )
}

function DefaultIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
  </svg>
}

import clsx from 'clsx'
import Skeleton from './Skeleton'

export function Table({ children, className }) {
  return (
    <div className={clsx('table-wrap overflow-x-auto', className)}>
      <table className="w-full border-collapse">{children}</table>
    </div>
  )
}
export function Thead({ children }) {
  return <thead className="table-head"><tr>{children}</tr></thead>
}
export function Th({ children, className, sortable, sorted, onClick }) {
  return (
    <th onClick={onClick} className={clsx('table-th', sortable && 'cursor-pointer hover:text-slate-700 select-none', className)}>
      <div className="flex items-center gap-1">
        {children}
        {sortable && <svg className={clsx('w-3 h-3', !sorted && 'opacity-30', sorted==='desc' && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5"/></svg>}
      </div>
    </th>
  )
}
export function Tbody({ children }) { return <tbody>{children}</tbody> }
export function Tr({ children, className, onClick }) {
  return <tr onClick={onClick} className={clsx('table-row', onClick && 'cursor-pointer', className)}>{children}</tr>
}
export function Td({ children, className, muted }) {
  return <td className={clsx('table-td', muted && '!text-slate-400', className)}>{children}</td>
}
export function TableSkeleton({ cols=5, rows=6 }) {
  return (
    <div className="table-wrap">
      <table className="w-full">
        <thead className="table-head"><tr>{Array.from({length:cols}).map((_,i)=><th key={i} className="table-th"><Skeleton className="h-2.5 w-16"/></th>)}</tr></thead>
        <tbody>{Array.from({length:rows}).map((_,i)=><tr key={i} className="table-row">{Array.from({length:cols}).map((_,j)=><td key={j} className="table-td"><Skeleton className={clsx('h-4',j===0?'w-10':j===1?'w-36':'w-24')}/></td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}
export function TableEmpty({ message='Aucun résultat', hint, icon }) {
  return (
    <div className="table-wrap">
      <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white">
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">{icon||<DefaultIcon/>}</div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-600">{message}</p>
          {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
        </div>
      </div>
    </div>
  )
}
function DefaultIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/></svg> }

import clsx from 'clsx'
export default function Skeleton({ className, rows = 1 }) {
  if (rows > 1) return <div className="flex flex-col gap-2">{Array.from({length:rows}).map((_,i)=><div key={i} className={clsx('bg-slate-100 rounded animate-skeleton',className)}/>)}</div>
  return <div className={clsx('bg-slate-100 rounded animate-skeleton',className)}/>
}

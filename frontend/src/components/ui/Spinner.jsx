import clsx from 'clsx'
export default function Spinner({ size='md', className }) {
  const s={sm:'w-4 h-4 border-2',md:'w-5 h-5 border-2',lg:'w-7 h-7 border-[3px]'}
  return <div className={clsx('rounded-full border-slate-200 border-t-axa animate-spin-sm',s[size],className)}/>
}

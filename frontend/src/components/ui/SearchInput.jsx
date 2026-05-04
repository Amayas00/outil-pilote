import clsx from 'clsx'
export default function SearchInput({ value, onChange, placeholder='Rechercher…', className }) {
  return (
    <div className={clsx('relative',className)}>
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
      </svg>
      <input type="search" value={value} onChange={e=>onChange(e.target.value)}
        placeholder={placeholder} className="input pl-8 h-9"/>
    </div>
  )
}

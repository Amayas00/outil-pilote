import { useState } from 'react'
import clsx from 'clsx'
export default function Tooltip({ children, content, side='top' }) {
  const [v, setV] = useState(false)
  const pos = { top:'bottom-full left-1/2 -translate-x-1/2 mb-1.5', bottom:'top-full left-1/2 -translate-x-1/2 mt-1.5', left:'right-full top-1/2 -translate-y-1/2 mr-1.5', right:'left-full top-1/2 -translate-y-1/2 ml-1.5' }
  return (
    <div className="relative inline-flex" onMouseEnter={()=>setV(true)} onMouseLeave={()=>setV(false)}>
      {children}
      {v && content && <div className={clsx('absolute z-50 px-2.5 py-1.5 text-xs text-white bg-slate-800 rounded shadow-md whitespace-nowrap pointer-events-none animate-fade-in', pos[side])}>{content}</div>}
    </div>
  )
}

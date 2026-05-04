import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
export default function ActionMenu({ items, trigger }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({top:0,left:0})
  const btnRef = useRef(); const menuRef = useRef()
  useEffect(() => {
    if (!open) return
    const close = e => { if (menuRef.current && !menuRef.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  const handleOpen = e => {
    e.stopPropagation()
    const r = btnRef.current.getBoundingClientRect()
    const mH = items.filter(i=>i!=='divider').length*34+16
    const top = window.innerHeight-r.bottom>mH ? r.bottom+4 : r.top-mH-4
    setPos({top, left:Math.min(r.left, window.innerWidth-200)}); setOpen(v=>!v)
  }
  return (
    <>
      <div ref={btnRef} onClick={handleOpen}>{trigger||<DefaultTrigger/>}</div>
      {open && createPortal(
        <div ref={menuRef} style={{position:'fixed',top:pos.top,left:pos.left,zIndex:9999}}
          className="w-48 bg-white border border-slate-150 rounded-lg shadow-md animate-slide-up py-1 overflow-hidden">
          {items.map((item,i) => item==='divider'
            ? <div key={i} className="my-1 border-t border-slate-100"/>
            : <button key={i} onClick={e=>{e.stopPropagation();setOpen(false);item.onClick?.()}} disabled={item.disabled}
                className={clsx('w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors disabled:opacity-40',
                  item.danger?'text-danger hover:bg-danger-bg':'text-slate-700 hover:bg-slate-50')}>
                {item.icon && <span className="w-4 h-4 shrink-0 text-slate-400">{item.icon}</span>}
                {item.label}
              </button>
          )}
        </div>, document.body
      )}
    </>
  )
}
function DefaultTrigger() {
  return <button className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
  </button>
}

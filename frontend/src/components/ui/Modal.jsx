import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

export default function Modal({ open, onClose, title, subtitle, children, size='md', footer }) {
  const overlayRef = useRef()
  useEffect(() => {
    if (!open) return
    const h = e => { if (e.key==='Escape') onClose() }
    document.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow='' }
  }, [open, onClose])
  if (!open) return null
  const sizes = { sm:'max-w-md', md:'max-w-lg', lg:'max-w-2xl', xl:'max-w-3xl' }
  return createPortal(
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target===overlayRef.current) onClose() }}>
      <div className="absolute inset-0 bg-slate-900/40 animate-fade-in"/>
      <div className={clsx('relative w-full bg-white rounded-xl shadow-lg border border-slate-150 animate-slide-up flex flex-col max-h-[88vh]', sizes[size])}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-150 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-axa rounded-full"/>
            <div>
              <h3 className="text-base font-semibold text-slate-900">{title}</h3>
              {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 shrink-0 bg-slate-25 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

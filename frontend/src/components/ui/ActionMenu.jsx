import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

export default function ActionMenu({ items, trigger }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef()
  const menuRef = useRef()

  useEffect(() => {
    if (!open) return
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          btnRef.current && !btnRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const handleOpen = (e) => {
    e.stopPropagation()
    const rect = btnRef.current.getBoundingClientRect()
    const menuH = items.length * 36 + 16
    const spaceBelow = window.innerHeight - rect.bottom
    const top = spaceBelow > menuH ? rect.bottom + 4 : rect.top - menuH - 4
    setPos({ top, left: Math.min(rect.left, window.innerWidth - 200) })
    setOpen(v => !v)
  }

  return (
    <>
      <div ref={btnRef} onClick={handleOpen}>
        {trigger || <DefaultTrigger />}
      </div>
      {open && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="w-48 bg-surface-2 border border-surface-5 rounded-lg shadow-card-lg animate-slide-up overflow-hidden py-1"
        >
          {items.map((item, i) => item === 'divider'
            ? <div key={i} className="my-1 border-t border-surface-5/60" />
            : (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setOpen(false); item.onClick?.() }}
                disabled={item.disabled}
                className={clsx(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  item.danger
                    ? 'text-red-400 hover:bg-red-500/10'
                    : 'text-ink-1 hover:bg-surface-4'
                )}
              >
                {item.icon && <span className="w-4 h-4 shrink-0">{item.icon}</span>}
                {item.label}
              </button>
            )
          )}
        </div>,
        document.body
      )}
    </>
  )
}

function DefaultTrigger() {
  return (
    <button className="p-1.5 rounded-md text-ink-3 hover:text-ink-1 hover:bg-surface-4 transition-colors">
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
      </svg>
    </button>
  )
}

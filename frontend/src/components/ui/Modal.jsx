import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import Button from './Button'

export default function Modal({ open, onClose, title, subtitle, children, size = 'md', footer }) {
  const overlayRef = useRef()

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
  }

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      {/* Panel */}
      <div className={clsx(
        'relative w-full bg-surface-2 border border-surface-5 rounded-xl shadow-card-lg',
        'animate-slide-up flex flex-col max-h-[90vh]',
        sizes[size]
      )}>
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-surface-5/60 shrink-0">
          <div>
            <h3 className="text-base font-semibold text-ink-1">{title}</h3>
            {subtitle && <p className="text-xs text-ink-3 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-ink-3 hover:text-ink-1 hover:bg-surface-4 transition-colors ml-4 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-surface-5/60 shrink-0 bg-surface-2 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

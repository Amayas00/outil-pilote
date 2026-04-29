import { useState } from 'react'
import clsx from 'clsx'

export default function Tooltip({ children, content, side = 'top' }) {
  const [visible, setVisible] = useState(false)
  const positions = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left:   'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right:  'left-full top-1/2 -translate-y-1/2 ml-1.5',
  }
  return (
    <div className="relative inline-flex" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && content && (
        <div className={clsx(
          'absolute z-50 px-2 py-1 text-xs text-ink-1 bg-surface-3 border border-surface-5',
          'rounded shadow-card-md whitespace-nowrap pointer-events-none animate-fade-in',
          positions[side]
        )}>
          {content}
        </div>
      )}
    </div>
  )
}

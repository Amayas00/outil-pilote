import { useEffect, useRef } from 'react'
import clsx from 'clsx'

export default function CellContextMenu({ position, entry, motifs, onSelect, onDelete, onClose, canEdit }) {
  const ref = useRef()

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  // Adjust to stay within viewport
  const style = {
    position: 'fixed',
    top: Math.min(position.y, window.innerHeight - 320),
    left: Math.min(position.x, window.innerWidth - 220),
    zIndex: 1000,
  }

  return (
    <div ref={ref} style={style}
      className="w-52 bg-surface-2 border border-surface-5 rounded-lg shadow-card-lg animate-slide-up overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-surface-5/60">
        <p className="text-xs font-medium text-ink-2">Affecter un motif</p>
        {entry && (
          <p className="text-[10px] text-ink-4 mt-0.5">Remplace : {entry.motif_libelle}</p>
        )}
      </div>

      {/* Motif list */}
      <div className="py-1 max-h-56 overflow-y-auto">
        {(motifs || []).map(motif => (
          <button
            key={motif.id}
            onClick={() => onSelect(motif)}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left
                       hover:bg-surface-4 transition-colors group"
          >
            <span
              className="w-2 h-2 rounded-sm shrink-0"
              style={{ backgroundColor: motif.couleur_hex }}
            />
            <span className="text-xs text-ink-1 group-hover:text-white transition-colors flex-1 truncate">
              {motif.libelle}
            </span>
            {entry?.motif === motif.id && (
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Delete action */}
      {entry && canEdit && (
        <>
          <div className="border-t border-surface-5/60" />
          <div className="py-1">
            <button
              onClick={onDelete}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left
                         hover:bg-red-500/10 transition-colors group"
            >
              <TrashIcon className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span className="text-xs text-red-400">Supprimer l'entrée</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function TrashIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
}

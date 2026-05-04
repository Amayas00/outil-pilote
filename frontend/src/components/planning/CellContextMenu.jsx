import { useEffect, useRef } from 'react'

export default function CellContextMenu({ position, entry, motifs, onSelect, onDelete, onClose, canEdit }) {
  const ref = useRef()
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  const style = {
    position: 'fixed',
    top: Math.min(position.y, window.innerHeight - 340),
    left: Math.min(position.x, window.innerWidth - 220),
    zIndex: 1000,
  }

  return (
    <div ref={ref} style={style}
      className="w-52 bg-white border border-slate-200 rounded-lg shadow-md animate-slide-up overflow-hidden">
      <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-25">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Saisir un motif</p>
        {entry && <p className="text-2xs text-slate-400 mt-0.5">Actuel : {entry.motif_libelle}</p>}
      </div>
      <div className="py-1 max-h-60 overflow-y-auto">
        {(motifs||[]).map(motif => (
          <button key={motif.id} onClick={() => onSelect(motif)}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left hover:bg-slate-50 transition-colors group">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: motif.couleur_hex }}/>
            <span className="text-sm text-slate-700 flex-1 truncate">{motif.libelle}</span>
            {entry?.motif === motif.id && (
              <svg className="w-3.5 h-3.5 text-axa shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
            )}
          </button>
        ))}
      </div>
      {entry && canEdit && (
        <>
          <div className="border-t border-slate-100"/>
          <button onClick={onDelete}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-danger-bg transition-colors">
            <svg className="w-4 h-4 text-danger shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
            <span className="text-sm text-danger font-medium">Supprimer l'entrée</span>
          </button>
        </>
      )}
    </div>
  )
}

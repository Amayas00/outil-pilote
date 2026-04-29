import { useRef, useState, useCallback, useMemo } from 'react'
import clsx from 'clsx'
import { format, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getMotifStyle, getCellEntry } from '../../utils/planning'
import Tooltip from '../ui/Tooltip'
import CellContextMenu from './CellContextMenu'
import Skeleton from '../ui/Skeleton'

const COLLAB_W = 200  // px — sticky collaborator column width
const DAY_W    = 52   // px per day (2 half-day cells × 26px)
const HALF_W   = 26   // px per AM/PM cell
const ROW_H    = 32   // px

export default function PlanningGrid({
  weeks, collaborateurs, entryIndex, motifs,
  isLoading, onCellClick, canEdit, holidays = {},
}) {
  const scrollRef   = useRef()
  const [menu, setMenu] = useState(null)   // { position, collabId, iso, demiJournee, entry }
  const [hover, setHover] = useState(null) // "collabId-iso-dj"

  const handleCellClick = useCallback((e, collabId, iso, demiJournee) => {
    if (!canEdit) return
    const entry = getCellEntry(entryIndex, collabId, iso, demiJournee)
    setMenu({
      position: { x: e.clientX + 4, y: e.clientY + 4 },
      collabId, iso, demiJournee, entry,
    })
  }, [entryIndex, canEdit])

  const handleMenuSelect = (motif) => {
    if (!menu) return
    onCellClick({ ...menu, motif })
    setMenu(null)
  }
  const handleMenuDelete = () => {
    if (!menu?.entry) return
    onCellClick({ ...menu, motif: null, delete: true })
    setMenu(null)
  }

  if (isLoading) return <PlanningGridSkeleton />

  const allDays = weeks.flatMap(w => w.days)

  return (
    <div className="relative flex flex-col overflow-hidden rounded-lg border border-surface-5/60 bg-surface-2">
      {/* Scrollable wrapper */}
      <div ref={scrollRef} className="overflow-auto">
        <div style={{ minWidth: COLLAB_W + allDays.length * HALF_W * 2 }}>

          {/* ── HEADER ROW 1 : Week numbers ── */}
          <div className="flex sticky top-0 z-20 bg-surface-0 border-b border-surface-5">
            {/* Corner */}
            <div style={{ width: COLLAB_W, minWidth: COLLAB_W }}
              className="shrink-0 border-r border-surface-5/60 px-3 flex items-center">
              <span className="text-[10px] font-semibold text-ink-4 uppercase tracking-wider">Collaborateur</span>
            </div>
            {/* Week headers */}
            {weeks.map(week => (
              <div key={week.startIso}
                style={{ width: week.days.length * HALF_W * 2 }}
                className="shrink-0 border-r border-surface-5/40 flex items-center justify-center">
                <span className="text-[10px] font-bold text-ink-3 font-mono">
                  S{String(week.weekNum).padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>

          {/* ── HEADER ROW 2 : Day names ── */}
          <div className="flex sticky top-[33px] z-20 bg-surface-0 border-b border-surface-5">
            <div style={{ width: COLLAB_W, minWidth: COLLAB_W }}
              className="shrink-0 border-r border-surface-5/60" />
            {allDays.map(day => (
              <div key={day.iso}
                style={{ width: HALF_W * 2 }}
                className={clsx(
                  'shrink-0 border-r border-surface-5/40',
                  day.isToday && 'bg-brand-600/10'
                )}>
                {/* Day label */}
                <div className="flex flex-col items-center justify-center h-full py-1">
                  <span className={clsx(
                    'text-[9px] font-medium uppercase tracking-wider',
                    day.isToday ? 'text-brand-400' : 'text-ink-4'
                  )}>
                    {day.label}
                  </span>
                  <span className={clsx(
                    'text-[10px] font-bold leading-tight',
                    day.isToday ? 'text-brand-300' : 'text-ink-3'
                  )}>
                    {day.dayNum}
                  </span>
                </div>
                {/* AM/PM sub-labels */}
                <div className="flex border-t border-surface-5/30">
                  {['AM', 'PM'].map(dj => (
                    <div key={dj} style={{ width: HALF_W }}
                      className="flex items-center justify-center py-0.5 border-r border-surface-5/20 last:border-r-0">
                      <span className={clsx(
                        'text-[8px] font-mono font-medium',
                        day.isToday ? 'text-brand-400/70' : 'text-ink-4'
                      )}>
                        {dj}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── DATA ROWS ── */}
          {collaborateurs.length === 0
            ? <EmptyState />
            : collaborateurs.map((collab, rowIdx) => (
              <div key={collab.id}
                style={{ height: ROW_H }}
                className={clsx(
                  'flex border-b border-surface-5/30 hover:bg-surface-3/30 transition-colors',
                  rowIdx % 2 === 0 ? 'bg-surface-2' : 'bg-surface-2/50'
                )}>
                {/* Sticky collaborator cell */}
                <div
                  style={{ width: COLLAB_W, minWidth: COLLAB_W, height: ROW_H }}
                  className="shrink-0 sticky left-0 z-10 flex items-center px-3 gap-2
                             border-r border-surface-5/60 bg-inherit shadow-[1px_0_0_rgba(255,255,255,0.04)]">
                  <div className="w-5 h-5 rounded-full bg-brand-700/60 flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold text-brand-200">
                      {collab.prenom?.[0]}{collab.nom?.[0]}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-ink-1 truncate leading-tight">
                      {collab.nom_complet || `${collab.prenom} ${collab.nom}`}
                    </p>
                    <p className="text-[9px] text-ink-4 truncate leading-tight font-mono">
                      {collab.matricule}
                    </p>
                  </div>
                </div>

                {/* Planning cells */}
                {allDays.map(day => {
                  const isHoliday = holidays[day.iso]
                  return ['AM', 'PM'].map(dj => {
                    const entry  = getCellEntry(entryIndex, collab.id, day.iso, dj)
                    const hKey   = `${collab.id}-${day.iso}-${dj}`
                    const style  = entry ? getMotifStyle(entry.motif_code) : null
                    const isHov  = hover === hKey

                    return (
                      <Tooltip
                        key={`${day.iso}-${dj}`}
                        content={entry
                          ? `${entry.motif_libelle} — ${collab.nom_complet || collab.nom}`
                          : isHoliday
                          ? `🎌 ${isHoliday}`
                          : canEdit ? 'Cliquer pour affecter' : null
                        }
                      >
                        <div
                          style={{ width: HALF_W, height: ROW_H }}
                          className={clsx(
                            'planning-cell',
                            day.isToday && !entry && 'bg-brand-600/5',
                            isHoliday && !entry && 'bg-surface-5/40',
                            entry && `${style.bg} ${style.text} filled`,
                            !canEdit && 'cursor-default',
                          )}
                          onMouseEnter={() => setHover(hKey)}
                          onMouseLeave={() => setHover(null)}
                          onClick={(e) => handleCellClick(e, collab.id, day.iso, dj)}
                        >
                          {entry && (
                            <div className={clsx(
                              'w-full h-full flex items-center justify-center',
                              'transition-opacity duration-100',
                            )}>
                              <span className={clsx(
                                'w-1.5 h-1.5 rounded-full',
                                style.dot,
                                isHov && 'scale-125 transition-transform'
                              )} />
                            </div>
                          )}
                          {isHoliday && !entry && (
                            <span className="text-[8px] text-ink-4 leading-none text-center px-0.5">🎌</span>
                          )}
                        </div>
                      </Tooltip>
                    )
                  })
                })}
              </div>
            ))
          }
        </div>
      </div>

      {/* Context menu */}
      {menu && (
        <CellContextMenu
          position={menu.position}
          entry={menu.entry}
          motifs={motifs}
          canEdit={canEdit}
          onSelect={handleMenuSelect}
          onDelete={handleMenuDelete}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  )
}

function PlanningGridSkeleton() {
  return (
    <div className="rounded-lg border border-surface-5/60 overflow-hidden">
      <div className="bg-surface-0 p-3 border-b border-surface-5">
        <Skeleton className="h-5 w-full" />
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 p-2 border-b border-surface-5/30">
          <Skeleton className="w-32 h-4" />
          <Skeleton className="flex-1 h-4" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-surface-4 flex items-center justify-center mb-3">
        <svg className="w-6 h-6 text-ink-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      </div>
      <p className="text-sm font-medium text-ink-2">Aucun collaborateur trouvé</p>
      <p className="text-xs text-ink-4 mt-1">Modifiez les filtres pour afficher des résultats</p>
    </div>
  )
}

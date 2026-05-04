import { useRef, useState, useCallback } from 'react'
import clsx from 'clsx'
import { isSameDay } from 'date-fns'
import { getMotifStyle, getCellEntry } from '../../utils/planning'
import Tooltip from '../ui/Tooltip'
import CellContextMenu from './CellContextMenu'
import Skeleton from '../ui/Skeleton'

const COLLAB_W = 200
const HALF_W   = 26
const ROW_H    = 32

export default function PlanningGrid({ weeks, collaborateurs, entryIndex, motifs, isLoading, onCellClick, canEdit, holidays = {} }) {
  const [menu, setMenu] = useState(null)

  const handleCellClick = useCallback((e, collabId, iso, demiJournee) => {
    if (!canEdit) return
    const entry = getCellEntry(entryIndex, collabId, iso, demiJournee)
    setMenu({ position: { x: e.clientX + 4, y: e.clientY + 4 }, collabId, iso, demiJournee, entry })
  }, [entryIndex, canEdit])

  const handleMenuSelect = (motif) => { if (menu) onCellClick({ ...menu, motif }); setMenu(null) }
  const handleMenuDelete = () => { if (menu?.entry) onCellClick({ ...menu, motif: null, delete: true }); setMenu(null) }

  if (isLoading) return <GridSkeleton />

  const allDays = weeks.flatMap(w => w.days)

  return (
    <div className="overflow-hidden rounded-lg border border-slate-150 shadow-xs bg-white">
      <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        <div style={{ minWidth: COLLAB_W + allDays.length * HALF_W * 2 }}>

          {/* Row 1: Week numbers */}
          <div className="flex sticky top-0 z-20 bg-white border-b border-slate-150" style={{ height: 28 }}>
            <div style={{ width: COLLAB_W, minWidth: COLLAB_W }}
              className="shrink-0 border-r border-slate-150 flex items-center px-3 bg-slate-25">
              <span className="text-2xs font-semibold text-slate-400 uppercase tracking-widest">Collaborateur</span>
            </div>
            {weeks.map(week => (
              <div key={week.startIso}
                style={{ width: week.days.length * HALF_W * 2 }}
                className="shrink-0 border-r border-slate-100 flex items-center justify-center bg-slate-25">
                <span className="text-2xs font-semibold text-axa font-mono tracking-wide">S{String(week.weekNum).padStart(2,'0')}</span>
              </div>
            ))}
          </div>

          {/* Row 2: Day names + AM/PM */}
          <div className="flex sticky top-[28px] z-20 bg-white border-b border-slate-150" style={{ height: 36 }}>
            <div style={{ width: COLLAB_W, minWidth: COLLAB_W }} className="shrink-0 border-r border-slate-150 bg-slate-25"/>
            {allDays.map(day => (
              <div key={day.iso} style={{ width: HALF_W * 2 }}
                className={clsx('shrink-0 border-r border-slate-100 bg-slate-25', day.isToday && '!bg-blue-50')}>
                <div className="flex flex-col items-center justify-center h-full pt-1 pb-0.5">
                  <span className={clsx('text-2xs font-medium uppercase', day.isToday ? 'text-axa font-semibold' : 'text-slate-400')}>
                    {day.label}
                  </span>
                  <span className={clsx('text-xs font-semibold leading-tight', day.isToday ? 'text-axa' : 'text-slate-600')}>
                    {day.dayNum}
                  </span>
                </div>
                <div className="flex border-t border-slate-100">
                  {['AM','PM'].map(dj => (
                    <div key={dj} style={{ width: HALF_W }}
                      className="flex items-center justify-center border-r border-slate-100 last:border-r-0 pb-0.5">
                      <span className={clsx('text-2xs font-mono font-medium', day.isToday ? 'text-axa/70' : 'text-slate-400')}>{dj}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Data rows */}
          {collaborateurs.length === 0
            ? <EmptyGrid />
            : collaborateurs.map((collab, ri) => (
              <div key={collab.id} style={{ height: ROW_H }}
                className={clsx('flex border-b border-slate-100 last:border-b-0',
                  ri % 2 === 0 ? 'bg-white' : 'bg-slate-25/60',
                  'hover:bg-blue-50/30 transition-colors duration-75'
                )}>
                {/* Sticky name cell */}
                <div style={{ width: COLLAB_W, minWidth: COLLAB_W, height: ROW_H }}
                  className="shrink-0 sticky left-0 z-10 flex items-center px-3 gap-2 border-r border-slate-150 bg-inherit"
                  style={{ boxShadow: '2px 0 4px rgba(0,0,0,0.04)', minWidth: COLLAB_W, width: COLLAB_W, height: ROW_H }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white text-2xs font-bold"
                    style={{ background: '#00008F' }}>
                    {(collab.prenom?.[0]||'?')}{(collab.nom?.[0]||'')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate leading-tight">
                      {collab.nom_complet||`${collab.prenom} ${collab.nom}`}
                    </p>
                    <p className="text-2xs text-slate-400 truncate leading-tight font-mono">{collab.matricule}</p>
                  </div>
                </div>

                {/* Planning cells */}
                {allDays.map(day => {
                  const isHoliday = holidays[day.iso]
                  return ['AM','PM'].map(dj => {
                    const entry = getCellEntry(entryIndex, collab.id, day.iso, dj)
                    const style = entry ? getMotifStyle(entry.motif_code) : null

                    return (
                      <Tooltip key={`${day.iso}-${dj}`}
                        content={entry ? `${entry.motif_libelle} — ${collab.nom_complet||collab.nom}` : isHoliday ? `${isHoliday}` : canEdit ? 'Cliquer pour saisir' : null}>
                        <div
                          style={{ width: HALF_W, height: ROW_H, ...(entry && style?.hexBg ? { background: style.hexBg } : {}) }}
                          className={clsx('cell',
                            day.isToday && !entry && 'today-col',
                            isHoliday && !entry && 'holiday',
                            !canEdit && 'cursor-default',
                          )}
                          onClick={e => handleCellClick(e, collab.id, day.iso, dj)}
                        >
                          {entry && (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="w-2 h-2 rounded-sm" style={{ background: style?.hex || '#00008F' }}/>
                            </div>
                          )}
                          {isHoliday && !entry && (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"/>
                            </div>
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

      {menu && (
        <CellContextMenu
          position={menu.position} entry={menu.entry} motifs={motifs} canEdit={canEdit}
          onSelect={handleMenuSelect} onDelete={handleMenuDelete} onClose={() => setMenu(null)}
        />
      )}
    </div>
  )
}

function GridSkeleton() {
  return (
    <div className="table-wrap">
      <div className="bg-slate-25 border-b border-slate-150 p-3"><Skeleton className="h-3 w-full"/></div>
      {Array.from({length:8}).map((_,i)=>(
        <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <Skeleton className="w-24 h-3"/> <Skeleton className="flex-1 h-3"/>
        </div>
      ))}
    </div>
  )
}

function EmptyGrid() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg>
      </div>
      <p className="text-sm font-semibold text-slate-500">Aucun collaborateur trouvé</p>
      <p className="text-xs text-slate-400">Modifiez les filtres pour afficher des résultats</p>
    </div>
  )
}

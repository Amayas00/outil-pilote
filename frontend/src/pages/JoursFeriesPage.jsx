import { useState, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useJoursFeries, useCreateJourFerie, useUpdateJourFerie, useDeleteJourFerie } from '../hooks/useJoursFeries'
import { useRegions } from '../hooks/useEquipes'
import { format, getYear, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import clsx from 'clsx'

import { Table, Thead, Th, Tbody, Tr, Td, TableSkeleton, TableEmpty } from '../components/ui/Table'
import Modal from '../components/ui/Modal'
import ActionMenu from '../components/ui/ActionMenu'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Select from '../components/ui/Select'
import JourFerieForm from '../components/jours-feries/JourFerieForm'

// ── helpers ───────────────────────────────────────────────────────────────────
function apiError(err) {
  const d = err?.response?.data
  if (!d) return 'Une erreur est survenue'
  if (typeof d === 'string') return d
  const first = Object.values(d)[0]
  return Array.isArray(first) ? first[0] : (first ?? 'Erreur inconnue')
}

function useToast() {
  const [toast, setToast] = useState(null)
  const show = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }
  return { toast, show }
}

const TYPE_STYLE = {
  ferie: { variant: 'danger',  label: 'Férié',  dot: 'bg-red-400'   },
  pont:  { variant: 'warning', label: 'Pont',   dot: 'bg-amber-400' },
}

// Generate year options: current year ± 3
const CURRENT_YEAR = getYear(new Date())
const YEAR_OPTIONS = Array.from({ length: 7 }, (_, i) => CURRENT_YEAR - 2 + i)

// Group jours fériés by month for the calendar view
function groupByMonth(jours) {
  const map = {}
  jours.forEach(j => {
    const month = format(parseISO(j.jour), 'yyyy-MM')
    if (!map[month]) map[month] = []
    map[month].push(j)
  })
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function JoursFeriesPage() {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/" replace />

  const [annee,        setAnnee]        = useState(String(CURRENT_YEAR))
  const [filterType,   setFilterType]   = useState('')
  const [filterRegion, setFilterRegion] = useState('')
  const [viewMode,     setViewMode]     = useState('table')   // 'table' | 'calendar'
  const [modalCreate,  setModalCreate]  = useState(false)
  const [modalEdit,    setModalEdit]    = useState(null)
  const [confirmDel,   setConfirmDel]   = useState(null)
  const { toast, show: showToast } = useToast()

  const params = useMemo(() => ({
    annee,
    ...(filterType   && { type:   filterType   }),
    ...(filterRegion && { region: filterRegion }),
  }), [annee, filterType, filterRegion])

  const { data: jours  = [], isLoading, isError } = useJoursFeries(params)
  const { data: regions = [] } = useRegions()
  const createMut = useCreateJourFerie()
  const updateMut = useUpdateJourFerie()
  const deleteMut = useDeleteJourFerie()

  // Stats
  const stats = useMemo(() => ({
    total:  jours.length,
    feries: jours.filter(j => j.type === 'ferie').length,
    ponts:  jours.filter(j => j.type === 'pont').length,
  }), [jours])

  const handleCreate = async (data) => {
    try {
      await createMut.mutateAsync(data)
      setModalCreate(false)
      showToast('Jour férié créé')
    } catch (err) { showToast(apiError(err), 'error') }
  }

  const handleUpdate = async (data) => {
    try {
      await updateMut.mutateAsync({ id: modalEdit.id, data })
      setModalEdit(null)
      showToast('Jour férié mis à jour')
    } catch (err) { showToast(apiError(err), 'error') }
  }

  const handleDelete = async () => {
    try {
      await deleteMut.mutateAsync(confirmDel.id)
      setConfirmDel(null)
      showToast(`"${confirmDel.libelle}" supprimé`)
    } catch (err) { showToast(apiError(err), 'error') }
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink-1">Jours fériés & Ponts</h2>
          <p className="text-sm text-ink-3 mt-0.5">
            {isLoading ? '…' : `${stats.total} entrée${stats.total !== 1 ? 's' : ''} pour ${annee}`}
          </p>
        </div>
        <Button icon={<PlusIcon />} onClick={() => setModalCreate(true)}>
          Ajouter
        </Button>
      </div>

      {/* ── Stats cards ── */}
      {!isLoading && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total',         value: stats.total,  color: 'text-ink-1',       bg: 'bg-surface-3'        },
            { label: 'Jours fériés',  value: stats.feries, color: 'text-red-300',     bg: 'bg-red-500/10'       },
            { label: 'Ponts',         value: stats.ponts,  color: 'text-amber-300',   bg: 'bg-amber-500/10'     },
          ].map(s => (
            <div key={s.label} className={clsx('rounded-lg p-3 border border-surface-5/60 flex items-center justify-between', s.bg)}>
              <span className="text-xs text-ink-3">{s.label}</span>
              <span className={clsx('text-2xl font-bold font-mono', s.color)}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters & view toggle ── */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={annee} onChange={e => setAnnee(e.target.value)} className="w-28 h-9 text-sm">
          {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
        </Select>

        <Select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-36 h-9 text-sm">
          <option value="">Tous les types</option>
          <option value="ferie">Jours fériés</option>
          <option value="pont">Ponts</option>
        </Select>

        <Select value={filterRegion} onChange={e => setFilterRegion(e.target.value)} className="w-44 h-9 text-sm">
          <option value="">Toutes les régions</option>
          {regions.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
        </Select>

        {(filterType || filterRegion) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterType(''); setFilterRegion('') }}>
            Réinitialiser
          </Button>
        )}

        {/* View toggle */}
        <div className="ml-auto flex items-center gap-1 bg-surface-3 border border-surface-5/60 rounded-md p-0.5">
          {[
            { key: 'table',    icon: <TableIcon />    },
            { key: 'calendar', icon: <CalendarIcon /> },
          ].map(v => (
            <button
              key={v.key}
              onClick={() => setViewMode(v.key)}
              className={clsx(
                'p-1.5 rounded transition-all duration-150',
                viewMode === v.key
                  ? 'bg-surface-0 text-ink-1 shadow-card'
                  : 'text-ink-4 hover:text-ink-2'
              )}
            >
              {v.icon}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <TableSkeleton cols={5} rows={6} />
      ) : isError ? (
        <ErrorState />
      ) : jours.length === 0 ? (
        <TableEmpty
          message={`Aucun jour férié pour ${annee}`}
          hint="Cliquez sur « Ajouter » pour en créer un"
          icon={<CalendarIconLg />}
        />
      ) : viewMode === 'table' ? (
        <TableView jours={jours} onEdit={setModalEdit} onDelete={setConfirmDel} />
      ) : (
        <CalendarView jours={jours} onEdit={setModalEdit} onDelete={setConfirmDel} />
      )}

      {/* ── Create modal ── */}
      <Modal
        open={modalCreate}
        onClose={() => setModalCreate(false)}
        title="Ajouter un jour férié"
        subtitle="Férié national ou pont régional"
        size="md"
      >
        <JourFerieForm
          onSubmit={handleCreate}
          onCancel={() => setModalCreate(false)}
          loading={createMut.isPending}
        />
      </Modal>

      {/* ── Edit modal ── */}
      <Modal
        open={!!modalEdit}
        onClose={() => setModalEdit(null)}
        title="Modifier"
        subtitle={modalEdit?.libelle}
        size="md"
      >
        {modalEdit && (
          <JourFerieForm
            initial={modalEdit}
            onSubmit={handleUpdate}
            onCancel={() => setModalEdit(null)}
            loading={updateMut.isPending}
          />
        )}
      </Modal>

      {/* ── Delete confirm ── */}
      <ConfirmDialog
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        onConfirm={handleDelete}
        loading={deleteMut.isPending}
        title="Supprimer ce jour"
        message={confirmDel
          ? `Supprimer définitivement "${confirmDel.libelle}" du ${confirmDel.jour ? format(parseISO(confirmDel.jour), 'dd MMMM yyyy', { locale: fr }) : ''} ?`
          : ''}
        confirmLabel="Supprimer"
        danger
      />

      {/* ── Toast ── */}
      {toast && (
        <div className={clsx(
          'fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3',
          'rounded-lg border shadow-card-lg animate-slide-up text-sm',
          toast.type === 'success'
            ? 'bg-surface-2 border-green-500/30 text-green-300'
            : 'bg-surface-2 border-red-500/30 text-red-300'
        )}>
          <span className={clsx('w-2 h-2 rounded-full', toast.type === 'success' ? 'bg-green-400' : 'bg-red-400')} />
          {toast.message}
        </div>
      )}
    </div>
  )
}

// ── Table view ────────────────────────────────────────────────────────────────
function TableView({ jours, onEdit, onDelete }) {
  return (
    <Table>
      <Thead>
        <Th>Date</Th>
        <Th>Libellé</Th>
        <Th>Type</Th>
        <Th>Régions</Th>
        <Th className="w-12" />
      </Thead>
      <Tbody>
        {jours.map(j => {
          const ts = TYPE_STYLE[j.type] ?? TYPE_STYLE.ferie
          return (
            <Tr key={j.id}>
              <Td>
                <div className="flex flex-col">
                  <span className="font-mono text-sm font-medium text-ink-1">
                    {format(parseISO(j.jour), 'dd MMM yyyy', { locale: fr })}
                  </span>
                  <span className="text-[10px] text-ink-4 font-mono">
                    {format(parseISO(j.jour), 'EEEE', { locale: fr })}
                  </span>
                </div>
              </Td>
              <Td>
                <span className="font-medium text-ink-1">{j.libelle}</span>
              </Td>
              <Td>
                <Badge variant={ts.variant} dot={ts.dot}>{ts.label}</Badge>
              </Td>
              <Td>
                {j.toutes_regions
                  ? <span className="text-xs text-ink-3 italic">Toutes les régions</span>
                  : (
                    <div className="flex flex-wrap gap-1">
                      {(j.regions_noms ?? []).map(nom => (
                        <span key={nom} className="px-1.5 py-0.5 bg-surface-4 rounded text-xs text-ink-2">{nom}</span>
                      ))}
                    </div>
                  )
                }
              </Td>
              <Td>
                <ActionMenu
                  items={[
                    { label: 'Modifier',   icon: <EditIcon />,  onClick: () => onEdit(j)   },
                    'divider',
                    { label: 'Supprimer',  icon: <TrashIcon />, danger: true, onClick: () => onDelete(j) },
                  ]}
                />
              </Td>
            </Tr>
          )
        })}
      </Tbody>
    </Table>
  )
}

// ── Calendar view ─────────────────────────────────────────────────────────────
function CalendarView({ jours, onEdit, onDelete }) {
  const groups = groupByMonth(jours)

  return (
    <div className="space-y-4">
      {groups.map(([month, items]) => (
        <div key={month} className="bg-surface-2 border border-surface-5/60 rounded-lg overflow-hidden">
          {/* Month header */}
          <div className="px-4 py-2.5 bg-surface-0 border-b border-surface-5/60 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink-1 capitalize">
              {format(parseISO(month + '-01'), 'MMMM yyyy', { locale: fr })}
            </span>
            <Badge variant="default">{items.length} jour{items.length > 1 ? 's' : ''}</Badge>
          </div>

          {/* Days in month */}
          <div className="divide-y divide-surface-5/30">
            {items.map(j => {
              const ts = TYPE_STYLE[j.type] ?? TYPE_STYLE.ferie
              return (
                <div key={j.id}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-surface-3 transition-colors group">

                  {/* Day number bubble */}
                  <div className={clsx(
                    'w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0 border',
                    j.type === 'ferie'
                      ? 'bg-red-500/10 border-red-500/20'
                      : 'bg-amber-500/10 border-amber-500/20'
                  )}>
                    <span className={clsx('text-lg font-bold leading-none font-mono',
                      j.type === 'ferie' ? 'text-red-300' : 'text-amber-300'
                    )}>
                      {format(parseISO(j.jour), 'd')}
                    </span>
                    <span className={clsx('text-[9px] uppercase font-medium',
                      j.type === 'ferie' ? 'text-red-400/70' : 'text-amber-400/70'
                    )}>
                      {format(parseISO(j.jour), 'EEE', { locale: fr })}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-1">{j.libelle}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant={ts.variant} dot={ts.dot} className="text-[10px]">{ts.label}</Badge>
                      <span className="text-[10px] text-ink-4">
                        {j.toutes_regions ? 'Toutes les régions' : (j.regions_noms ?? []).join(', ')}
                      </span>
                    </div>
                  </div>

                  {/* Actions — show on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      onClick={() => onEdit(j)}
                      className="p-1.5 rounded-md text-ink-3 hover:text-ink-1 hover:bg-surface-4 transition-colors"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => onDelete(j)}
                      className="p-1.5 rounded-md text-ink-3 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────
function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 bg-surface-2 border border-surface-5/60 rounded-lg">
      <p className="text-sm font-medium text-ink-2">Erreur de chargement</p>
      <p className="text-xs text-ink-4">Vérifiez que le backend est démarré</p>
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function PlusIcon()       { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg> }
function EditIcon()       { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg> }
function TrashIcon()      { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg> }
function TableIcon()      { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m13.5-9.75h-4.5" /></svg> }
function CalendarIcon()   { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg> }
function CalendarIconLg() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H18v-.008zm0 2.25h.008v.008H18V15z" /></svg> }

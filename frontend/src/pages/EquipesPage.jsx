import { useState, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEquipes, useRegions, useDomaines, useCreateEquipe, useUpdateEquipe, useDeactivateEquipe } from '../hooks/useEquipes'
import { useCollaborateurs } from '../hooks/useCollaborateurs'
import clsx from 'clsx'

import { Table, Thead, Th, Tbody, Tr, Td, TableSkeleton, TableEmpty } from '../components/ui/Table'
import Modal from '../components/ui/Modal'
import ActionMenu from '../components/ui/ActionMenu'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Select from '../components/ui/Select'
import SearchInput from '../components/ui/SearchInput'
import EquipeForm from '../components/equipes/EquipeForm'

const DOMAINE_COLORS = {
  automobile:  { bg: 'bg-blue-500/15',   text: 'text-blue-300'   },
  construction:{ bg: 'bg-amber-500/15',  text: 'text-amber-300'  },
  rc:          { bg: 'bg-purple-500/15', text: 'text-purple-300' },
  dommages:    { bg: 'bg-red-500/15',    text: 'text-red-300'    },
  immeuble:    { bg: 'bg-green-500/15',  text: 'text-green-300'  },
}

function useToast() {
  const [toast, setToast] = useState(null)
  const show = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 3500) }
  return { toast, show }
}

function apiError(err) {
  const d = err?.response?.data
  if (!d) return 'Une erreur est survenue'
  if (typeof d === 'string') return d
  const first = Object.values(d)[0]
  return Array.isArray(first) ? first[0] : (first ?? 'Erreur inconnue')
}

export default function EquipesPage() {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/" replace />

  const [search,        setSearch]        = useState('')
  const [filterRegion,  setFilterRegion]  = useState('')
  const [filterDomaine, setFilterDomaine] = useState('')
  const [filterActive,  setFilterActive]  = useState('true')
  const [modalCreate,   setModalCreate]   = useState(false)
  const [modalEdit,     setModalEdit]     = useState(null)
  const [confirmDeact,  setConfirmDeact]  = useState(null)
  const [detailEquipe,  setDetailEquipe]  = useState(null)
  const { toast, show: showToast } = useToast()

  const params = useMemo(() => ({
    ...(filterRegion  && { region:  filterRegion  }),
    ...(filterDomaine && { domaine: filterDomaine }),
    ...(filterActive !== 'all' && { active: filterActive }),
  }), [filterRegion, filterDomaine, filterActive])

  const { data: equipes  = [], isLoading, isError } = useEquipes(params)
  const { data: regions  = [] } = useRegions()
  const { data: domaines = [] } = useDomaines()
  const { data: collabs  = [] } = useCollaborateurs({ actif: true })

  const createMut   = useCreateEquipe()
  const updateMut   = useUpdateEquipe()
  const deactMut    = useDeactivateEquipe()

  // Count collabs per equipe
  const collabCount = useMemo(() => {
    const map = {}
    collabs.forEach(c => { if (c.equipe) map[c.equipe] = (map[c.equipe] || 0) + 1 })
    return map
  }, [collabs])

  const filtered = useMemo(() => {
    if (!search.trim()) return equipes
    const q = search.toLowerCase()
    return equipes.filter(e =>
      e.nom?.toLowerCase().includes(q) ||
      e.region_nom?.toLowerCase().includes(q) ||
      e.domaine_nom?.toLowerCase().includes(q)
    )
  }, [equipes, search])

  const handleCreate = async (data) => {
    try {
      await createMut.mutateAsync(data)
      setModalCreate(false)
      showToast('Équipe créée avec succès')
    } catch (err) { showToast(apiError(err), 'error') }
  }

  const handleUpdate = async (data) => {
    try {
      await updateMut.mutateAsync({ id: modalEdit.id, data })
      setModalEdit(null)
      showToast('Équipe mise à jour')
    } catch (err) { showToast(apiError(err), 'error') }
  }

  const handleDeactivate = async () => {
    try {
      await deactMut.mutateAsync(confirmDeact.id)
      setConfirmDeact(null)
      showToast(`Équipe "${confirmDeact.nom}" désactivée`)
    } catch (err) { showToast(apiError(err), 'error') }
  }

  const handleReactivate = async (equipe) => {
    try {
      await updateMut.mutateAsync({ id: equipe.id, data: { active: true } })
      showToast(`Équipe "${equipe.nom}" réactivée`)
    } catch (err) { showToast(apiError(err), 'error') }
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink-1">Équipes</h2>
          <p className="text-sm text-ink-3 mt-0.5">
            {isLoading ? '…' : `${filtered.length} équipe${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button icon={<PlusIcon />} onClick={() => setModalCreate(true)}>
          Nouvelle équipe
        </Button>
      </div>

      {/* Summary cards */}
      {!isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Équipes actives',   value: equipes.filter(e => e.active).length,    color: 'text-green-300'  },
            { label: 'Équipes inactives', value: equipes.filter(e => !e.active).length,   color: 'text-ink-3'      },
            { label: 'Régions',           value: regions.length,                           color: 'text-brand-300'  },
            { label: 'Domaines',          value: domaines.length,                          color: 'text-amber-300'  },
          ].map(s => (
            <div key={s.label} className="bg-surface-2 border border-surface-5/60 rounded-lg p-3 flex items-center justify-between">
              <span className="text-xs text-ink-3">{s.label}</span>
              <span className={clsx('text-xl font-bold font-mono', s.color)}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Nom, région, domaine…" className="w-60" />
        <Select value={filterActive} onChange={e => setFilterActive(e.target.value)} className="w-32 h-9 text-sm">
          <option value="true">Actives</option>
          <option value="false">Inactives</option>
          <option value="all">Toutes</option>
        </Select>
        <Select value={filterRegion} onChange={e => setFilterRegion(e.target.value)} className="w-44 h-9 text-sm">
          <option value="">Toutes les régions</option>
          {regions.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
        </Select>
        <Select value={filterDomaine} onChange={e => setFilterDomaine(e.target.value)} className="w-44 h-9 text-sm">
          <option value="">Tous les domaines</option>
          {domaines.map(d => <option key={d.id} value={d.id}>{d.nom_display}</option>)}
        </Select>
        {(search || filterRegion || filterDomaine || filterActive !== 'true') && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setFilterRegion(''); setFilterDomaine(''); setFilterActive('true') }}>
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton cols={5} rows={6} />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 bg-surface-2 border border-surface-5/60 rounded-lg">
          <p className="text-sm text-ink-2">Erreur de chargement — vérifiez que le backend est démarré</p>
        </div>
      ) : filtered.length === 0 ? (
        <TableEmpty message="Aucune équipe trouvée" hint="Créez une première équipe pour commencer" icon={<GridIcon />} />
      ) : (
        <Table>
          <Thead>
            <Th>Équipe</Th>
            <Th>Région</Th>
            <Th>Domaine</Th>
            <Th>Collaborateurs</Th>
            <Th>Statut</Th>
            <Th className="w-12" />
          </Thead>
          <Tbody>
            {filtered.map(equipe => {
              const dc = DOMAINE_COLORS[equipe.domaine_nom?.toLowerCase()] || DOMAINE_COLORS.rc
              const nb = collabCount[equipe.id] || 0
              return (
                <Tr key={equipe.id} onClick={() => setDetailEquipe(equipe)} className="cursor-pointer">
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <div className={clsx('w-7 h-7 rounded-md flex items-center justify-center shrink-0', dc.bg)}>
                        <GridIcon className={clsx('w-3.5 h-3.5', dc.text)} />
                      </div>
                      <span className="font-medium text-ink-1">{equipe.nom}</span>
                    </div>
                  </Td>
                  <Td muted>{equipe.region_nom}</Td>
                  <Td>
                    <span className={clsx('badge', dc.bg, dc.text)}>
                      {equipe.domaine_nom}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-mono font-medium text-ink-1">{nb}</span>
                      <span className="text-xs text-ink-4">collab.</span>
                      {nb > 0 && (
                        <div className="flex -space-x-1 ml-1">
                          {Array.from({ length: Math.min(nb, 3) }).map((_, i) => (
                            <div key={i} className="w-5 h-5 rounded-full bg-brand-700/60 border border-surface-2 flex items-center justify-center">
                              <span className="text-[7px] font-bold text-brand-200">{i+1}</span>
                            </div>
                          ))}
                          {nb > 3 && <div className="w-5 h-5 rounded-full bg-surface-4 border border-surface-2 flex items-center justify-center text-[8px] text-ink-3">+{nb-3}</div>}
                        </div>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <Badge variant={equipe.active ? 'success' : 'default'} dot={equipe.active ? 'bg-green-400' : 'bg-ink-4'}>
                      {equipe.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td>
                    <ActionMenu
                      items={[
                        { label: 'Modifier', icon: <EditIcon />, onClick: (e) => { setModalEdit(equipe) } },
                        'divider',
                        equipe.active
                          ? { label: 'Désactiver', icon: <BanIcon />, danger: true, onClick: () => setConfirmDeact(equipe) }
                          : { label: 'Réactiver', icon: <CheckIcon />, onClick: () => handleReactivate(equipe) },
                      ]}
                    />
                  </Td>
                </Tr>
              )
            })}
          </Tbody>
        </Table>
      )}

      {/* Detail side panel */}
      <Modal
        open={!!detailEquipe && !modalEdit}
        onClose={() => setDetailEquipe(null)}
        title={detailEquipe?.nom ?? ''}
        subtitle={`${detailEquipe?.region_nom} · ${detailEquipe?.domaine_nom}`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDetailEquipe(null)}>Fermer</Button>
            <Button variant="secondary" onClick={() => { setModalEdit(detailEquipe); setDetailEquipe(null) }} icon={<EditIcon />}>
              Modifier
            </Button>
          </>
        }
      >
        {detailEquipe && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <InfoItem label="Région"   value={detailEquipe.region_nom} />
              <InfoItem label="Domaine"  value={detailEquipe.domaine_nom} />
              <InfoItem label="Statut"   value={detailEquipe.active ? 'Active' : 'Inactive'} />
              <InfoItem label="Membres"  value={`${collabCount[detailEquipe.id] || 0} collaborateur(s)`} />
            </div>
            <div className="pt-2 border-t border-surface-5/60">
              <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-3">Collaborateurs actifs</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {collabs.filter(c => c.equipe === detailEquipe.id).length === 0
                  ? <p className="text-xs text-ink-4 text-center py-4">Aucun collaborateur actif</p>
                  : collabs.filter(c => c.equipe === detailEquipe.id).map(c => (
                    <div key={c.id} className="flex items-center gap-2 py-1">
                      <div className="w-6 h-6 rounded-full bg-brand-700/50 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-brand-200">{c.prenom?.[0]}{c.nom?.[0]}</span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-ink-1">{c.prenom} {c.nom}</p>
                        <p className="text-[10px] text-ink-4 font-mono">{c.matricule}</p>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create modal */}
      <Modal open={modalCreate} onClose={() => setModalCreate(false)} title="Nouvelle équipe" size="md">
        <EquipeForm onSubmit={handleCreate} onCancel={() => setModalCreate(false)} loading={createMut.isPending} />
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!modalEdit}
        onClose={() => setModalEdit(null)}
        title="Modifier l'équipe"
        subtitle={modalEdit?.nom}
        size="md"
      >
        {modalEdit && (
          <EquipeForm initial={modalEdit} onSubmit={handleUpdate} onCancel={() => setModalEdit(null)} loading={updateMut.isPending} />
        )}
      </Modal>

      {/* Deactivate confirm */}
      <ConfirmDialog
        open={!!confirmDeact}
        onClose={() => setConfirmDeact(null)}
        onConfirm={handleDeactivate}
        loading={deactMut.isPending}
        title="Désactiver l'équipe"
        message={confirmDeact ? `Désactiver "${confirmDeact.nom}" ? Les collaborateurs resteront assignés mais l'équipe n'apparaîtra plus dans les filtres.` : ''}
        confirmLabel="Désactiver"
        danger
      />

      {/* Toast */}
      {toast && (
        <div className={clsx(
          'fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3',
          'rounded-lg border shadow-card-lg animate-slide-up text-sm',
          toast.type === 'success' ? 'bg-surface-2 border-green-500/30 text-green-300' : 'bg-surface-2 border-red-500/30 text-red-300'
        )}>
          <span className={clsx('w-2 h-2 rounded-full', toast.type === 'success' ? 'bg-green-400' : 'bg-red-400')} />
          {toast.message}
        </div>
      )}
    </div>
  )
}

function InfoItem({ label, value }) {
  return (
    <div className="bg-surface-3 rounded-md p-3">
      <p className="text-[10px] text-ink-4 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-medium text-ink-1">{value}</p>
    </div>
  )
}

function PlusIcon()  { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg> }
function GridIcon({ className }) { return <svg className={className ?? "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg> }
function EditIcon()  { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg> }
function BanIcon()   { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg> }
function CheckIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }

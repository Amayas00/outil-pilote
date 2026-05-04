import { useState, useMemo } from 'react'
import { useCollaborateurs, useCreateCollaborateur, useUpdateCollaborateur } from '../hooks/useCollaborateurs'
import { useEquipes, useRegions } from '../hooks/useEquipes'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import clsx from 'clsx'

import { Table, Thead, Th, Tbody, Tr, Td, TableSkeleton, TableEmpty } from '../components/ui/Table'
import Modal from '../components/ui/Modal'
import ActionMenu from '../components/ui/ActionMenu'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Select from '../components/ui/Select'
import SearchInput from '../components/ui/SearchInput'
import CollaborateurForm from '../components/collaborateurs/CollaborateurForm'

const ROLE_VARIANT = { admin: 'brand', manager: 'info', collaborateur: 'default' }

function useToast() {
  const [toast, setToast] = useState(null)
  const show = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }
  return { toast, show }
}

export default function CollaborateursPage() {
  const { isManager } = useAuth()
  if (!isManager) return <Navigate to="/" replace />

  const [search,       setSearch]       = useState('')
  const [filterActif,  setFilterActif]  = useState('true')
  const [filterEquipe, setFilterEquipe] = useState('')
  const [filterRegion, setFilterRegion] = useState('')
  const [modalCreate,  setModalCreate]  = useState(false)
  const [modalEdit,    setModalEdit]    = useState(null)   // collab object
  const [confirmDeact, setConfirmDeact] = useState(null)   // collab object
  const { toast, show: showToast }      = useToast()

  // API params
  const params = useMemo(() => ({
    ...(filterActif  !== 'all'  && { actif:  filterActif }),
    ...(filterEquipe             && { equipe: filterEquipe }),
    ...(filterRegion             && { equipe__region: filterRegion }),
  }), [filterActif, filterEquipe, filterRegion])

  const { data: collabs = [], isLoading, isError } = useCollaborateurs(params)
  const { data: equipes  = [] } = useEquipes({ active: true })
  const { data: regions  = [] } = useRegions()
  const createMut  = useCreateCollaborateur()
  const updateMut  = useUpdateCollaborateur()

  // Client-side search
  const filtered = useMemo(() => {
    if (!search.trim()) return collabs
    const q = search.toLowerCase()
    return collabs.filter(c =>
      c.nom?.toLowerCase().includes(q) ||
      c.prenom?.toLowerCase().includes(q) ||
      c.matricule?.toLowerCase().includes(q) ||
      c.equipe_nom?.toLowerCase().includes(q)
    )
  }, [collabs, search])

  const handleCreate = async (data) => {
    try {
      await createMut.mutateAsync(data)
      setModalCreate(false)
      showToast('Collaborateur créé avec succès')
    } catch (err) {
      showToast(apiError(err), 'error')
    }
  }

  const handleUpdate = async (data) => {
    try {
      await updateMut.mutateAsync({ id: modalEdit.id, data })
      setModalEdit(null)
      showToast('Collaborateur mis à jour')
    } catch (err) {
      showToast(apiError(err), 'error')
    }
  }

  const handleDeactivate = async () => {
    try {
      await updateMut.mutateAsync({ id: confirmDeact.id, data: { actif: false, date_sortie: format(new Date(), 'yyyy-MM-dd') } })
      setConfirmDeact(null)
      showToast(`${confirmDeact.nom_complet} désactivé`)
    } catch (err) {
      showToast(apiError(err), 'error')
    }
  }

  const handleReactivate = async (collab) => {
    try {
      await updateMut.mutateAsync({ id: collab.id, data: { actif: true, date_sortie: null } })
      showToast(`${collab.nom_complet} réactivé`)
    } catch (err) {
      showToast(apiError(err), 'error')
    }
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Page header */}
      <div className="page-head">
        <div>
          <h2 className="page-title">Collaborateurs</h2>
          <p className="page-sub">
            {isLoading ? '…' : `${filtered.length} résultat${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button icon={<PlusIcon />} onClick={() => setModalCreate(true)}>
          Nouveau collaborateur
        </Button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Nom, prénom, matricule…"
          className="w-64"
        />
        <Select value={filterActif} onChange={e => setFilterActif(e.target.value)} className="w-36 h-9 text-sm">
          <option value="true">Actifs</option>
          <option value="false">Inactifs</option>
          <option value="all">Tous</option>
        </Select>
        <Select value={filterRegion} onChange={e => { setFilterRegion(e.target.value); setFilterEquipe('') }} className="w-44 h-9 text-sm">
          <option value="">Toutes les régions</option>
          {regions.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
        </Select>
        <Select value={filterEquipe} onChange={e => setFilterEquipe(e.target.value)} className="w-52 h-9 text-sm">
          <option value="">Toutes les équipes</option>
          {equipes
            .filter(e => !filterRegion || String(e.region) === String(filterRegion))
            .map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
        </Select>
        {(search || filterEquipe || filterRegion || filterActif !== 'true') && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setFilterActif('true'); setFilterEquipe(''); setFilterRegion('') }}>
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton cols={6} rows={8} />
      ) : isError ? (
        <ErrorState onRetry={() => {}} />
      ) : filtered.length === 0 ? (
        <TableEmpty
          message="Aucun collaborateur trouvé"
          hint="Modifiez les filtres ou créez un nouveau collaborateur"
          icon={<PersonIcon />}
        />
      ) : (
        <Table>
          <Thead>
            <Th className="w-24">Matricule</Th>
            <Th>Nom complet</Th>
            <Th>Équipe</Th>
            <Th>Région</Th>
            <Th>Date d'entrée</Th>
            <Th>Statut</Th>
            <Th className="w-12" />
          </Thead>
          <Tbody>
            {filtered.map(c => (
              <Tr key={c.id}>
                <Td>
                  <span className="font-mono text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {c.matricule}
                  </span>
                </Td>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-axa-dark/50 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-white">
                        {c.prenom?.[0]}{c.nom?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {c.prenom} {c.nom}
                      </p>
                      {c.user_email && (
                        <p className="text-xs text-slate-300">{c.user_email}</p>
                      )}
                    </div>
                  </div>
                </Td>
                <Td muted>{c.equipe_nom || '—'}</Td>
                <Td muted>{c.region_nom || '—'}</Td>
                <Td muted>
                  {c.date_entree ? format(new Date(c.date_entree), 'dd MMM yyyy', { locale: fr }) : '—'}
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <Badge variant={c.actif ? 'success' : 'default'} dot={c.actif ? 'bg-green-400' : 'bg-ink-4'}>
                      {c.actif ? 'Actif' : 'Inactif'}
                    </Badge>
                    {c.role && c.role !== 'collaborateur' && (
                      <Badge variant={ROLE_VARIANT[c.role] ?? 'default'}>
                        {c.role}
                      </Badge>
                    )}
                  </div>
                </Td>
                <Td>
                  <ActionMenu
                    items={[
                      {
                        label: 'Modifier',
                        icon: <EditIcon />,
                        onClick: () => setModalEdit(c),
                      },
                      'divider',
                      c.actif
                        ? {
                            label: 'Désactiver',
                            icon: <BanIcon />,
                            danger: true,
                            onClick: () => setConfirmDeact(c),
                          }
                        : {
                            label: 'Réactiver',
                            icon: <CheckIcon />,
                            onClick: () => handleReactivate(c),
                          },
                    ]}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      {/* Create modal */}
      <Modal
        open={modalCreate}
        onClose={() => setModalCreate(false)}
        title="Nouveau collaborateur"
        subtitle="Remplissez les informations du nouveau membre"
        size="lg"
      >
        <CollaborateurForm
          onSubmit={handleCreate}
          onCancel={() => setModalCreate(false)}
          loading={createMut.isPending}
        />
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!modalEdit}
        onClose={() => setModalEdit(null)}
        title="Modifier le collaborateur"
        subtitle={modalEdit ? `${modalEdit.prenom} ${modalEdit.nom} · ${modalEdit.matricule}` : ''}
        size="lg"
      >
        {modalEdit && (
          <CollaborateurForm
            initial={modalEdit}
            onSubmit={handleUpdate}
            onCancel={() => setModalEdit(null)}
            loading={updateMut.isPending}
          />
        )}
      </Modal>

      {/* Deactivate confirm */}
      <ConfirmDialog
        open={!!confirmDeact}
        onClose={() => setConfirmDeact(null)}
        onConfirm={handleDeactivate}
        loading={updateMut.isPending}
        title="Désactiver le collaborateur"
        message={confirmDeact
          ? `Voulez-vous désactiver ${confirmDeact.prenom} ${confirmDeact.nom} ? Cette action est réversible.`
          : ''}
        confirmLabel="Désactiver"
        danger
      />

      {/* Toast */}
      {toast && (
        <div className={clsx(
          'fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3',
          'rounded-lg border shadow-lg animate-slide-up text-sm',
          toast.type === 'success'
            ? 'bg-white border-success-border text-success shadow-md font-medium'
            : 'bg-white border-danger-border text-danger shadow-md font-medium'
        )}>
          <span className={clsx('w-2 h-2 rounded-full', toast.type === 'success' ? 'bg-success' : 'bg-danger')} />
          {toast.message}
        </div>
      )}
    </div>
  )
}

function apiError(err) {
  const d = err?.response?.data
  if (!d) return 'Une erreur est survenue'
  if (typeof d === 'string') return d
  const first = Object.values(d)[0]
  return Array.isArray(first) ? first[0] : (first ?? 'Erreur inconnue')
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white border border-slate-200/60 rounded-lg">
      <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-slate-600">Erreur de chargement</p>
      <p className="text-xs text-slate-300">Vérifiez que le backend est démarré</p>
    </div>
  )
}

function PlusIcon()   { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg> }
function PersonIcon() { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg> }
function EditIcon()   { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg> }
function BanIcon()    { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg> }
function CheckIcon()  { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }

import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, startOfWeek, addWeeks, subWeeks } from 'date-fns'
import { planningService, teamsService, calendarService } from '../services/api'
import { buildWeekRange, indexEntries } from '../utils/planning'
import { useAuth } from '../context/AuthContext'
import PlanningGrid from '../components/planning/PlanningGrid'
import PlanningFilters from '../components/planning/PlanningFilters'
import PlanningLegend from '../components/planning/PlanningLegend'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'

const DEFAULT_FILTERS = {
  region: '',
  equipe: '',
  startDate: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
  nbWeeks: 8,
}

export default function PlanningPage() {
  const { isManager, user } = useAuth()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [showFilters, setShowFilters] = useState(true)
  const [notification, setNotification] = useState(null)

  // Computed date range from filters
  const dateDebut = filters.startDate
  const dateFin   = format(
    addWeeks(new Date(filters.startDate), filters.nbWeeks),
    'yyyy-MM-dd'
  )

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: motifs } = useQuery({
    queryKey: ['motifs'],
    queryFn: () => planningService.getMotifs().then(r => r.data?.results ?? r.data),
    staleTime: Infinity,
  })

  const collabParams = useMemo(() => ({
    actif: true,
    ...(filters.region && { equipe__region: filters.region }),
    ...(filters.equipe && { equipe: filters.equipe }),
  }), [filters.region, filters.equipe])

  const { data: collabData, isLoading: loadingCollabs } = useQuery({
    queryKey: ['collaborateurs', collabParams],
    queryFn: () => teamsService.getCollabs(collabParams).then(r => r.data?.results ?? r.data ?? []),
  })

  const planningParams = useMemo(() => ({
    date_debut: dateDebut,
    date_fin:   dateFin,
    ...(filters.region && { region: filters.region }),
    ...(filters.equipe && { equipe: filters.equipe }),
  }), [dateDebut, dateFin, filters.region, filters.equipe])

  const { data: entries, isLoading: loadingEntries } = useQuery({
    queryKey: ['planning', planningParams],
    queryFn: () => planningService.getEntries(planningParams).then(r => r.data?.results ?? r.data ?? []),
  })

  const { data: joursFeries } = useQuery({
    queryKey: ['jours-feries', { annee: new Date(dateDebut).getFullYear() }],
    queryFn: () => calendarService.getJoursFeries({
      annee: new Date(dateDebut).getFullYear(),
      ...(filters.region && { region: filters.region }),
    }).then(r => {
      // Index by date → label
      const idx = {}
      const list = r.data?.results ?? r.data ?? []
      list.forEach(jf => { idx[jf.jour] = jf.libelle })
      return idx
    }),
  })

  // ── Derived data ──────────────────────────────────────────────────────────
  const weeks         = useMemo(() => buildWeekRange(new Date(dateDebut), filters.nbWeeks), [dateDebut, filters.nbWeeks])
  const collaborateurs = collabData ?? []
  const entryIndex    = useMemo(() => indexEntries(entries ?? []), [entries])

  // Visible motifs depend on role
  const visibleMotifs = useMemo(() =>
    (motifs ?? []).filter(m => isManager || m.visible_collaborateur),
    [motifs, isManager]
  )

  // ── Mutation ──────────────────────────────────────────────────────────────
  const upsertMutation = useMutation({
    mutationFn: (payload) => {
      if (payload.delete) return planningService.deleteEntry(payload.entry.id)
      return planningService.upsertEntry({
        collaborateur: payload.collabId,
        jour:          payload.iso,
        demi_journee:  payload.demiJournee,
        motif:         payload.motif.id,
      })
    },
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ queryKey: ['planning'] })
      notify(payload.delete ? 'Entrée supprimée' : `Motif "${payload.motif?.libelle}" appliqué`, 'success')
    },
    onError: (err) => {
      const msg = err.response?.data?.non_field_errors?.[0]
              || err.response?.data?.detail
              || 'Erreur lors de la modification'
      notify(msg, 'error')
    },
  })

  const handleCellClick = useCallback((payload) => {
    upsertMutation.mutate(payload)
  }, [upsertMutation])

  const notify = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleFilterChange = (patch) => setFilters(prev => ({ ...prev, ...patch }))
  const handleFilterReset  = () => setFilters(DEFAULT_FILTERS)

  const goToPrev = () => {
    setFilters(prev => ({
      ...prev,
      startDate: format(subWeeks(new Date(prev.startDate), prev.nbWeeks), 'yyyy-MM-dd')
    }))
  }
  const goToNext = () => {
    setFilters(prev => ({
      ...prev,
      startDate: format(addWeeks(new Date(prev.startDate), prev.nbWeeks), 'yyyy-MM-dd')
    }))
  }
  const goToToday = () => {
    setFilters(prev => ({
      ...prev,
      startDate: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    }))
  }

  const isLoading = loadingCollabs || loadingEntries

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header bar */}
      <div className="px-6 py-4 border-b border-slate-200/60 bg-white shrink-0">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-slate-900">Planning</h2>
            <Badge variant="outline" className="font-mono text-2xs">
              {filters.nbWeeks} sem · {collaborateurs.length} collab.
            </Badge>
            {upsertMutation.isPending && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-3 h-3 border border-axa border-t-transparent rounded-full animate-spin" />
                Sauvegarde…
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost" size="sm"
              onClick={() => setShowFilters(v => !v)}
              icon={<FilterIcon />}
            >
              {showFilters ? 'Masquer filtres' : 'Filtres'}
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="animate-slide-up">
            <PlanningFilters
              filters={filters}
              onChange={handleFilterChange}
              onReset={handleFilterReset}
            />
          </div>
        )}
      </div>

      {/* Grid area */}
      <div className="flex-1 overflow-hidden px-6 py-4 flex flex-col gap-3">
        <PlanningGrid
          weeks={weeks}
          collaborateurs={collaborateurs}
          entryIndex={entryIndex}
          motifs={visibleMotifs}
          isLoading={isLoading}
          onCellClick={handleCellClick}
          canEdit={true}
          holidays={joursFeries ?? {}}
        />

        {/* Legend */}
        <div className="shrink-0 pt-1">
          <PlanningLegend />
        </div>
      </div>

      {/* Toast notification */}
      {notification && (
        <div className={`
          fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3
          rounded-lg border shadow-lg animate-slide-up
          ${notification.type === 'success'
            ? 'bg-white border-success-border text-success shadow-md'
            : 'bg-white border-danger-border text-danger shadow-md'}
        `}>
          <span className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-sm">{notification.message}</span>
        </div>
      )}
    </div>
  )
}

function FilterIcon() {
  return <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
  </svg>
}

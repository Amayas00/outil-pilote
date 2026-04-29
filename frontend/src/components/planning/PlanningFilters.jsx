import { useQuery } from '@tanstack/react-query'
import { teamsService } from '../../services/api'
import Select from '../ui/Select'
import Button from '../ui/Button'
import { format, addWeeks, startOfWeek } from 'date-fns'

export default function PlanningFilters({ filters, onChange, onReset }) {
  const { data: regions } = useQuery({
    queryKey: ['regions'],
    queryFn: () => teamsService.getRegions().then(r => r.data?.results ?? r.data),
  })
  const { data: equipes } = useQuery({
    queryKey: ['equipes', { region: filters.region }],
    queryFn: () => teamsService.getEquipes({ region: filters.region || undefined }).then(r => r.data?.results ?? r.data),
  })

  const weekOptions = Array.from({ length: 52 }, (_, i) => {
    const d = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), i - 4)
    return { value: format(d, 'yyyy-MM-dd'), label: `S${format(d, 'II')} — ${format(d, 'dd/MM/yyyy')}` }
  })

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Select
        label="Région"
        value={filters.region || ''}
        onChange={e => onChange({ region: e.target.value, equipe: '' })}
        className="w-44"
      >
        <option value="">Toutes les régions</option>
        {(regions || []).map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
      </Select>

      <Select
        label="Équipe"
        value={filters.equipe || ''}
        onChange={e => onChange({ equipe: e.target.value })}
        className="w-52"
        disabled={!filters.region}
      >
        <option value="">Toutes les équipes</option>
        {(equipes || []).map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
      </Select>

      <Select
        label="Semaine de départ"
        value={filters.startDate || weekOptions[4].value}
        onChange={e => onChange({ startDate: e.target.value })}
        className="w-56"
      >
        {weekOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>

      <Select
        label="Période affichée"
        value={filters.nbWeeks || 8}
        onChange={e => onChange({ nbWeeks: Number(e.target.value) })}
        className="w-36"
      >
        {[4, 8, 12, 20, 40].map(n => <option key={n} value={n}>{n} semaines</option>)}
      </Select>

      <Button variant="ghost" size="sm" onClick={onReset} className="self-end mb-0.5">
        Réinitialiser
      </Button>
    </div>
  )
}

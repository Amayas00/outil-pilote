const MOTIFS = [
  { code: 'CONGE',           label: 'Congés',            color: 'bg-green-400'  },
  { code: 'MALADIE',         label: 'Maladie',           color: 'bg-red-400'    },
  { code: 'TEMPS_PARTIEL',   label: 'Temps partiel',     color: 'bg-orange-400' },
  { code: 'MISSION',         label: 'Mission',           color: 'bg-blue-400'   },
  { code: 'REUNION',         label: 'Réunion',           color: 'bg-purple-400' },
  { code: 'GESTION',         label: 'Gestion',           color: 'bg-amber-500'  },
  { code: 'PAS_AFFECTATION', label: 'Pas d\'affectation',color: 'bg-surface-5'  },
  { code: 'FORMATION',       label: 'Formation',         color: 'bg-cyan-400'   },
  { code: 'VISITE',          label: 'Visite',            color: 'bg-rose-400'   },
  { code: 'OFIS',            label: 'OFIS',              color: 'bg-slate-400'  },
]

export default function PlanningLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {MOTIFS.map(m => (
        <div key={m.code} className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-sm ${m.color} shrink-0`} />
          <span className="text-xs text-ink-3">{m.label}</span>
        </div>
      ))}
    </div>
  )
}

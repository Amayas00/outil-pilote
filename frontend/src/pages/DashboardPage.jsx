import { useAuth } from '../context/AuthContext'
import Card from '../components/ui/Card'
import Skeleton from '../components/ui/Skeleton'
import Badge from '../components/ui/Badge'
import { useQuery } from '@tanstack/react-query'
import { teamsService, planningService } from '../services/api'
import { format, startOfWeek, endOfWeek, addWeeks } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function DashboardPage() {
  const { user, isAdmin, isManager } = useAuth()

  const { data: collabs, isLoading: loadingCollabs } = useQuery({
    queryKey: ['collaborateurs', { actif: true }],
    queryFn: () => teamsService.getCollabs({ actif: true }).then(r => r.data),
  })
  const { data: equipes, isLoading: loadingEquipes } = useQuery({
    queryKey: ['equipes'],
    queryFn: () => teamsService.getEquipes().then(r => r.data),
  })
  const today = new Date()
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd   = format(endOfWeek(today,   { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const { data: planningThisWeek } = useQuery({
    queryKey: ['planning-week', weekStart],
    queryFn: () => planningService.getEntries({ date_debut: weekStart, date_fin: weekEnd }).then(r => r.data),
  })

  const stats = [
    {
      label: 'Collaborateurs actifs',
      value: loadingCollabs ? null : (collabs?.results?.length ?? collabs?.length ?? '—'),
      icon: <UsersIcon />, color: 'brand', visible: isManager,
    },
    {
      label: 'Équipes',
      value: loadingEquipes ? null : (equipes?.results?.length ?? equipes?.length ?? '—'),
      icon: <GridIcon />, color: 'success', visible: isManager,
    },
    {
      label: 'Entrées cette semaine',
      value: planningThisWeek ? (planningThisWeek?.results?.length ?? planningThisWeek?.length ?? 0) : null,
      icon: <CalIcon />, color: 'info', visible: true,
    },
    {
      label: 'Semaine courante',
      value: `S${format(today, 'II')}`,
      icon: <ClockIcon />, color: 'warning', visible: true,
    },
  ]

  const colorMap = {
    brand:   { bg: 'bg-brand-600/15',   text: 'text-brand-400',   icon: 'text-brand-400'   },
    success: { bg: 'bg-green-500/15',   text: 'text-green-300',   icon: 'text-green-400'   },
    info:    { bg: 'bg-cyan-500/15',     text: 'text-cyan-300',    icon: 'text-cyan-400'    },
    warning: { bg: 'bg-amber-500/15',   text: 'text-amber-300',   icon: 'text-amber-400'   },
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink-1">
            Bonjour{user?.nom_complet ? `, ${user.nom_complet.split(' ')[0]}` : ''} 👋
          </h2>
          <p className="text-sm text-ink-3 mt-0.5">
            {format(today, "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </div>
        <Badge variant="brand" dot="bg-brand-400">
          {user?.role}
        </Badge>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.filter(s => s.visible).map((stat) => {
          const c = colorMap[stat.color]
          return (
            <Card key={stat.label} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-3 font-medium">{stat.label}</span>
                <div className={`w-7 h-7 rounded-md ${c.bg} flex items-center justify-center ${c.icon}`}>
                  {stat.icon}
                </div>
              </div>
              {stat.value === null
                ? <Skeleton className="h-8 w-16" />
                : <span className={`text-2xl font-bold ${c.text} font-mono`}>{stat.value}</span>
              }
            </Card>
          )
        })}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick access */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-ink-2 uppercase tracking-wider">Accès rapide</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Voir le planning', desc: 'Grille hebdomadaire complète', to: '/planning', icon: <CalIcon />, color: 'brand' },
              isManager && { label: 'Gérer les collaborateurs', desc: 'Ajouter, modifier, affecter', to: '/collaborateurs', icon: <UsersIcon />, color: 'success' },
              isManager && { label: 'Gérer les équipes', desc: 'Équipes et domaines', to: '/equipes', icon: <GridIcon />, color: 'info' },
              isAdmin   && { label: 'Jours fériés', desc: 'Calendrier et ponts par région', to: '/jours-feries', icon: <StarIcon />, color: 'warning' },
            ].filter(Boolean).map((item) => {
              const c = colorMap[item.color]
              return (
                <a key={item.label} href={item.to}
                  className="flex items-center gap-3 p-4 bg-surface-2 border border-surface-5/60 rounded-lg
                             hover:bg-surface-3 hover:border-surface-5 transition-all duration-150 group">
                  <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center ${c.icon} shrink-0`}>
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-1 group-hover:text-white transition-colors">{item.label}</p>
                    <p className="text-xs text-ink-3 truncate">{item.desc}</p>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-ink-4 ml-auto shrink-0 group-hover:text-ink-2 transition-colors" />
                </a>
              )
            })}
          </div>
        </div>

        {/* Info panel */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-ink-2 uppercase tracking-wider">Cette semaine</h3>
          <Card className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-3">Du</span>
              <span className="text-ink-1 font-medium font-mono">
                {format(startOfWeek(today, { weekStartsOn: 1 }), 'dd MMM', { locale: fr })}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-3">Au</span>
              <span className="text-ink-1 font-medium font-mono">
                {format(endOfWeek(today, { weekStartsOn: 1 }), 'dd MMM yyyy', { locale: fr })}
              </span>
            </div>
            <div className="divider" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-3">Semaine ISO</span>
              <Badge variant="brand">S{format(today, 'II')}</Badge>
            </div>
            <div className="pt-1">
              <a href="/planning"
                className="flex items-center justify-center gap-2 w-full py-2 rounded-md
                           bg-brand-600/15 hover:bg-brand-600/25 text-brand-300 text-xs font-medium
                           transition-all duration-150 border border-brand-500/25">
                <CalIcon />
                Ouvrir le planning
              </a>
            </div>
          </Card>

          <Card className="space-y-2.5">
            <p className="text-xs font-semibold text-ink-2 uppercase tracking-wider">Légende des motifs</p>
            {[
              { label: 'Congés',       color: 'bg-green-400'  },
              { label: 'Maladie',      color: 'bg-red-400'    },
              { label: 'Formation',    color: 'bg-cyan-400'   },
              { label: 'Mission',      color: 'bg-blue-400'   },
              { label: 'Temps partiel',color: 'bg-orange-400' },
            ].map(m => (
              <div key={m.label} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${m.color} shrink-0`} />
                <span className="text-xs text-ink-2">{m.label}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}

function UsersIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg> }
function GridIcon()  { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg> }
function CalIcon()   { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg> }
function ClockIcon() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
function StarIcon()  { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg> }
function ChevronRightIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg> }

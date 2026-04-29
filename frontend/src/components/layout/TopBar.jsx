import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Badge from '../ui/Badge'

const ROUTE_LABELS = {
  '/':              { label: 'Tableau de bord', desc: 'Vue générale de l\'activité' },
  '/planning':      { label: 'Planning',         desc: 'Grille de planification hebdomadaire' },
  '/equipes':       { label: 'Équipes',           desc: 'Gestion des équipes et domaines' },
  '/collaborateurs':{ label: 'Collaborateurs',    desc: 'Gestion des membres' },
  '/jours-feries':  { label: 'Jours fériés',      desc: 'Calendrier des jours fériés et ponts' },
}

const ROLE_VARIANT = { admin: 'brand', manager: 'info', collaborateur: 'default' }

export default function TopBar() {
  const location = useLocation()
  const { user } = useAuth()
  const route = ROUTE_LABELS[location.pathname] || { label: 'Page', desc: '' }

  return (
    <header className="h-14 border-b border-surface-5/60 bg-surface-1/80 backdrop-blur-sm
                        flex items-center px-6 gap-4 shrink-0 sticky top-0 z-30">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5">
          <h1 className="text-sm font-semibold text-ink-1">{route.label}</h1>
          {route.desc && (
            <span className="hidden md:block text-xs text-ink-4">·</span>
          )}
          <p className="hidden md:block text-xs text-ink-3 truncate">{route.desc}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification placeholder */}
        <button className="relative p-1.5 rounded-md text-ink-3 hover:text-ink-1 hover:bg-surface-4 transition-colors">
          <BellIcon className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-brand-500 rounded-full" />
        </button>

        {/* User chip */}
        <div className="flex items-center gap-2 pl-3 border-l border-surface-5/60">
          <Badge variant={ROLE_VARIANT[user?.role] || 'default'} className="hidden sm:inline-flex">
            {user?.role}
          </Badge>
          <span className="text-sm text-ink-2 hidden md:block">{user?.email}</span>
        </div>
      </div>
    </header>
  )
}

function BellIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
}

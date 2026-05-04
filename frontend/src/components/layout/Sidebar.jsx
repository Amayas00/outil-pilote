import axaLogo from '../../assets/axa-logo.png';
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import clsx from 'clsx'

const NAV_MAIN = [
  { to: '/',         label: 'Tableau de bord', icon: HomeIcon  },
  { to: '/planning', label: 'Planning',         icon: CalIcon  },
]
const NAV_ADMIN = [
  { to: '/collaborateurs', label: 'Collaborateurs', icon: PersonIcon },
  { to: '/equipes',        label: 'Équipes',         icon: TeamIcon  },
  { to: '/jours-feries',   label: 'Jours fériés',    icon: StarIcon  },
]
const NAV_MANAGER = [
  { to: '/collaborateurs', label: 'Collaborateurs', icon: PersonIcon },
]

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout, isAdmin, isManager } = useAuth()
  const adminLinks = isAdmin ? NAV_ADMIN : isManager ? NAV_MANAGER : []

  return (
    // overflow-visible est CRITIQUE — permet au bouton toggle de sortir de la sidebar
    <aside
      className={clsx(
        'relative flex flex-col h-screen shrink-0 transition-all duration-250',
        // overflow-visible pour que le bouton -right-4 soit visible
        'overflow-visible'
      )}
      style={{
        width: collapsed ? 56 : 224,
        background: 'linear-gradient(180deg, #00008F 0%, #00006B 100%)',
        // Ombre légère à droite pour séparer du contenu
        boxShadow: '2px 0 8px rgba(0,0,143,0.15)',
      }}
    >
      {/* ── BOUTON TOGGLE — toujours visible, jamais masqué ── */}
      <button
        onClick={onToggle}
        className="absolute top-4 -right-4 z-50 w-8 h-8 rounded-full
                   bg-white border-2 border-[#E5E7EB]
                   flex items-center justify-center
                   shadow-md hover:shadow-lg
                   hover:border-[#00008F] hover:bg-[#F0F0FF]
                   transition-all duration-200"
        title={collapsed ? 'Ouvrir la sidebar' : 'Fermer la sidebar'}
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
      >
        <svg
          className={clsx('w-4 h-4 text-[#00008F] transition-transform duration-250', collapsed && 'rotate-180')}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
        </svg>
      </button>

      {/* ── Logo zone ── */}
      <div className={clsx(
        'h-14 border-b border-white/10 shrink-0 flex items-center',
        collapsed ? 'px-3 justify-center' : 'px-4 gap-3'
      )}>
        <div className="shrink-0 flex items-center justify-center">
          <img
            src={axaLogo}
            alt="AXA"
            className={clsx(
              'object-contain',
              collapsed ? 'w-8 h-8' : 'w-9 h-9'
            )}
          />
        </div>
        {!collapsed && (
          <div className="min-w-0 border-l border-white/20 pl-3 animate-fade-in overflow-hidden">
            <p className="text-white text-xs font-semibold leading-tight truncate">Outil Pilote</p>
            <p className="text-white/45 text-[10px] leading-tight truncate">Planification RH</p>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 flex flex-col gap-5">

        <div className="space-y-0.5">
          {!collapsed && (
            <p className="px-2 mb-1.5 text-[10px] font-bold text-white/35 uppercase tracking-widest">
              Principal
            </p>
          )}
          {NAV_MAIN.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => clsx(
                'flex items-center rounded-md text-sm font-medium',
                'transition-all duration-120 cursor-pointer select-none',
                collapsed ? 'justify-center w-10 h-10 mx-auto p-0' : 'gap-2.5 px-3 py-2',
                isActive
                  ? 'bg-white text-[#00008F] font-semibold shadow-sm'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate animate-fade-in">{label}</span>}
            </NavLink>
          ))}
        </div>

        {adminLinks.length > 0 && (
          <div className="space-y-0.5">
            {!collapsed && (
              <p className="px-2 mb-1.5 text-[10px] font-bold text-white/35 uppercase tracking-widest">
                Administration
              </p>
            )}
            {adminLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => clsx(
                  'flex items-center rounded-md text-sm font-medium',
                  'transition-all duration-120 cursor-pointer select-none',
                  collapsed ? 'justify-center w-10 h-10 mx-auto p-0' : 'gap-2.5 px-3 py-2',
                  isActive
                    ? 'bg-white text-[#00008F] font-semibold shadow-sm'
                    : 'text-white/75 hover:bg-white/10 hover:text-white'
                )}
                title={collapsed ? label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate animate-fade-in">{label}</span>}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* ── User footer ── */}
      <div className="border-t border-white/10 p-2 shrink-0">
        <div className={clsx(
          'flex items-center gap-2.5 p-2 rounded-md cursor-pointer group',
          'hover:bg-white/10 transition-colors',
          collapsed && 'justify-center'
        )}>
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-white">
              {(user?.nom_complet || user?.email || '?')[0].toUpperCase()}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {user?.nom_complet || user?.email}
              </p>
              <p className="text-[10px] text-white/45 leading-tight capitalize">
                {user?.role === 'admin' ? 'Administrateur' : user?.role === 'manager' ? 'Manager' : 'Collaborateur'}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              title="Déconnexion"
              className="opacity-0 group-hover:opacity-100 p-1 rounded text-white/45 hover:text-white transition-all shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}

/* ── Icons ── */
function HomeIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg> }
function CalIcon({ className })  { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg> }
function PersonIcon({ className }){ return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg> }
function TeamIcon({ className })  { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/></svg> }
function StarIcon({ className })  { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg> }

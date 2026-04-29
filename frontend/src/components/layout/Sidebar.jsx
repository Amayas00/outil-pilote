import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import clsx from 'clsx'

const NAV = [
  {
    label: 'Principal',
    items: [
      { to: '/',         label: 'Tableau de bord', icon: GridIcon },
      { to: '/planning', label: 'Planning',         icon: CalendarIcon },
    ]
  },
  {
    label: 'Administration',
    admin: true,
    items: [
      { to: '/equipes',       label: 'Équipes',          icon: UsersIcon },
      { to: '/collaborateurs',label: 'Collaborateurs',   icon: PersonIcon },
      { to: '/jours-feries',  label: 'Jours fériés',     icon: StarIcon },
    ]
  },
]

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout, isAdmin } = useAuth()
  const location = useLocation()

  return (
    <aside className={clsx(
      'flex flex-col bg-surface-0 border-r border-surface-5/60 h-screen',
      'transition-all duration-300 ease-spring shrink-0',
      collapsed ? 'w-14' : 'w-56'
    )}>
      {/* Logo */}
      <div className="flex items-center h-14 px-3 border-b border-surface-5/60 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-md bg-brand-600 flex items-center justify-center shrink-0 shadow-glow">
            <span className="text-white text-xs font-bold">OP</span>
          </div>
          {!collapsed && (
            <div className="min-w-0 animate-fade-in">
              <p className="text-sm font-semibold text-ink-1 truncate leading-tight">Outil Pilote</p>
              <p className="text-[10px] text-ink-3 truncate leading-tight">Planning RH</p>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="ml-auto p-1 rounded text-ink-3 hover:text-ink-1 hover:bg-surface-4 transition-colors shrink-0"
        >
          <ChevronIcon className={clsx('w-4 h-4 transition-transform duration-300', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV.map((section) => {
          if (section.admin && !isAdmin) return null
          return (
            <div key={section.label}>
              {!collapsed && (
                <p className="px-2 mb-1 text-[10px] font-semibold text-ink-4 uppercase tracking-widest">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) => clsx(
                      'nav-item',
                      isActive && 'active',
                      collapsed && 'justify-center px-0'
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!collapsed && <span className="truncate animate-fade-in">{label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-2 border-t border-surface-5/60 shrink-0">
        <div className={clsx(
          'flex items-center gap-2 p-2 rounded-md',
          collapsed ? 'justify-center' : 'hover:bg-surface-4 cursor-pointer group'
        )}>
          <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-brand-200">
              {user?.nom_complet?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-xs font-medium text-ink-1 truncate">{user?.nom_complet || user?.email}</p>
              <p className="text-[10px] text-ink-3 capitalize">{user?.role}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              className="opacity-0 group-hover:opacity-100 p-1 rounded text-ink-3 hover:text-red-400 transition-all"
              title="Déconnexion"
            >
              <LogoutIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}

// ── Inline SVG Icons ──────────────────────────────────────────────────────────
function GridIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>
}
function CalendarIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
}
function UsersIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
}
function PersonIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
}
function StarIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H18v-.008zm0 2.25h.008v.008H18V15z" />
  </svg>
}
function ChevronIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
}
function LogoutIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
}

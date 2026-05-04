import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const ROUTES = {
  '/':               ['Tableau de bord',   'Vue d\'ensemble'],
  '/planning':       ['Planning',           'Grille de planification hebdomadaire'],
  '/equipes':        ['Équipes',            'Gestion des équipes et domaines'],
  '/collaborateurs': ['Collaborateurs',     'Gestion des membres'],
  '/jours-feries':   ['Jours fériés',       'Calendrier et ponts par région'],
}
const ROLE_LABEL = { admin:'Administrateur', manager:'Manager', collaborateur:'Collaborateur' }

export default function TopBar() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const [title, desc] = ROUTES[pathname] || ['Page','']

  return (
    <header className="h-14 bg-white border-b border-slate-150 flex items-center px-6 gap-4 shrink-0 sticky top-0 z-30">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0 text-xs">
        <span className="text-slate-400 font-medium">AXA</span>
        <svg className="w-3 h-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
        <span className="text-slate-400 font-medium">Outil Pilote</span>
        <svg className="w-3 h-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
        <span className="font-semibold text-slate-700">{title}</span>
        {desc && <><span className="text-slate-300 hidden md:block">·</span><span className="text-slate-400 hidden md:block truncate font-normal">{desc}</span></>}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 shrink-0">
        <button className="p-1.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors relative">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/></svg>
        </button>
        <div className="w-px h-5 bg-slate-150"/>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-axa flex items-center justify-center shrink-0">
            <span className="text-2xs font-bold text-white">{(user?.nom_complet||user?.email||'?')[0].toUpperCase()}</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-slate-700 leading-tight">{user?.nom_complet||user?.email}</p>
            <p className="text-2xs text-slate-400 leading-tight">{ROLE_LABEL[user?.role]||user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  )
}

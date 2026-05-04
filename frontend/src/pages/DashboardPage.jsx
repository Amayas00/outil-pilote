import { useAuth } from '../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { teamsService, planningService } from '../services/api'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import Skeleton from '../components/ui/Skeleton'
import Badge from '../components/ui/Badge'
import clsx from 'clsx'

export default function DashboardPage() {
  const { user, isAdmin, isManager } = useAuth()
  const today = new Date()
  const wStart = format(startOfWeek(today,{weekStartsOn:1}),'yyyy-MM-dd')
  const wEnd   = format(endOfWeek(today,{weekStartsOn:1}),'yyyy-MM-dd')

  const {data:collabs,isLoading:lc} = useQuery({queryKey:['collaborateurs',{actif:true}],queryFn:()=>teamsService.getCollabs({actif:true}).then(r=>r.data?.results??r.data??[])})
  const {data:equipes,isLoading:le} = useQuery({queryKey:['equipes'],queryFn:()=>teamsService.getEquipes().then(r=>r.data?.results??r.data??[])})
  const {data:planning} = useQuery({queryKey:['planning-week',wStart],queryFn:()=>planningService.getEntries({date_debut:wStart,date_fin:wEnd}).then(r=>r.data?.results??r.data??[])})

  // Fetch collaborateur detail for current user (if linked)
  const collabId = user?.collaborateur_id
  const {data:myCollab} = useQuery({
    queryKey:['my-collab', collabId],
    queryFn:()=>teamsService.getCollab(collabId).then(r=>r.data),
    enabled: !!collabId,
  })

  const stats = [
    {label:'Collaborateurs actifs',value:lc?null:collabs?.length??0,icon:'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',color:'#00008F',bg:'#E6E6FF',visible:isManager},
    {label:'Équipes actives',value:le?null:equipes?.length??0,icon:'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',color:'#0D6B3A',bg:'#F0FAF4',visible:isManager},
    {label:'Entrées cette semaine',value:planning?planning.length:null,icon:'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',color:'#92500A',bg:'#FFFBF0',visible:true},
    {label:`Semaine ${format(today,'II')}`,value:format(today,'yyyy'),icon:'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',color:'#3D4452',bg:'#F6F8FA',visible:true},
  ].filter(s=>s.visible)

  const links = [
    {to:'/planning',label:'Planning',desc:'Grille 40 semaines · AM/PM',primary:true},
    isManager&&{to:'/collaborateurs',label:'Collaborateurs',desc:'Gérer les membres'},
    isAdmin&&{to:'/equipes',label:'Équipes',desc:'Domaines et régions'},
    isAdmin&&{to:'/jours-feries',label:'Jours fériés',desc:'Calendrier des ponts'},
  ].filter(Boolean)

  const motifs = [{l:'Congés',c:'#22C55E'},{l:'Maladie',c:'#EF4444'},{l:'Mission',c:'#00008F'},{l:'Formation',c:'#06B6D4'},{l:'Temps partiel',c:'#F97316'},{l:'Réunion',c:'#A855F7'},{l:'Gestion',c:'#D97706'},{l:'OFIS',c:'#64748B'}]

  return (
    <div className="page">
      {/* Header */}
      <div className="page-head">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-sub capitalize">{format(today,"EEEE d MMMM yyyy",{locale:fr})}</p>
        </div>
        <Badge variant="brand">{user?.role==='admin'?'Administrateur':user?.role==='manager'?'Manager':'Collaborateur'}</Badge>
      </div>

      {/* Welcome banner */}
      <div className="rounded-lg overflow-hidden flex items-stretch" style={{background:'linear-gradient(105deg,#00008F 0%,#0000BB 100%)'}}>
        <div className="flex-1 p-5">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-1.5">Bonjour</p>
          <p className="text-white font-semibold text-xl mb-1">{user?.nom_complet||user?.email?.split('@')[0]}</p>
          <p className="text-white/55 text-sm">
            {format(startOfWeek(today,{weekStartsOn:1}),'d',{locale:fr})}–{format(endOfWeek(today,{weekStartsOn:1}),'d MMM yyyy',{locale:fr})} · Semaine {format(today,'II')}
          </p>
          {myCollab && (
            <div className="flex items-center gap-3 mt-2.5">
              {myCollab.region_nom && (
                <span className="inline-flex items-center gap-1.5 bg-white/15 text-white/80 text-xs px-2.5 py-1 rounded-full">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
                  {myCollab.region_nom}
                </span>
              )}
              {myCollab.equipe_nom && (
                <span className="inline-flex items-center gap-1.5 bg-white/15 text-white/80 text-xs px-2.5 py-1 rounded-full">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/></svg>
                  {myCollab.equipe_nom}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center px-6 border-l border-white/10">
          <Link to="/planning" className="flex items-center gap-2 bg-white text-axa font-semibold text-sm px-4 py-2 rounded hover:bg-blue-50 transition-colors whitespace-nowrap">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg>
            Ouvrir le planning
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s=>(
          <div key={s.label} className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide leading-tight">{s.label}</span>
              <div className="w-8 h-8 rounded flex items-center justify-center shrink-0" style={{background:s.bg}}>
                <svg className="w-4 h-4" style={{color:s.color}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={s.icon}/></svg>
              </div>
            </div>
            {s.value===null
              ? <Skeleton className="h-7 w-16"/>
              : <span className="text-2xl font-semibold text-slate-900 font-mono">{s.value}</span>
            }
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Quick access */}
        <div className="lg:col-span-2 space-y-3">
          <p className="section-label">Accès rapide</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {links.map(item=>(
              <Link key={item.to+item.label} to={item.to}
                className={clsx('flex items-center gap-3 p-4 rounded-lg border transition-all duration-120 group',
                  item.primary
                    ? 'border-transparent text-white shadow-sm'
                    : 'card hover:border-slate-200 hover:shadow'
                )}
                style={item.primary?{background:'linear-gradient(105deg,#00008F,#0000BB)'}:{}}
              >
                <div className={clsx('w-9 h-9 rounded flex items-center justify-center shrink-0',
                  item.primary?'bg-white/15':'bg-slate-100 group-hover:bg-axa-light')}
                  style={{transition:'background 120ms'}}>
                  <svg className={clsx('w-4 h-4',item.primary?'text-white':'text-slate-500 group-hover:text-axa')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className={clsx('text-sm font-semibold leading-tight',item.primary?'text-white':'text-slate-800')}>{item.label}</p>
                  <p className={clsx('text-xs mt-0.5 truncate',item.primary?'text-white/60':'text-slate-400')}>{item.desc}</p>
                </div>
                <svg className={clsx('w-4 h-4 shrink-0',item.primary?'text-white/50':'text-slate-300 group-hover:text-axa transition-colors')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
              </Link>
            ))}
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          <p className="section-label">Légende des motifs</p>
          <div className="card p-4">
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-3">
              {motifs.map(m=>(
                <div key={m.l} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{background:m.c}}/>
                  <span className="text-xs text-slate-500 font-medium truncate">{m.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const M = [
  {l:'Congés',c:'#16A34A'},{l:'Maladie',c:'#DC2626'},{l:'Temps partiel',c:'#EA580C'},
  {l:'Mission',c:'#00008F'},{l:'Réunion',c:'#9333EA'},{l:'Gestion',c:'#B45309'},
  {l:'Pas d\'affectation',c:'#64748B'},{l:'Formation',c:'#0891B2'},{l:'Visite',c:'#E11D48'},{l:'OFIS',c:'#475569'},
]
export default function PlanningLegend() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5">
      {M.map(m=>(
        <div key={m.l} className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{background:m.c}}/>
          <span className="text-xs text-slate-500 font-medium">{m.l}</span>
        </div>
      ))}
    </div>
  )
}

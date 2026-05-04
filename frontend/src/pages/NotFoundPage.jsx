import { Link } from 'react-router-dom'
export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 text-center px-6">
      <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center mb-5">
        <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <p className="text-5xl font-bold text-slate-200 font-mono mb-3">404</p>
      <h2 className="text-lg font-semibold text-slate-700 mb-2">Page introuvable</h2>
      <p className="text-sm text-slate-400 mb-8 max-w-sm">Cette page n'existe pas ou vous n'avez pas les droits nécessaires.</p>
      <Link to="/" className="btn btn-primary btn-md">Retour au tableau de bord</Link>
    </div>
  )
}

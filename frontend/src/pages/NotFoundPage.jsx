import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 text-center px-6">
      <p className="text-6xl font-bold text-ink-4 font-mono mb-4">404</p>
      <h2 className="text-lg font-semibold text-ink-1 mb-2">Page introuvable</h2>
      <p className="text-sm text-ink-3 mb-8">Cette page n'existe pas ou vous n'avez pas les droits pour y accéder.</p>
      <Link to="/"><Button variant="secondary">Retour au tableau de bord</Button></Link>
    </div>
  )
}

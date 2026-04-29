import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
export default function JoursFeriesPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-ink-1">JoursFeries</h2>
        <p className="text-sm text-ink-3 mt-1">Module en cours de développement</p>
      </div>
      <Card className="flex flex-col items-center py-16 gap-4">
        <p className="text-sm text-ink-2">Cette page sera disponible prochainement</p>
        <p className="text-xs text-ink-4">Les APIs backend sont prêtes</p>
        <Badge variant="info">Prochaine étape</Badge>
      </Card>
    </div>
  )
}

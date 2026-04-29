import { useState } from 'react'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import { useRegions, useDomaines } from '../../hooks/useEquipes'

const EMPTY = { nom: '', region: '', domaine: '' }

export default function EquipeForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(initial ? {
    nom:     initial.nom     ?? '',
    region:  initial.region  ?? '',
    domaine: initial.domaine ?? '',
  } : EMPTY)
  const [errors, setErrors] = useState({})

  const { data: regions  = [] } = useRegions()
  const { data: domaines = [] } = useDomaines()

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.nom.trim()) e.nom     = 'Champ requis'
    if (!form.region)     e.region  = 'Champ requis'
    if (!form.domaine)    e.domaine = 'Champ requis'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({ ...form, region: Number(form.region), domaine: Number(form.domaine) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nom de l'équipe *"
        value={form.nom}
        onChange={set('nom')}
        error={errors.nom}
        placeholder="Ex: Souscription Auto Paris"
      />
      <div className="grid grid-cols-2 gap-4">
        <Select label="Région *" value={form.region} onChange={set('region')} error={errors.region}>
          <option value="">Sélectionner…</option>
          {regions.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
        </Select>
        <Select label="Domaine *" value={form.domaine} onChange={set('domaine')} error={errors.domaine}>
          <option value="">Sélectionner…</option>
          {domaines.map(d => <option key={d.id} value={d.id}>{d.nom_display}</option>)}
        </Select>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
        <Button type="submit" loading={loading}>{initial ? 'Enregistrer' : "Créer l'équipe"}</Button>
      </div>
    </form>
  )
}

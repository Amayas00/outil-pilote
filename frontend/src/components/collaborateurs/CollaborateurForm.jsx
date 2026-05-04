import { useState, useEffect } from 'react'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import { useEquipes, useRegions } from '../../hooks/useEquipes'

const EMPTY = { matricule: '', nom: '', prenom: '', equipe: '', date_entree: '', date_sortie: '', actif: true }

export default function CollaborateurForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(initial ? {
    matricule:   initial.matricule   ?? '',
    nom:         initial.nom         ?? '',
    prenom:      initial.prenom      ?? '',
    equipe:      initial.equipe      ?? '',
    date_entree: initial.date_entree ?? '',
    date_sortie: initial.date_sortie ?? '',
    actif:       initial.actif       ?? true,
  } : EMPTY)
  const [errors, setErrors] = useState({})
  const [regionFilter, setRegionFilter] = useState('')

  const { data: regions = [] } = useRegions()
  const { data: equipes = [] } = useEquipes({ region: regionFilter || undefined, active: true })

  useEffect(() => {
    if (initial?.region) setRegionFilter(String(initial.region))
  }, [initial])

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(f => ({ ...f, [field]: val }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.matricule.trim()) e.matricule = 'Champ requis'
    if (!form.nom.trim())       e.nom       = 'Champ requis'
    if (!form.prenom.trim())    e.prenom    = 'Champ requis'
    if (!form.equipe)           e.equipe    = 'Champ requis'
    if (!form.date_entree)      e.date_entree = 'Champ requis'
    if (form.date_sortie && form.date_entree && form.date_sortie <= form.date_entree)
      e.date_sortie = "Doit être postérieure à la date d'entrée"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({ ...form, equipe: form.equipe ? Number(form.equipe) : null, date_sortie: form.date_sortie || null })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <fieldset className="space-y-4">
        <legend className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-150 w-full">Identité</legend>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Prénom *" value={form.prenom} onChange={set('prenom')} error={errors.prenom} placeholder="Jean" />
          <Input label="Nom *"    value={form.nom}    onChange={set('nom')}    error={errors.nom}    placeholder="DUPONT" />
        </div>
        <Input label="Matricule *" value={form.matricule} onChange={set('matricule')} error={errors.matricule} placeholder="EMP-001" className="font-mono" />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-150 w-full">Affectation</legend>
        <Select label="Région (filtre)" value={regionFilter} onChange={e => { setRegionFilter(e.target.value); setForm(f => ({ ...f, equipe: '' })) }}>
          <option value="">Toutes les régions</option>
          {regions.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
        </Select>
        <Select label="Équipe *" value={form.equipe} onChange={set('equipe')} error={errors.equipe}>
          <option value="">Sélectionner une équipe…</option>
          {equipes.map(e => <option key={e.id} value={e.id}>{e.nom} — {e.region_nom}</option>)}
        </Select>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-150 w-full">Période</legend>
        <div className="grid grid-cols-2 gap-4">
          <Input type="date" label="Date d'entrée *" value={form.date_entree} onChange={set('date_entree')} error={errors.date_entree} />
          <Input type="date" label="Date de sortie"  value={form.date_sortie} onChange={set('date_sortie')} error={errors.date_sortie} hint="Vide si en poste" />
        </div>
        {initial && (
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <div className="relative">
              <input type="checkbox" checked={form.actif} onChange={set('actif')} className="sr-only peer" />
              <div className="w-9 h-5 bg-slate-200 rounded-full peer-checked:bg-axa transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
            </div>
            <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">Collaborateur actif</span>
          </label>
        )}
      </fieldset>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
        <Button type="submit" loading={loading}>{initial ? 'Enregistrer' : 'Créer le collaborateur'}</Button>
      </div>
    </form>
  )
}

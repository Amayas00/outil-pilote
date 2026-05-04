import { useState, useEffect } from 'react'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import { useRegions } from '../../hooks/useEquipes'
import clsx from 'clsx'

const EMPTY = { jour: '', libelle: '', type: 'ferie', regions_ids: [] }

export default function JourFerieForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(initial ? {
    jour:        initial.jour        ?? '',
    libelle:     initial.libelle     ?? '',
    type:        initial.type        ?? 'ferie',
    regions_ids: initial.regions_ids?.map(r => typeof r === 'object' ? r.id : r) ?? [],
  } : EMPTY)
  const [errors, setErrors] = useState({})
  const { data: regions = [] } = useRegions()

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  const toggleRegion = (id) => {
    setForm(f => ({
      ...f,
      regions_ids: f.regions_ids.includes(id)
        ? f.regions_ids.filter(r => r !== id)
        : [...f.regions_ids, id],
    }))
  }

  const validate = () => {
    const e = {}
    if (!form.jour)        e.jour    = 'Champ requis'
    if (!form.libelle.trim()) e.libelle = 'Champ requis'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({ ...form })
  }

  const allRegions = form.regions_ids.length === 0

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Date & type */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          type="date"
          label="Date *"
          value={form.jour}
          onChange={set('jour')}
          error={errors.jour}
        />
        <Select label="Type *" value={form.type} onChange={set('type')}>
          <option value="ferie">Jour férié</option>
          <option value="pont">Pont</option>
        </Select>
      </div>

      {/* Label */}
      <Input
        label="Libellé *"
        value={form.libelle}
        onChange={set('libelle')}
        error={errors.libelle}
        placeholder="Ex: Fête du Travail, Lundi de Pâques…"
      />

      {/* Regions */}
      <fieldset className="space-y-3">
        <div className="flex items-center justify-between">
          <legend className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Régions concernées
          </legend>
          <span className={clsx(
            'text-xs px-2 py-0.5 rounded-full font-medium',
            allRegions
              ? 'bg-axa/15 text-axa'
              : 'bg-slate-100 text-slate-400'
          )}>
            {allRegions ? 'Toutes les régions' : `${form.regions_ids.length} sélectionnée(s)`}
          </span>
        </div>

        <p className="text-xs text-slate-300">
          Laissez tout décoché pour appliquer à toutes les régions.
        </p>

        <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto pr-1">
          {regions.map(r => {
            const checked = form.regions_ids.includes(r.id)
            return (
              <label
                key={r.id}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer',
                  'border transition-all duration-150',
                  checked
                    ? 'bg-axa/10 border-axa/30 text-slate-800'
                    : 'bg-slate-50 border-slate-200/60 text-slate-600 hover:bg-slate-100'
                )}
              >
                <div className={clsx(
                  'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                  checked ? 'bg-axa border-axa' : 'border-slate-300'
                )}>
                  {checked && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </div>
                <span className="text-sm">{r.nom}</span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
        <Button type="submit" loading={loading}>
          {initial ? 'Enregistrer' : 'Créer'}
        </Button>
      </div>
    </form>
  )
}

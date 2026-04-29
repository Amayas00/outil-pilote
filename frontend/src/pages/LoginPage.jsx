import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate   = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Email ou mot de passe incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-0 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col relative overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />
        {/* Gradient blobs */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-brand-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-brand-800/15 rounded-full blur-[80px]" />

        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center shadow-glow">
              <span className="text-white text-sm font-bold">OP</span>
            </div>
            <span className="text-lg font-semibold text-ink-1">Outil Pilote</span>
          </div>

          {/* Hero content */}
          <div className="flex-1 flex flex-col justify-center max-w-md">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-600/15 border border-brand-500/25 text-brand-300 text-xs font-medium mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                Gestion RH & Planning
              </div>
              <h2 className="text-4xl font-bold text-ink-1 leading-tight mb-4">
                Pilotez votre<br />
                <span className="text-gradient">équipe en temps réel</span>
              </h2>
              <p className="text-ink-2 leading-relaxed">
                Planifiez, visualisez et gérez les affectations de vos collaborateurs
                sur une grille 40 semaines avec des droits granulaires.
              </p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {['Grille 40 semaines', 'Demi-journées', 'Historique complet', 'Multi-équipes'].map(f => (
                <span key={f} className="px-3 py-1 bg-surface-3 border border-surface-5/60 rounded-full text-xs text-ink-2">
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Footer quote */}
          <p className="text-xs text-ink-4">
            Solution interne de planification RH opérationnelle
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-slide-up">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-md bg-brand-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">OP</span>
            </div>
            <span className="font-semibold text-ink-1">Outil Pilote</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-ink-1 mb-1.5">Connexion</h1>
            <p className="text-sm text-ink-3">Entrez vos identifiants pour accéder au tableau de bord.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Adresse email"
              type="email"
              placeholder="vous@exemple.com"
              value={form.email}
              onChange={e => setForm(v => ({ ...v, email: e.target.value }))}
              required
              autoComplete="email"
              icon={<MailIcon />}
            />
            <Input
              label="Mot de passe"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(v => ({ ...v, password: e.target.value }))}
              required
              autoComplete="current-password"
              icon={<LockIcon />}
            />

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/30 rounded-md animate-fade-in">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
              {loading ? 'Connexion en cours…' : 'Se connecter'}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-ink-4">
            Accès réservé aux utilisateurs autorisés
          </p>
        </div>
      </div>
    </div>
  )
}

function MailIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
}
function LockIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
}

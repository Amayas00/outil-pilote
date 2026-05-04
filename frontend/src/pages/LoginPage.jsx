import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axaLogo from '../assets/axa-logo.png'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Identifiants incorrects.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#F4F7FB' }}
    >
      <div className="w-full max-w-[420px] animate-slide-up">

        {/* AXA Logo */}
        <div className="flex justify-center mb-6">
          <img src={axaLogo} alt="AXA" className="h-20 w-auto mx-auto object-contain" />
        </div>

        {/* Title */}
        <h1
          className="text-center font-semibold mb-8"
          style={{ color: '#0F172A', fontSize: '22px' }}
        >
          Outil Pilote Login
        </h1>

        {/* Form card */}
        <div
          className="rounded-xl p-8 space-y-5"
          style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 4px 16px rgba(0,0,143,0.08)' }}
        >

          {/* Email */}
          <div className="relative">
            <label
              className="absolute -top-2.5 left-3 text-xs px-1 font-semibold z-10"
              style={{ color: '#00008F', background: '#FFFFFF' }}
            >
              Adresse email *
            </label>
            <input
              type="email"
              placeholder="prenom.nom@axa.fr"
              value={form.email}
              onChange={e => setForm(v => ({ ...v, email: e.target.value }))}
              required
              autoComplete="email"
              className="w-full h-14 px-4 text-sm outline-none transition-all rounded-lg"
              style={{
                background: '#F4F7FB',
                border: '1.5px solid #E5E7EB',
                color: '#0F172A',
              }}
              onFocus={e => {
                e.target.style.borderColor = '#00008F'
                e.target.style.background = '#FFFFFF'
                e.target.style.boxShadow = '0 0 0 3px rgba(0,0,143,0.10)'
              }}
              onBlur={e => {
                e.target.style.borderColor = '#E5E7EB'
                e.target.style.background = '#F4F7FB'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Password */}
          <div className="relative">
            <label
              className="absolute -top-2.5 left-3 text-xs px-1 font-semibold z-10"
              style={{ color: '#64748B', background: '#FFFFFF' }}
            >
              Mot de passe *
            </label>
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••••"
              value={form.password}
              onChange={e => setForm(v => ({ ...v, password: e.target.value }))}
              required
              autoComplete="current-password"
              className="w-full h-14 px-4 pr-12 text-sm outline-none transition-all rounded-lg"
              style={{
                background: '#F4F7FB',
                border: '1.5px solid #E5E7EB',
                color: '#0F172A',
              }}
              onFocus={e => {
                e.target.style.borderColor = '#00008F'
                e.target.style.background = '#FFFFFF'
                e.target.style.boxShadow = '0 0 0 3px rgba(0,0,143,0.10)'
              }}
              onBlur={e => {
                e.target.style.borderColor = '#E5E7EB'
                e.target.style.background = '#F4F7FB'
                e.target.style.boxShadow = 'none'
              }}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors"
              style={{ color: '#94A3B8' }}
              onMouseEnter={e => e.currentTarget.style.color = '#00008F'}
              onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
            >
              {showPw
                ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/></svg>
                : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              }
            </button>
          </div>

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm animate-fade-in"
              style={{ background: '#FFF5F5', border: '1px solid #FCA5A5', color: '#DC2626' }}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
              </svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="w-full h-14 font-bold text-sm tracking-widest uppercase rounded-lg transition-all disabled:opacity-50"
            style={{ background: '#00008F', color: '#FFFFFF', letterSpacing: '0.12em' }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#0000BB' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#00008F' }}
          >
            {loading
              ? <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-sm"/>
                  Connexion…
                </span>
              : 'Se connecter'
            }
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: '#E5E7EB' }}/>
            <span className="text-xs font-medium" style={{ color: '#94A3B8' }}>OU</span>
            <div className="flex-1 h-px" style={{ background: '#E5E7EB' }}/>
          </div>

          {/* SSO */}
          <button
            type="button"
            className="w-full h-12 flex items-center justify-center gap-3 font-semibold text-sm tracking-wide rounded-lg transition-all"
            style={{
              background: '#F4F7FB',
              border: '1.5px solid #E5E7EB',
              color: '#334155',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#00008F'
              e.currentTarget.style.color = '#00008F'
              e.currentTarget.style.background = '#EEF2FF'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#E5E7EB'
              e.currentTarget.style.color = '#334155'
              e.currentTarget.style.background = '#F4F7FB'
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/>
            </svg>
            Connexion SSO
          </button>

        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: '#94A3B8' }}>
          © {new Date().getFullYear()} AXA — Usage interne uniquement
        </p>
      </div>
    </div>
  )
}

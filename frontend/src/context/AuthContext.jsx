import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { setLoading(false); return }
    authService.me()
      .then(({ data }) => setUser(data))
      .catch(() => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await authService.login(email, password)
    localStorage.setItem('access_token',  data.access)
    localStorage.setItem('refresh_token', data.refresh)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }, [])

  const isAdmin   = user?.role === 'admin'
  const isManager = user?.role === 'manager' || user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isManager }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

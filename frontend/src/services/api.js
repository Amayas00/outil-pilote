import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, { refresh })
        localStorage.setItem('access_token', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authService = {
  login:   (email, password) => api.post('/auth/login/', { email, password }),
  me:      ()                => api.get('/auth/me/'),
  refresh: (refresh)         => api.post('/auth/refresh/', { refresh }),
}

// ── Teams ─────────────────────────────────────────────────────────────────────
export const teamsService = {
  getRegions:      (params)   => api.get('/regions/', { params }),
  getEquipes:      (params)   => api.get('/equipes/', { params }),
  getCollabs:      (params)   => api.get('/collaborateurs/', { params }),
  getCollab:       (id)       => api.get(`/collaborateurs/${id}/`),
  createCollab:    (data)     => api.post('/collaborateurs/', data),
  updateCollab:    (id, data) => api.patch(`/collaborateurs/${id}/`, data),
  changerEquipe:   (id, data) => api.post(`/collaborateurs/${id}/changer-equipe/`, data),
  getAffectations: (id)       => api.get(`/collaborateurs/${id}/affectations/`),
}

// ── Planning ──────────────────────────────────────────────────────────────────
export const planningService = {
  getEntries:  (params) => api.get('/planning/', { params }),
  upsertEntry: (data)   => api.post('/planning/entry/', data),
  deleteEntry: (id)     => api.delete(`/planning/entry/${id}/`),
  bulkCreate:  (data)   => api.post('/planning/bulk/', data),
  getHistory:  (params) => api.get('/planning/historique/', { params }),
  getMotifs:   ()       => api.get('/motifs/'),
}

// ── Calendar ──────────────────────────────────────────────────────────────────
export const calendarService = {
  getJoursFeries: (params)   => api.get('/jours-feries/', { params }),
  createJourFerie:(data)     => api.post('/jours-feries/', data),
  updateJourFerie:(id, data) => api.patch(`/jours-feries/${id}/`, data),
  deleteJourFerie:(id)       => api.delete(`/jours-feries/${id}/`),
}

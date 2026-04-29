import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PlanningPage from './pages/PlanningPage'
import EquipesPage from './pages/EquipesPage'
import CollaborateursPage from './pages/CollaborateursPage'
import JoursFeriesPage from './pages/JoursFeriesPage'
import NotFoundPage from './pages/NotFoundPage'
import Spinner from './components/ui/Spinner'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function RequireAdmin({ children }) {
  const { isAdmin } = useAuth()
  return isAdmin ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
              <Route index element={<DashboardPage />} />
              <Route path="planning" element={<PlanningPage />} />
              <Route path="equipes" element={<RequireAdmin><EquipesPage /></RequireAdmin>} />
              <Route path="collaborateurs" element={<CollaborateursPage />} />
              <Route path="jours-feries" element={<RequireAdmin><JoursFeriesPage /></RequireAdmin>} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

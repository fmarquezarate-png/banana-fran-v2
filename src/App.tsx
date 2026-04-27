import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { TopBar } from '@/components/layout/TopBar'
import { LoginPage } from '@/pages/LoginPage'
import { AuthCallbackPage } from '@/pages/AuthCallbackPage'
import { HomePage } from '@/pages/HomePage'
import { DestinationPage } from '@/pages/DestinationPage'
import { TripsPage } from '@/pages/TripsPage'
import { TripDetailPage } from '@/pages/TripDetailPage'
import { TripPhotosPage } from '@/pages/TripPhotosPage'
import { TripJournalPage } from '@/pages/TripJournalPage'
import { ProfilePage } from '@/pages/ProfilePage'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-crema flex items-center justify-center">
      <div className="text-center">
        <span className="text-4xl animate-pulse">🍌</span>
        <p className="text-gray-400 mt-3 text-sm">Cargando...</p>
      </div>
    </div>
  )
}

function AuthenticatedApp() {
  return (
    <>
      <TopBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/destino/:id" element={<DestinationPage />} />
        <Route path="/viajes" element={<TripsPage />} />
        <Route path="/viajes/:id" element={<TripDetailPage />} />
        <Route path="/viajes/:id/fotos" element={<TripPhotosPage />} />
        <Route path="/viajes/:id/diario" element={<TripJournalPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

function AppRoutes() {
  const { user, loading } = useAuth()

  return (
    <Routes>
      {/* Siempre accesible — procesa el token del magic link */}
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route
        path="*"
        element={loading ? <LoadingScreen /> : user ? <AuthenticatedApp /> : <LoginPage />}
      />
    </Routes>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1a1a1a',
            color: '#fff',
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />
    </BrowserRouter>
  )
}

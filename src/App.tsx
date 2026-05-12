import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { TravelLoader } from '@/components/ui/TravelLoader'
import { FavoritesProvider } from '@/contexts/FavoritesContext'
import { RatingsProvider } from '@/contexts/RatingsContext'
import { TopBar } from '@/components/layout/TopBar'
import { LoginPage } from '@/pages/LoginPage'
import { AuthCallbackPage } from '@/pages/AuthCallbackPage'
import { HomePage } from '@/pages/HomePage'
import { DestinationPage } from '@/pages/DestinationPage'
import { TripsPage } from '@/pages/TripsPage'
import { TripDetailPage } from '@/pages/TripDetailPage'
import { TripPhotosPage } from '@/pages/TripPhotosPage'
import { TripJournalPage } from '@/pages/TripJournalPage'
import { TripWizardPage } from '@/pages/TripWizardPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { PlacesPage } from '@/pages/PlacesPage'
import { ExplorePage } from '@/pages/ExplorePage'
import { AnalysisPage } from '@/pages/AnalysisPage'

const LOADING_EMOJIS = ['✈️', '🛳️', '🏖️', '⛰️', '🧳', '🌍', '🗺️', '🍌']

function LoadingScreen() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % LOADING_EMOJIS.length), 600)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="min-h-screen bg-crema flex items-center justify-center">
      <div className="text-center">
        <span className="text-5xl block transition-all duration-300">{LOADING_EMOJIS[idx]}</span>
        <p className="text-gray-400 mt-3 text-sm">Cargando...</p>
      </div>
    </div>
  )
}

function NavigationLoader() {
  const location = useLocation()
  const [show, setShow] = useState(false)
  const prevPath = useRef(location.pathname)

  useEffect(() => {
    if (prevPath.current === location.pathname) return
    prevPath.current = location.pathname
    setShow(true)
  }, [location.pathname])

  if (!show) return null
  return <TravelLoader onDone={() => setShow(false)} duration={Math.random() * 2000} />
}

function AuthenticatedApp() {
  return (
    <RatingsProvider>
    <FavoritesProvider>
      <NavigationLoader />
      <TopBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/destino/:id" element={<DestinationPage />} />
        <Route path="/viajes" element={<TripsPage />} />
        <Route path="/viajes/nuevo" element={<TripWizardPage />} />
        <Route path="/viajes/:id" element={<TripDetailPage />} />
        <Route path="/viajes/:id/fotos" element={<TripPhotosPage />} />
        <Route path="/viajes/:id/diario" element={<TripJournalPage />} />
        <Route path="/explorar" element={<ExplorePage />} />
        <Route path="/analisis" element={<AnalysisPage />} />
        <Route path="/places" element={<PlacesPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </FavoritesProvider>
    </RatingsProvider>
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

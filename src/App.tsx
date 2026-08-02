import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { TravelLoader } from '@/components/ui/TravelLoader'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { FavoritesProvider } from '@/contexts/FavoritesContext'
import { RatingsProvider } from '@/contexts/RatingsContext'
import { TopBar } from '@/components/layout/TopBar'
// Rutas ligeras y de arranque: eager (usuario aterriza aquí).
import { LoginPage } from '@/pages/LoginPage'
import { AuthCallbackPage } from '@/pages/AuthCallbackPage'
import { HomePage } from '@/pages/HomePage'
// Rutas pesadas o de uso ocasional: lazy — se descargan on-demand.
const DestinationPage  = lazy(() => import('@/pages/DestinationPage').then(m => ({ default: m.DestinationPage })))
const TripsPage        = lazy(() => import('@/pages/TripsPage').then(m => ({ default: m.TripsPage })))
const TripDetailPage   = lazy(() => import('@/pages/TripDetailPage').then(m => ({ default: m.TripDetailPage })))
const TripPhotosPage   = lazy(() => import('@/pages/TripPhotosPage').then(m => ({ default: m.TripPhotosPage })))
const TripJournalPage  = lazy(() => import('@/pages/TripJournalPage').then(m => ({ default: m.TripJournalPage })))
const TripWizardPage   = lazy(() => import('@/pages/TripWizardPage').then(m => ({ default: m.TripWizardPage })))
const ProfilePage      = lazy(() => import('@/pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
const PlacesPage       = lazy(() => import('@/pages/PlacesPage').then(m => ({ default: m.PlacesPage })))
const ExplorePage      = lazy(() => import('@/pages/ExplorePage').then(m => ({ default: m.ExplorePage })))
const AnalysisPage     = lazy(() => import('@/pages/AnalysisPage').then(m => ({ default: m.AnalysisPage })))

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
      <Suspense fallback={<div className="min-h-[60vh]" />}>
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
      </Suspense>
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
    <ErrorBoundary>
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
    </ErrorBoundary>
  )
}

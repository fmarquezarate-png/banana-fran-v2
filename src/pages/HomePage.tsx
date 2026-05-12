import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useTrips } from '@/hooks/useTrips'

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
}

export function HomePage() {
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  const { trips, loading } = useTrips(user?.id)

  const userName = profile?.full_name ?? null

  const upcoming = trips.filter(t => {
    if (t.status_override === 'completed' || t.status_override === 'cancelled') return false
    if (t.end_date && new Date(t.end_date) < new Date()) return false
    return true
  })

  return (
    <main className="max-w-lg mx-auto px-4 py-6 pb-24 sm:pb-8">

      {/* Saludo */}
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
          {userName ? `Hola, ${userName}` : 'Hola'} 👋
          <br />
          <span className="text-egeo">¿A dónde vamos?</span>
        </h1>
        <p className="text-gray-400 text-sm mt-2">
          Planifica tu próxima aventura o explora destinos.
        </p>
      </div>

      {/* 3 opciones */}
      <div className="space-y-3 mb-8">
        <Link
          to="/viajes/nuevo?mode=quiz"
          className="flex items-center gap-4 bg-egeo text-white rounded-2xl p-5 shadow-lg
                     hover:bg-egeo/90 active:scale-[0.98] transition-all duration-200"
        >
          <span className="text-3xl flex-shrink-0">🎯</span>
          <div className="min-w-0">
            <p className="font-display font-bold text-lg leading-tight">Responder cuestionario</p>
            <p className="text-sm text-white/70 mt-0.5">
              Encuentra tu destino ideal según tus preferencias
            </p>
          </div>
          <span className="ml-auto text-white/60 text-2xl flex-shrink-0">→</span>
        </Link>

        <Link
          to="/viajes/nuevo?mode=direct"
          className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm
                     hover:shadow-md active:scale-[0.98] transition-all duration-200"
        >
          <span className="text-3xl flex-shrink-0">📍</span>
          <div className="min-w-0">
            <p className="font-display font-bold text-lg text-gray-900 leading-tight">Ya sé dónde voy</p>
            <p className="text-sm text-gray-400 mt-0.5">
              Elige directamente el destino o el país
            </p>
          </div>
          <span className="ml-auto text-gray-300 text-2xl flex-shrink-0">→</span>
        </Link>

        <Link
          to="/explorar"
          className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm
                     hover:shadow-md active:scale-[0.98] transition-all duration-200"
        >
          <span className="text-3xl flex-shrink-0">🗺</span>
          <div className="min-w-0">
            <p className="font-display font-bold text-lg text-gray-900 leading-tight">Ver mapa de destinos</p>
            <p className="text-sm text-gray-400 mt-0.5">
              Explora todos los destinos disponibles
            </p>
          </div>
          <span className="ml-auto text-gray-300 text-2xl flex-shrink-0">→</span>
        </Link>
      </div>

      {/* Próximos viajes */}
      {loading ? (
        <div className="flex justify-center py-8">
          <span className="text-3xl animate-pulse">🍌</span>
        </div>
      ) : upcoming.length > 0 && (
        <section>
          <h2 className="font-display font-bold text-gray-900 text-xl mb-3">
            Próximos viajes
          </h2>
          <div className="space-y-3">
            {upcoming.map(t => (
              <Link
                key={t.id}
                to={`/viajes/${t.id}`}
                className="card p-4 block hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display font-bold text-gray-900 truncate">{t.name}</p>
                    {t.start_date && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        📅 {formatDate(t.start_date)}
                      </p>
                    )}
                  </div>
                  <span className="text-gray-300 text-xl flex-shrink-0">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

    </main>
  )
}

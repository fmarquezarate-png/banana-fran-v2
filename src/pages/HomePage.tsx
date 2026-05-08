import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useTrips } from '@/hooks/useTrips'
import type { Trip } from '@/types/database'
import { DESTINATIONS } from '@/data/destinations'

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
}

function isPastTrip(trip: Trip): boolean {
  if (trip.status_override === 'completed') return true
  if (!trip.end_date) return false
  return new Date(trip.end_date) < new Date()
}

function PastTripCard({ trip }: { trip: Trip }) {
  const dest = trip.destination_slug
    ? DESTINATIONS.find(d => d.id === trip.destination_slug)
    : null

  return (
    <Link
      to={`/viajes/${trip.id}`}
      className="group relative rounded-2xl overflow-hidden block"
      style={{ minHeight: '160px' }}
    >
      {/* Imagen de fondo */}
      {dest ? (
        <img
          src={dest.images[0]}
          alt={dest.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700
                     group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
      )}

      {/* Overlay melancólico */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
      <div className="absolute inset-0 bg-black/20 mix-blend-multiply" />

      {/* Filtro sepia suave */}
      <div className="absolute inset-0 opacity-30"
        style={{ background: 'linear-gradient(135deg, rgba(120,80,40,0.4) 0%, transparent 60%)' }} />

      {/* Contenido */}
      <div className="relative p-4 h-full flex flex-col justify-end" style={{ minHeight: '160px' }}>
        <div>
          {dest && (
            <p className="text-white/50 text-xs mb-0.5 font-medium tracking-wide">{dest.country}</p>
          )}
          <p className="text-white font-display font-bold text-lg leading-tight">{trip.name}</p>
          <div className="flex items-center gap-3 mt-1.5">
            {trip.start_date && (
              <span className="text-white/50 text-xs">{formatDate(trip.start_date)}</span>
            )}
            <span className="text-white/30 text-xs">·</span>
            <span className="text-white/40 text-xs italic">
              {dest?.tagline ?? 'Un recuerdo guardado'}
            </span>
          </div>
        </div>
      </div>

      {/* Badge "Completado" */}
      <div className="absolute top-3 right-3">
        <span className="bg-white/15 backdrop-blur-sm text-white/70 text-[10px] font-semibold
                         px-2 py-0.5 rounded-full tracking-wide">
          ✓ Realizado
        </span>
      </div>
    </Link>
  )
}

export function HomePage() {
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  const { trips, loading } = useTrips(user?.id)

  const userName = profile?.full_name ?? null
  const pastTrips = trips.filter(isPastTrip)

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
          Planifica tu próxima aventura o revive las anteriores.
        </p>
      </div>

      {/* CTA principal */}
      <Link
        to="/viajes/nuevo"
        className="flex items-center gap-4 bg-egeo text-white rounded-2xl p-5 shadow-lg
                   hover:bg-egeo/90 active:scale-[0.98] transition-all duration-200 mb-8"
      >
        <span className="text-4xl flex-shrink-0">🧭</span>
        <div className="min-w-0">
          <p className="font-display font-bold text-lg leading-tight">Planificar nuevo viaje</p>
          <p className="text-sm text-white/70 mt-0.5">
            Encuentra tu destino ideal y organiza cada detalle
          </p>
        </div>
        <span className="ml-auto text-white/60 text-2xl flex-shrink-0">→</span>
      </Link>

      {/* Viajes pasados */}
      {loading ? (
        <div className="flex justify-center py-12">
          <span className="text-3xl animate-pulse">🍌</span>
        </div>
      ) : pastTrips.length > 0 ? (
        <section>
          <div className="flex items-baseline gap-2 mb-4">
            <h2 className="font-display font-bold text-gray-900 text-xl">Tus aventuras</h2>
            <span className="text-gray-400 text-sm">{pastTrips.length} viaje{pastTrips.length !== 1 ? 's' : ''}</span>
          </div>
          <p className="text-gray-400 text-xs mb-4 leading-relaxed italic">
            Cada viaje es un capítulo escrito a mano. Toca uno para revivir los recuerdos.
          </p>
          <div className="space-y-3">
            {pastTrips.map(t => <PastTripCard key={t.id} trip={t} />)}
          </div>
        </section>
      ) : (
        <section className="text-center py-10">
          <span className="text-6xl block mb-4">🌍</span>
          <p className="font-display font-bold text-gray-700 text-xl mb-2">Tu historia empieza aquí</p>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
            Cuando completes tu primer viaje, aparecerá aquí como un recuerdo guardado para siempre.
          </p>
        </section>
      )}

    </main>
  )
}

import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useTrips } from '@/hooks/useTrips'
import type { Trip } from '@/types/database'

function getTripStatus(trip: Trip): { label: string; color: string } {
  if (trip.status_override) {
    const map: Record<string, { label: string; color: string }> = {
      planning:  { label: 'Planificando', color: 'bg-egeo/10 text-egeo' },
      upcoming:  { label: 'Próximo',      color: 'bg-arena/20 text-arena-dark' },
      ongoing:   { label: 'En curso',     color: 'bg-green-100 text-green-700' },
      completed: { label: 'Completado',   color: 'bg-gray-100 text-gray-500' },
      cancelled: { label: 'Cancelado',    color: 'bg-red-50 text-red-400' },
    }
    return map[trip.status_override] ?? { label: trip.status_override, color: 'bg-gray-100 text-gray-500' }
  }
  const now = new Date()
  if (!trip.start_date) return { label: 'Planificando', color: 'bg-egeo/10 text-egeo' }
  const start = new Date(trip.start_date)
  const end = trip.end_date ? new Date(trip.end_date) : null
  if (end && now > end) return { label: 'Completado', color: 'bg-gray-100 text-gray-500' }
  if (now >= start && (!end || now <= end)) return { label: 'En curso', color: 'bg-green-100 text-green-700' }
  return { label: 'Próximo', color: 'bg-arena/20 text-arena-dark' }
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function TripCard({ trip }: { trip: Trip }) {
  const status = getTripStatus(trip)
  const days = trip.start_date && trip.end_date
    ? Math.round((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / 86400000)
    : null

  return (
    <Link to={`/viajes/${trip.id}`} className="card p-5 block hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display font-bold text-gray-900 truncate">{trip.name}</h3>
          {trip.description && (
            <p className="text-sm text-gray-400 mt-0.5 truncate">{trip.description}</p>
          )}
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${status.color}`}>
          {status.label}
        </span>
      </div>
      <div className="flex gap-4 mt-3 text-xs text-gray-400">
        <span>📅 {formatDate(trip.start_date)}</span>
        {days !== null && <span>⏱ {days} días</span>}
      </div>
    </Link>
  )
}

export function TripsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { trips, loading } = useTrips(user?.id)

  const active = trips.filter((t) => !['Completado', 'Cancelado'].includes(getTripStatus(t).label))
  const past = trips.filter((t) => getTripStatus(t).label === 'Completado' || t.status_override === 'completed')

  return (
    <main className="max-w-lg mx-auto px-4 py-6 pb-24 sm:pb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold text-gray-900">Mis viajes</h1>
        <button onClick={() => navigate('/viajes/nuevo')} className="btn-primary text-sm py-2 px-4">
          + Nuevo
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="text-3xl animate-pulse">🍌</span>
        </div>
      ) : trips.length === 0 ? (
        <div className="card p-10 text-center">
          <span className="text-5xl block mb-3">✈️</span>
          <p className="font-display font-bold text-gray-800 mb-1">Sin viajes todavía</p>
          <p className="text-gray-400 text-sm mb-4">Crea tu primer viaje para empezar a planificar.</p>
          <button onClick={() => navigate('/viajes/nuevo')} className="btn-primary text-sm">
            Crear primer viaje
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                En planificación y próximos
              </h2>
              <div className="space-y-3">
                {active.map((t) => <TripCard key={t.id} trip={t} />)}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Completados — también visibles en el inicio
              </h2>
              <div className="space-y-3">
                {past.map((t) => <TripCard key={t.id} trip={t} />)}
              </div>
            </section>
          )}
        </div>
      )}

    </main>
  )
}

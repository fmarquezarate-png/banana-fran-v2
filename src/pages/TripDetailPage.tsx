import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useTrips } from '@/hooks/useTrips'
import type { Trip } from '@/types/database'

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

function tripDays(trip: Trip): number | null {
  if (!trip.start_date || !trip.end_date) return null
  return Math.round(
    (new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / 86400000
  )
}

export function TripDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { trips, deleteTrip } = useTrips(user?.id)
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    // Busca primero en caché local del hook
    const cached = trips.find((t) => t.id === id)
    if (cached) {
      setTrip(cached)
      setLoading(false)
      return
    }
    // Si no está en caché, carga directo
    supabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) toast.error('Error cargando el viaje')
        else setTrip(data)
        setLoading(false)
      })
  }, [id, trips])

  async function handleDelete() {
    if (!trip) return
    if (!confirm(`¿Eliminar "${trip.name}"? Esta acción no se puede deshacer.`)) return
    try {
      await deleteTrip(trip.id)
      toast.success('Viaje eliminado')
      window.history.back()
    } catch {
      toast.error('Error eliminando el viaje')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="text-4xl animate-pulse">🍌</span>
      </div>
    )
  }

  if (!trip) {
    return (
      <main className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-gray-400">Viaje no encontrado.</p>
        <Link to="/viajes" className="text-egeo text-sm mt-4 block hover:underline">
          ← Mis viajes
        </Link>
      </main>
    )
  }

  const days = tripDays(trip)

  return (
    <main className="max-w-lg mx-auto px-4 py-6 pb-24 sm:pb-8">
      {/* Cabecera */}
      <div className="mb-6">
        <Link to="/viajes" className="text-sm text-gray-400 hover:text-egeo transition-colors">
          ← Mis viajes
        </Link>
        <h1 className="font-display text-3xl font-bold text-gray-900 mt-2 leading-tight">
          {trip.name}
        </h1>
        {trip.description && (
          <p className="text-gray-500 text-sm mt-1">{trip.description}</p>
        )}
      </div>

      <div className="space-y-4">

        {/* Fechas */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">
            Fechas
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Salida</p>
              <p className="font-medium text-gray-900 text-sm">{formatDate(trip.start_date)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Vuelta</p>
              <p className="font-medium text-gray-900 text-sm">{formatDate(trip.end_date)}</p>
            </div>
          </div>
          {days !== null && (
            <p className="text-xs text-gray-400 mt-3">⏱ {days} días de viaje</p>
          )}
        </div>

        {/* Accesos rápidos a sub-secciones */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            to={`/viajes/${trip.id}/fotos`}
            className="card p-5 flex flex-col items-center gap-2 hover:shadow-md transition-shadow text-center"
          >
            <span className="text-3xl">📷</span>
            <span className="font-semibold text-gray-800 text-sm">Fotos</span>
            <span className="text-xs text-gray-400">Galería del viaje</span>
          </Link>

          <Link
            to={`/viajes/${trip.id}/diario`}
            className="card p-5 flex flex-col items-center gap-2 hover:shadow-md transition-shadow text-center"
          >
            <span className="text-3xl">📔</span>
            <span className="font-semibold text-gray-800 text-sm">Diario</span>
            <span className="text-xs text-gray-400">Bitácora del viaje</span>
          </Link>
        </div>

        {/* Documentos — placeholder hasta Tarea 11 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">📄 Documentos</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              Próximamente
            </span>
          </div>
          <p className="text-sm text-gray-400">
            Tickets de vuelo, reservas de hotel, seguros…
          </p>
        </div>

        {/* Lugares — placeholder hasta Tarea 13 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">📍 Lugares y reseñas</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              Próximamente
            </span>
          </div>
          <p className="text-sm text-gray-400">
            Restaurantes, playas, museos visitados con tu valoración.
          </p>
        </div>

        {/* Eliminar */}
        <button
          onClick={handleDelete}
          className="w-full text-sm text-gray-300 hover:text-red-400 transition-colors py-3"
        >
          Eliminar viaje
        </button>
      </div>
    </main>
  )
}

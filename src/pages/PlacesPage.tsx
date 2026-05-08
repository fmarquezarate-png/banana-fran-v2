import { useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useTrips } from '@/hooks/useTrips'
import { DESTINATIONS } from '@/data/destinations'
import type { Trip } from '@/types/database'

function isPastTrip(trip: Trip): boolean {
  if (trip.status_override === 'completed') return true
  if (trip.end_date && new Date(trip.end_date) < new Date()) return true
  return false
}

interface PlacePin {
  tripId: string
  tripName: string
  destName: string
  country: string
  lat: number
  lng: number
  past: boolean
  image: string
}

export function PlacesPage() {
  const { user } = useAuth()
  const { trips, loading } = useTrips(user?.id)

  const pins = useMemo<PlacePin[]>(() => {
    const result: PlacePin[] = []
    for (const t of trips) {
      if (!t.destination_slug) continue
      const slugs = t.destination_slug.split('+')
      for (const slug of slugs) {
        const dest = DESTINATIONS.find(d => d.id === slug)
        if (!dest) continue
        result.push({
          tripId:   t.id,
          tripName: t.name,
          destName: dest.name,
          country:  dest.country,
          lat:      dest.coords[0],
          lng:      dest.coords[1],
          past:     isPastTrip(t),
          image:    dest.images[0],
        })
      }
    }
    return result
  }, [trips])

  const planned   = pins.filter(p => !p.past)
  const completed = pins.filter(p => p.past)

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 pb-24 sm:pb-8">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold text-gray-900">Mis lugares</h1>
        <p className="text-sm text-gray-500 mt-1">
          <span className="inline-block w-3 h-3 rounded-full bg-yellow-400 mr-1.5 align-middle" />
          {planned.length} planificados
          <span className="mx-3 text-gray-300">·</span>
          <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1.5 align-middle" />
          {completed.length} completados
        </p>
      </div>

      {!user ? (
        <div className="py-16 text-center">
          <span className="text-5xl block mb-4">🗺️</span>
          <p className="font-display font-bold text-gray-800 text-lg mb-2">Inicia sesión para ver tu mapa</p>
          <Link to="/perfil" className="btn-primary text-sm">Iniciar sesión</Link>
        </div>
      ) : loading ? (
        <div className="h-[420px] rounded-2xl bg-gray-100 animate-pulse" />
      ) : pins.length === 0 ? (
        <div className="py-16 text-center">
          <span className="text-5xl block mb-4">🌍</span>
          <p className="font-display font-bold text-gray-800 text-lg mb-2">Tu mapa está vacío</p>
          <p className="text-gray-400 text-sm mb-5">Planifica tu primer viaje y aparecerá aquí</p>
          <Link to="/viajes/nuevo" className="btn-primary text-sm">Planificar viaje →</Link>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm h-[420px] sm:h-[540px]">
          <MapContainer
            center={[30, 15]}
            zoom={2}
            scrollWheelZoom
            className="h-full w-full"
            minZoom={2}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {pins.map(pin => (
              <CircleMarker
                key={pin.tripId}
                center={[pin.lat, pin.lng]}
                radius={10}
                pathOptions={{
                  color:       pin.past ? '#16a34a' : '#ca8a04',
                  fillColor:   pin.past ? '#22c55e' : '#facc15',
                  fillOpacity: 0.9,
                  weight: 2.5,
                }}
              >
                <Popup>
                  <div className="min-w-[140px]">
                    <img src={pin.image} alt={pin.destName}
                      className="w-full h-20 object-cover rounded-lg mb-2" />
                    <p className="font-bold text-sm text-gray-900">{pin.destName}</p>
                    <p className="text-xs text-gray-500 mb-1">{pin.country}</p>
                    <p className="text-xs font-medium mb-2 truncate">
                      {pin.past
                        ? <span className="text-green-600">✓ Viaje completado</span>
                        : <span className="text-yellow-600">📅 Planificado</span>}
                    </p>
                    <p className="text-xs text-gray-400 mb-2 italic truncate">{pin.tripName}</p>
                    <Link
                      to={`/viajes/${pin.tripId}`}
                      className="text-xs bg-egeo text-white px-3 py-1.5 rounded-full block text-center hover:bg-egeo/90"
                    >
                      Ver viaje →
                    </Link>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      )}

      {/* Lista resumen */}
      {pins.length > 0 && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {completed.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                ✅ Completados ({completed.length})
              </p>
              <div className="space-y-2">
                {completed.map(p => (
                  <Link key={p.tripId} to={`/viajes/${p.tripId}`}
                    className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100 hover:shadow-sm transition-shadow">
                    <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{p.destName}</p>
                      <p className="text-xs text-gray-400 truncate">{p.tripName}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {planned.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                📅 Planificados ({planned.length})
              </p>
              <div className="space-y-2">
                {planned.map(p => (
                  <Link key={p.tripId} to={`/viajes/${p.tripId}`}
                    className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100 hover:shadow-sm transition-shadow">
                    <div className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{p.destName}</p>
                      <p className="text-xs text-gray-400 truncate">{p.tripName}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  )
}

import { useMemo, useState } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import worldAtlas from 'world-atlas/countries-110m.json'
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

// ISO 3166-1 numeric codes for the countries in our destination list
function getIsoCodes(country: string): number[] {
  const c = country.toLowerCase()
  const codes: number[] = []
  if (c.includes('albania')) codes.push(8)
  if (c.includes('croacia')) codes.push(191)
  if (c.includes('eslovenia') || c.includes('slovenia')) codes.push(705)
  if (c.includes('españa')) codes.push(724)
  if (c.includes('grecia')) codes.push(300)
  if (c.includes('hungría') || c.includes('hungria')) codes.push(348)
  if (c.includes('italia')) codes.push(380)
  if (c.includes('marruecos')) codes.push(504)
  if (c.includes('montenegro')) codes.push(499)
  if (c.includes('portugal')) codes.push(620)
  if (c.includes('reino unido') || c.includes('escocia')) codes.push(826)
  if (c.includes('república checa') || c.includes('chequia') || c.includes('praga')) codes.push(203)
  if (c.includes('turquía') || c.includes('turquia')) codes.push(792)
  return codes
}

interface TripCountry {
  destName: string
  tripName: string
  tripId: string
  past: boolean
}

export function PlacesPage() {
  const { user } = useAuth()
  const { trips, loading } = useTrips(user?.id)
  const [tooltip, setTooltip] = useState<string | null>(null)

  // Map ISO numeric → status (visited > planned)
  const countryStatus = useMemo(() => {
    const status = new Map<number, 'visited' | 'planned'>()
    const trips_by_country = new Map<number, TripCountry[]>()

    for (const t of trips) {
      if (!t.destination_slug) continue
      const slugs = t.destination_slug.split('+')
      for (const slug of slugs) {
        const dest = DESTINATIONS.find(d => d.id === slug)
        if (!dest) continue
        const past = isPastTrip(t)
        const codes = getIsoCodes(dest.country)
        for (const code of codes) {
          const prev = status.get(code)
          if (prev !== 'visited') {
            status.set(code, past ? 'visited' : 'planned')
          }
          const arr = trips_by_country.get(code) ?? []
          arr.push({ destName: dest.shortName, tripName: t.name, tripId: t.id, past })
          trips_by_country.set(code, arr)
        }
      }
    }
    return { status, trips_by_country }
  }, [trips])

  // Summary lists
  const { visited, planned } = useMemo(() => {
    const visited: { destName: string; tripName: string; tripId: string }[] = []
    const planned: { destName: string; tripName: string; tripId: string }[] = []
    const seenTrips = new Set<string>()

    for (const t of trips) {
      if (!t.destination_slug || seenTrips.has(t.id)) continue
      seenTrips.add(t.id)
      const slugs = t.destination_slug.split('+')
      const primarySlug = slugs[0]
      const dest = DESTINATIONS.find(d => d.id === primarySlug)
      if (!dest) continue
      const item = { destName: dest.name, tripName: t.name, tripId: t.id }
      if (isPastTrip(t)) visited.push(item)
      else planned.push(item)
    }
    return { visited, planned }
  }, [trips])

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 pb-24 sm:pb-8">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Mis lugares</h1>
          <p className="text-sm text-gray-500 mt-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-green-400 mr-1.5 align-middle" />
            {visited.length} visitados
            <span className="mx-3 text-gray-300">·</span>
            <span className="inline-block w-3 h-3 rounded-sm bg-yellow-300 mr-1.5 align-middle" />
            {planned.length} planificados
          </p>
        </div>
        <Link to="/viajes/nuevo" className="btn-primary text-sm flex-shrink-0">+ Nuevo viaje</Link>
      </div>

      {!user ? (
        <div className="py-16 text-center">
          <span className="text-5xl block mb-4">🗺️</span>
          <p className="font-display font-bold text-gray-800 text-lg mb-2">Inicia sesión para ver tu mapa</p>
          <Link to="/perfil" className="btn-primary text-sm">Iniciar sesión</Link>
        </div>
      ) : loading ? (
        <div className="h-[420px] rounded-2xl bg-gray-100 animate-pulse" />
      ) : (
        <>
          {/* Choropleth map */}
          <div className="relative rounded-2xl overflow-hidden border border-blue-100 bg-blue-50 shadow-sm">
            {tooltip && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-black/75 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none">
                {tooltip}
              </div>
            )}
            <ComposableMap
              width={800}
              height={380}
              projectionConfig={{ scale: 130, center: [15, 20] }}
              style={{ width: '100%', height: 'auto' }}
            >
              <Geographies geography={worldAtlas}>
                {({ geographies }) =>
                  geographies.map(geo => {
                    const id = Number(geo.id)
                    const st = countryStatus.status.get(id)
                    const fill = st === 'visited'
                      ? '#4ade80'
                      : st === 'planned'
                        ? '#fde047'
                        : '#e2e8f0'
                    const hoverFill = st === 'visited' ? '#22c55e' : st === 'planned' ? '#facc15' : '#cbd5e1'
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={fill}
                        stroke="#ffffff"
                        strokeWidth={0.5}
                        style={{
                          default: { outline: 'none' },
                          hover: { outline: 'none', fill: hoverFill, cursor: st ? 'pointer' : 'default' },
                          pressed: { outline: 'none' },
                        }}
                        onMouseEnter={() => {
                          if (!st) return
                          const list = countryStatus.trips_by_country.get(id)
                          const names = [...new Set(list?.map(x => x.destName) ?? [])]
                          setTooltip(names.join(' · '))
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    )
                  })
                }
              </Geographies>
            </ComposableMap>

            {/* Legend */}
            <div className="absolute bottom-3 right-3 flex gap-3 text-xs bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-sm bg-green-400 flex-shrink-0" />
                Visitado
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-sm bg-yellow-300 flex-shrink-0" />
                Planificado
              </span>
            </div>
          </div>

          {/* Empty state for no trips */}
          {visited.length === 0 && planned.length === 0 && (
            <div className="mt-8 py-10 text-center">
              <span className="text-5xl block mb-4">🌍</span>
              <p className="font-display font-bold text-gray-800 text-lg mb-2">Tu mapa está vacío</p>
              <p className="text-gray-400 text-sm mb-5">Planifica tu primer viaje y aparecerá aquí en el mapa</p>
              <Link to="/viajes/nuevo" className="btn-primary text-sm">Planificar viaje →</Link>
            </div>
          )}

          {/* Summary lists */}
          {(visited.length > 0 || planned.length > 0) && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {visited.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    ✅ Visitados ({visited.length})
                  </p>
                  <div className="space-y-2">
                    {visited.map(p => (
                      <Link key={p.tripId} to={`/viajes/${p.tripId}`}
                        className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100 hover:shadow-sm transition-shadow">
                        <span className="w-2.5 h-2.5 rounded-sm bg-green-400 flex-shrink-0" />
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
                        <span className="w-2.5 h-2.5 rounded-sm bg-yellow-300 flex-shrink-0" />
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
        </>
      )}
    </main>
  )
}

import { useMemo, useState } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
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

// ISO 3166-1 numeric codes — tabla exhaustiva de países en el catálogo.
// Cada entrada usa una raíz que aparece en la country string del destino
// (case-insensitive, subcadena). Añadir aliases con | si hace falta.
const ISO_TABLE: Array<[RegExp, number]> = [
  // Europa
  [/albania/, 8], [/alemania|germany/, 276], [/andorra/, 20], [/austria/, 40],
  [/belgica|bélgica/, 56], [/bielorrusia/, 112], [/bosnia/, 70], [/bulgaria/, 100],
  [/chipre/, 196], [/croacia/, 191], [/dinamarca/, 208], [/escocia|reino unido|inglaterra|gales|irlanda del norte/, 826],
  [/eslovaquia/, 703], [/eslovenia|slovenia/, 705], [/españa/, 724], [/estonia/, 233],
  [/finlandia|laponia/, 246], [/francia/, 250], [/grecia/, 300], [/hungría|hungria/, 348],
  [/irlanda/, 372], [/islandia/, 352], [/italia/, 380], [/letonia/, 428],
  [/lituania/, 440], [/luxemburgo/, 442], [/macedonia/, 807], [/malta/, 470],
  [/moldavia/, 498], [/mónaco|monaco/, 492], [/montenegro/, 499], [/noruega/, 578],
  [/países bajos|paises bajos|holanda/, 528], [/polonia/, 616], [/portugal/, 620],
  [/república checa|chequia/, 203], [/rumanía|rumania/, 642], [/serbia/, 688],
  [/suecia/, 752], [/suiza/, 756], [/turquía|turquia/, 792], [/ucrania/, 804],
  [/vaticano/, 336], [/liechtenstein/, 438],
  // Cáucaso
  [/georgia/, 268], [/armenia/, 51], [/azerbaiyán|azerbaiyan/, 31],
  // Américas
  [/argentina/, 32], [/bahamas/, 44], [/barbados/, 52], [/belice/, 84],
  [/bolivia/, 68], [/brasil/, 76], [/canadá|canada/, 124], [/chile/, 152],
  [/colombia/, 170], [/costa rica/, 188], [/cuba/, 192], [/curazao/, 531],
  [/ecuador/, 218], [/el salvador/, 222], [/estados unidos|usa/, 840],
  [/guatemala/, 320], [/haití|haiti/, 332], [/honduras/, 340], [/jamaica/, 388],
  [/méxico|mexico/, 484], [/nicaragua/, 558], [/panamá|panama/, 591],
  [/paraguay/, 600], [/perú|peru/, 604], [/puerto rico/, 630],
  [/república dominicana|dominicana/, 214], [/trinidad/, 780],
  [/uruguay/, 858], [/venezuela/, 862],
  // Asia
  [/afganistán|afganistan/, 4], [/bangladés|bangladesh/, 50], [/bután|butan|bhutan/, 64],
  [/brunéi|brunei/, 96], [/camboya/, 116], [/china/, 156], [/corea del sur|corea/, 410],
  [/corea del norte/, 408], [/filipinas/, 608], [/hong kong/, 344], [/india/, 356],
  [/indonesia|bali/, 360], [/japón|japon/, 392], [/kazajistán|kazajistan/, 398],
  [/kirguistán|kirguistan|kyrgyz/, 417], [/laos/, 418], [/malasia/, 458],
  [/maldivas/, 462], [/mongolia/, 496], [/myanmar/, 104], [/nepal/, 524],
  [/pakistan/, 586], [/singapur/, 702], [/sri lanka/, 144],
  [/tailandia/, 764], [/taiwan|taiwán/, 158], [/tayikistán|tayikistan/, 762],
  [/uzbekistán|uzbekistan/, 860], [/vietnam/, 704],
  // Oriente Medio
  [/arabia|saudí|saudita/, 682], [/baréin|bareín|bahrain/, 48], [/catar|qatar/, 634],
  [/emiratos árabes|emirates/, 784], [/irán|iran/, 364], [/irak|iraq/, 368],
  [/israel/, 376], [/jordania/, 400], [/kuwait/, 414], [/líbano|libano/, 422],
  [/omán|oman/, 512], [/palestina/, 275], [/siria/, 760], [/yemen/, 887],
  // África
  [/argelia/, 12], [/cabo verde/, 132], [/egipto/, 818], [/etiopía|etiopia/, 231],
  [/ghana/, 288], [/kenia|kenya/, 404], [/madagascar/, 450], [/malawi/, 454],
  [/mauricio/, 480], [/marruecos/, 504], [/mozambique/, 508], [/namibia/, 516],
  [/nigeria/, 566], [/ruanda|rwanda/, 646], [/senegal/, 686], [/seychelles/, 690],
  [/sudáfrica|sudafrica|south africa/, 710], [/tanzania|tanzanía|zanzibar/, 834],
  [/túnez|tunez|tunisia/, 788], [/uganda/, 800], [/zimbabue|zimbabwe/, 716],
  // Oceanía
  [/australia/, 36], [/fiji|fiyi/, 242], [/nueva zelanda|new zealand/, 554],
  [/papúa nueva guinea|papua/, 598], [/polinesia francesa|tahití|tahiti/, 258],
  [/samoa/, 882], [/tonga/, 776], [/vanuatu/, 548],
]

function getIsoCodes(country: string): number[] {
  const c = country.toLowerCase().replace(/_/g, ' ')
  const codes: number[] = []
  for (const [re, code] of ISO_TABLE) {
    if (re.test(c)) codes.push(code)
  }
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
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState<[number, number]>([15, 20])

  // Map ISO numeric → status (visited > planned)
  const countryStatus = useMemo(() => {
    const status = new Map<number, 'visited' | 'planned'>()
    const trips_by_country = new Map<number, TripCountry[]>()

    for (const t of trips) {
      if (!t.destination_slug) continue
      const slugs = t.destination_slug.split('+')
      for (const slug of slugs) {
        // Handle pais_* slugs (free-text country tracking)
        const countryStr = slug.startsWith('pais_') ? slug.slice(5) : (() => {
          const dest = DESTINATIONS.find(d => d.id === slug)
          return dest?.country ?? null
        })()
        if (!countryStr) continue

        const past = isPastTrip(t)
        const codes = getIsoCodes(countryStr)
        const labelName = slug.startsWith('pais_')
          ? countryStr.charAt(0).toUpperCase() + countryStr.slice(1)
          : (DESTINATIONS.find(d => d.id === slug)?.shortName ?? countryStr)

        for (const code of codes) {
          const prev = status.get(code)
          if (prev !== 'visited') {
            status.set(code, past ? 'visited' : 'planned')
          }
          const arr = trips_by_country.get(code) ?? []
          arr.push({ destName: labelName, tripName: t.name, tripId: t.id, past })
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
      if (seenTrips.has(t.id)) continue
      seenTrips.add(t.id)
      let destName: string
      if (!t.destination_slug) {
        destName = t.name
      } else {
        const primarySlug = t.destination_slug.split('+')[0]
        if (primarySlug.startsWith('pais_')) {
          const cn = primarySlug.slice(5).replace(/_/g, ' ')
          destName = cn.charAt(0).toUpperCase() + cn.slice(1)
        } else {
          const dest = DESTINATIONS.find(d => d.id === primarySlug)
          destName = dest ? dest.name : t.name
        }
      }
      const item = { destName, tripName: t.name, tripId: t.id }
      if (isPastTrip(t)) visited.push(item)
      else planned.push(item)
    }
    return { visited, planned }
  }, [trips])

  const handleZoomIn  = () => setZoom(z => Math.min(z * 2, 8))
  const handleZoomOut = () => setZoom(z => Math.max(z / 2, 1))
  const handleReset   = () => { setZoom(1); setCenter([15, 20]) }

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

            {/* Zoom controls */}
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
              <button
                onClick={handleZoomIn}
                className="w-7 h-7 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm text-gray-700 font-bold text-base flex items-center justify-center hover:bg-white transition-colors"
              >+</button>
              <button
                onClick={handleZoomOut}
                className="w-7 h-7 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm text-gray-700 font-bold text-base flex items-center justify-center hover:bg-white transition-colors"
              >−</button>
              {zoom > 1 && (
                <button
                  onClick={handleReset}
                  className="w-7 h-7 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm text-gray-500 text-xs flex items-center justify-center hover:bg-white transition-colors"
                >↺</button>
              )}
            </div>

            <ComposableMap
              width={800}
              height={380}
              projectionConfig={{ scale: 130, center: [15, 20] }}
              style={{ width: '100%', height: 'auto' }}
            >
              <ZoomableGroup
                zoom={zoom}
                center={center}
                onMoveEnd={({ coordinates, zoom: z }) => { setCenter(coordinates); setZoom(z) }}
                maxZoom={8}
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
              </ZoomableGroup>
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

          {/* Empty state */}
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

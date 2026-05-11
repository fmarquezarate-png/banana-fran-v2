import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { useTrips } from '@/hooks/useTrips'
import { DESTINATIONS } from '@/data/destinations'
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

// Countries available for the map (superset of what we have in DESTINATIONS)
const COUNTRIES_FOR_MAP = [
  'Albania', 'Alemania', 'Austria', 'Bélgica', 'Bulgaria', 'Chipre', 'Croacia',
  'Dinamarca', 'Eslovaquia', 'Eslovenia', 'España', 'Estonia', 'Finlandia', 'Francia',
  'Grecia', 'Hungría', 'Irlanda', 'Islandia', 'Italia', 'Letonia', 'Lituania',
  'Luxemburgo', 'Malta', 'Marruecos', 'Montenegro', 'Noruega', 'Países Bajos',
  'Polonia', 'Portugal', 'Reino Unido', 'República Checa', 'Rumanía',
  'Serbia', 'Suecia', 'Suiza', 'Turquía',
  'Argentina', 'Brasil', 'Chile', 'Colombia', 'Cuba', 'Estados Unidos', 'México', 'Perú',
  'China', 'Egipto', 'India', 'Japón', 'Jordania', 'Kenia', 'Sudáfrica', 'Tailandia', 'Tanzania', 'Túnez', 'Vietnam',
]

function PastTripModal({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (values: { name: string; slug: string | null; year: number; travelers: number; days: number | null }) => Promise<void>
}) {
  const [country, setCountry]   = useState('')
  const [destSlug, setDestSlug] = useState('')
  const [freeCity, setFreeCity] = useState('')
  const [year, setYear]         = useState(new Date().getFullYear() - 1)
  const [travelers, setTravelers] = useState(2)
  const [days, setDays]         = useState<string>('')
  const [saving, setSaving]     = useState(false)

  // Destinations for the selected country
  const countryDests = country
    ? DESTINATIONS.filter(d => {
        const dc = d.country.toLowerCase()
        const cc = country.toLowerCase()
        return dc.includes(cc) || cc.includes(dc.split(/[—·\/]/)[0].trim().toLowerCase())
      })
    : []

  const selectedDest = DESTINATIONS.find(d => d.id === destSlug) ?? null

  // What goes into destination_slug:
  // - known dest id  → e.g. "naxos"
  // - free city + country → "pais_grecia" (for map coloring)
  function resolveSlug(): string | null {
    if (destSlug) return destSlug
    if (country) return `pais_${country.toLowerCase().replace(/\s+/g, '_')}`
    return null
  }

  const cityLabel = destSlug
    ? selectedDest?.shortName ?? destSlug
    : freeCity || country || ''
  const tripName = cityLabel ? `${cityLabel} ${year}` : `Viaje ${year}`

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try { await onCreate({ name: tripName, slug: resolveSlug(), year, travelers, days: days ? Number(days) : null }) }
    finally { setSaving(false) }
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-egeo/50'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl">
        <h2 className="font-display font-bold text-lg text-gray-900 mb-4">Registrar viaje pasado</h2>
        <form onSubmit={handleSubmit} className="space-y-3">

          {/* Step 1: Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
            <select
              value={country}
              onChange={e => { setCountry(e.target.value); setDestSlug(''); setFreeCity('') }}
              className={inputCls}
            >
              <option value="">— Selecciona un país —</option>
              {COUNTRIES_FOR_MAP.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Step 2a: known destinations for this country */}
          {country && countryDests.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destino concreto</label>
              <select
                value={destSlug}
                onChange={e => setDestSlug(e.target.value)}
                className={inputCls}
              >
                <option value="">— Zona general de {country} —</option>
                {countryDests.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Step 2b: free-text city if no known destinations */}
          {country && countryDests.length === 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad / zona</label>
              <input
                type="text"
                value={freeCity}
                onChange={e => setFreeCity(e.target.value)}
                placeholder={`ej: Tokio, Kioto…`}
                className={inputCls}
              />
              <p className="text-xs text-gray-400 mt-1">
                {country} se marcará en el mapa aunque no tengamos destinos cargados.
              </p>
            </div>
          )}

          {/* Year + travelers + days */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
              <input type="number" min={1980} max={new Date().getFullYear()} value={year}
                onChange={e => setYear(Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Viajeros</label>
              <input type="number" min={1} max={20} value={travelers}
                onChange={e => setTravelers(Number(e.target.value))} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duración <span className="text-gray-400 font-normal">(días, opcional)</span>
            </label>
            <input type="number" min={1} max={365} value={days} placeholder="ej: 10"
              onChange={e => setDays(e.target.value)} className={inputCls} />
          </div>

          <p className="text-xs text-gray-400">Nombre del viaje: <strong>{tripName}</strong></p>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 text-sm">Cancelar</button>
            <button type="submit" disabled={saving || !country} className="btn-primary flex-1 text-sm disabled:opacity-50">
              {saving ? 'Guardando…' : '✓ Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function TripsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { trips, loading, createTrip, updateTrip } = useTrips(user?.id)
  const [showPastModal, setShowPastModal] = useState(false)

  async function handleCreatePast({ name, slug, year, travelers, days }: {
    name: string; slug: string | null; year: number; travelers: number; days: number | null
  }) {
    const today = new Date()
    let startDate = `${year}-01-01`
    let endDate: string
    if (days) {
      const end = new Date(year, 11, 31)
      if (end > today) {
        const start = new Date(today)
        start.setDate(start.getDate() - days)
        startDate = start.toISOString().slice(0, 10)
        endDate = today.toISOString().slice(0, 10)
      } else {
        endDate = `${year}-12-31`
        const start = new Date(year, 11, 31 - days)
        startDate = start.toISOString().slice(0, 10)
      }
    } else {
      const dec31 = new Date(year, 11, 31)
      endDate = dec31 < today ? `${year}-12-31` : today.toISOString().slice(0, 10)
    }
    const trip = await createTrip({
      name,
      description: 'Viaje registrado manualmente como pasado',
      start_date: startDate,
      end_date: endDate,
      destination_slug: slug,
      travelers,
    })
    if (trip) await updateTrip(trip.id, { status_override: 'completed' })
    toast.success('¡Viaje registrado!')
    setShowPastModal(false)
  }

  const active = trips.filter((t) => !['Completado', 'Cancelado'].includes(getTripStatus(t).label))
  const past = trips.filter((t) => getTripStatus(t).label === 'Completado' || t.status_override === 'completed')

  return (
    <main className="max-w-lg mx-auto px-4 py-6 pb-24 sm:pb-8">
      {showPastModal && (
        <PastTripModal
          onClose={() => setShowPastModal(false)}
          onCreate={handleCreatePast}
        />
      )}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold text-gray-900">Mis viajes</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowPastModal(true)} className="btn-secondary text-sm py-2 px-3">
            🕰 Pasado
          </button>
          <button onClick={() => navigate('/viajes/nuevo')} className="btn-primary text-sm py-2 px-4">
            + Nuevo
          </button>
        </div>
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

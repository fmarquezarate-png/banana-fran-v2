import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { DESTINATIONS } from '@/data/destinations'
import { AllDestinationsMap } from '@/components/destinations/AllDestinationsMap'

type View = 'mapa' | 'lista'

export function ExplorePage() {
  const [view, setView] = useState<View>('mapa')
  const [search, setSearch] = useState('')

  const sorted = useMemo(() => {
    const q = search.toLowerCase().trim()
    const filtered = q
      ? DESTINATIONS.filter(d =>
          d.name.toLowerCase().includes(q) ||
          d.country.toLowerCase().includes(q) ||
          d.tagline.toLowerCase().includes(q)
        )
      : DESTINATIONS
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'es'))
  }, [search])

  return (
    <main className="max-w-lg mx-auto px-4 py-6 pb-24 sm:pb-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="text-gray-400 hover:text-gray-600 text-xl leading-none">←</Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Explorar destinos</h1>
          <p className="text-gray-400 text-xs mt-0.5">{DESTINATIONS.length} destinos cargados</p>
        </div>
      </div>

      {/* Toggle mapa / lista */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-4 w-fit gap-1">
        <button
          onClick={() => setView('mapa')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            view === 'mapa' ? 'bg-white shadow text-egeo' : 'text-gray-500'
          }`}
        >
          🗺 Mapa
        </button>
        <button
          onClick={() => setView('lista')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            view === 'lista' ? 'bg-white shadow text-egeo' : 'text-gray-500'
          }`}
        >
          ☰ Lista
        </button>
      </div>

      {/* Vista mapa */}
      {view === 'mapa' && (
        <div>
          <AllDestinationsMap destinations={DESTINATIONS} neutralColors />
          <p className="text-xs text-gray-400 text-center mt-2">
            Toca un punto para ver el destino
          </p>
        </div>
      )}

      {/* Vista lista */}
      {view === 'lista' && (
        <div className="space-y-3">
          {/* Buscador */}
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar destino, país o temática…"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-egeo/40"
          />

          {sorted.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">Sin resultados para "{search}"</p>
          )}

          {sorted.map(dest => (
            <Link
              key={dest.id}
              to={`/destino/${dest.id}`}
              className="card p-4 block hover:shadow-md transition-shadow"
            >
              <div className="flex gap-3">
                <img
                  src={dest.images[0]}
                  alt={dest.name}
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-display font-bold text-gray-900 leading-tight">{dest.name}</p>
                  <p className="text-xs text-gray-400 mb-1">{dest.country}</p>
                  <p className="text-xs text-gray-500 leading-snug line-clamp-2">{dest.tagline}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

    </main>
  )
}

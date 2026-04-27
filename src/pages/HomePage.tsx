import { useEffect, useState, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { DESTINATIONS, getDestinationsByCategory, type Destination, type DestinationCategory } from '@/data/destinations'
import { CategoryRow } from '@/components/destinations/CategoryRow'
import { DestinationCard } from '@/components/destinations/DestinationCard'
import { useFavorites } from '@/contexts/FavoritesContext'
import { calcBudget, formatPrice } from '@/lib/budget'

const AllDestinationsMap = lazy(() =>
  import('@/components/destinations/AllDestinationsMap').then(m => ({ default: m.AllDestinationsMap }))
)

type Tab = 'destinos' | 'comparar' | 'favoritos' | 'warning'
type View = 'cards' | 'map'

const TABS: { id: Tab; label: string }[] = [
  { id: 'destinos',  label: 'Destinos' },
  { id: 'comparar',  label: 'Comparar' },
  { id: 'favoritos', label: '⭐ Favoritos' },
  { id: 'warning',   label: '⚠️ Zona Warning' },
]

// ──────────────────────────────────────────────
// Warning Zone
// ──────────────────────────────────────────────
function WarningCard({ dest }: { dest: Destination }) {
  return (
    <Link
      to={`/destino/${dest.id}`}
      className="group relative rounded-2xl overflow-hidden border border-warning-red/20
                 hover:border-warning-red transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="relative h-36 overflow-hidden bg-gray-900">
        <img
          src={dest.images[0]}
          alt={dest.name}
          className="w-full h-full object-cover opacity-60 transition-all duration-500
                     group-hover:opacity-80 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent" />
        <span className="absolute top-2 left-2 text-xs font-bold text-warning-yellow
                         bg-black/70 border border-warning-red/40 px-2 py-0.5 rounded-full">
          ⚠️ Con cautela
        </span>
      </div>
      <div className="p-3 bg-gray-950">
        <p className="font-display font-bold text-warning-yellow text-sm leading-tight truncate">{dest.name}</p>
        <p className="text-gray-500 text-xs mt-0.5 truncate">{dest.country}</p>
        <p className="text-gray-400 text-xs mt-2 line-clamp-2 leading-snug">{dest.tagline}</p>
      </div>
      <div className="h-1 w-full bg-warning-stripes" />
    </Link>
  )
}

function WarningZone({ destinations }: { destinations: Destination[] }) {
  return (
    <div className="min-h-screen">
      <div className="h-3 bg-warning-stripes" />
      <div className="max-w-5xl mx-auto px-4 py-10 pb-24 sm:pb-10">
        <div className="mb-10">
          <p className="font-mono text-xs tracking-[0.3em] uppercase text-warning-red mb-3">⚠ acceso restringido ⚠</p>
          <h1 className="font-display text-5xl sm:text-6xl font-bold text-warning-yellow leading-none mb-4">
            Zona<br />Warning
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-lg">
            Destinos famosos con masificación, precio alto o gestión turística deficiente.
            Con información, se pueden disfrutar — pero con los ojos bien abiertos.
          </p>
        </div>
        <div className="bg-warning-stripes p-0.5 rounded-2xl mb-8">
          <div className="bg-gray-900 rounded-[14px] p-4 flex gap-3">
            <span className="text-2xl flex-shrink-0">🚫</span>
            <div>
              <p className="text-warning-yellow font-bold text-sm mb-1">Antes de entrar, lee esto</p>
              <p className="text-gray-400 text-xs leading-relaxed">
                Estos destinos tienen puntuación negativa no porque sean feos —
                es que el turismo masivo ha destrozado la experiencia real.
                Si vas, te decimos cómo minimizar el daño.
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {destinations.map(dest => <WarningCard key={dest.id} dest={dest} />)}
        </div>
      </div>
      <div className="h-3 bg-warning-stripes" />
    </div>
  )
}

// ──────────────────────────────────────────────
// Favoritos
// ──────────────────────────────────────────────
function FavoritesTab() {
  const { favorites } = useFavorites()
  const favDestinations = DESTINATIONS.filter(d => favorites.includes(d.id))
  const byCat = (['perfect', 'good', 'ok', 'warning'] as DestinationCategory[])
    .map(cat => ({ cat, items: favDestinations.filter(d => d.category === cat) }))
    .filter(g => g.items.length > 0)

  const LABELS: Record<DestinationCategory, string> = {
    perfect: '🔥 Match perfecto', good: '👍 Muy buenos', ok: '👌 Están bien', warning: '⚠️ Con cautela',
  }

  if (favorites.length === 0) {
    return (
      <main className="max-w-lg mx-auto px-4 py-20 text-center pb-24 sm:pb-8">
        <span className="text-6xl block mb-5">⭐</span>
        <p className="font-display font-bold text-gray-900 text-2xl mb-3">Sin favoritos todavía</p>
        <p className="text-gray-400 text-sm leading-relaxed">
          Pulsa ★ en cualquier destino para guardarlo aquí.
        </p>
      </main>
    )
  }

  return (
    <main className="py-6 pb-24 sm:pb-8">
      <div className="px-4 mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900">Mis favoritos</h1>
        <p className="text-gray-400 text-sm mt-1">{favorites.length} guardado{favorites.length !== 1 ? 's' : ''}</p>
      </div>
      {byCat.map(({ cat, items }) => (
        <section key={cat} className="mb-8">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{LABELS[cat]}</p>
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
            {items.map(dest => <DestinationCard key={dest.id} dest={dest} />)}
          </div>
        </section>
      ))}
    </main>
  )
}

// ──────────────────────────────────────────────
// Comparar
// ──────────────────────────────────────────────
function CompareTab() {
  const [idA, setIdA] = useState('')
  const [idB, setIdB] = useState('')

  const destA = DESTINATIONS.find(d => d.id === idA)
  const destB = DESTINATIONS.find(d => d.id === idB)

  const groups = [
    { label: '🔥 Match perfecto', dests: DESTINATIONS.filter(d => d.category === 'perfect') },
    { label: '👍 Muy bueno',      dests: DESTINATIONS.filter(d => d.category === 'good') },
    { label: '👌 Está bien',      dests: DESTINATIONS.filter(d => d.category === 'ok') },
    { label: '⚠️ Con cautela',    dests: DESTINATIONS.filter(d => d.category === 'warning') },
  ]

  function DestSelect({ value, onChange, exclude }: { value: string; onChange: (v: string) => void; exclude: string }) {
    return (
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                   focus:outline-none focus:ring-2 focus:ring-egeo/50 bg-white"
      >
        <option value="">— Elige destino —</option>
        {groups.map(g => (
          <optgroup key={g.label} label={g.label}>
            {g.dests.filter(d => d.id !== exclude).map(d => (
              <option key={d.id} value={d.id}>{d.name} — {d.country}</option>
            ))}
          </optgroup>
        ))}
      </select>
    )
  }

  function Row({ label, value }: { label: string; value: string }) {
    return (
      <div className="bg-gray-50 rounded-lg px-3 py-2">
        <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-xs font-medium text-gray-700 mt-0.5 leading-snug">{value}</p>
      </div>
    )
  }

  function DestColumn({ dest }: { dest: Destination }) {
    const budget = calcBudget(dest, 7, 'medio', false)
    return (
      <div className="flex-1 min-w-0">
        <Link to={`/destino/${dest.id}`}>
          <img src={dest.images[0]} alt={dest.name} className="w-full h-28 object-cover rounded-xl mb-3" />
        </Link>
        <p className="font-display font-bold text-gray-900 text-base leading-tight">{dest.name}</p>
        <p className="text-xs text-gray-500 mb-2">{dest.country}</p>
        <p className="text-xs text-gray-600 italic mb-3 line-clamp-2">"{dest.tagline}"</p>
        <div className="space-y-2">
          <Row label="Match"   value={`${dest.match} ${dest.matchLabel}`} />
          <Row label="Vuelo"   value={dest.facts['vuelo'] ?? dest.facts['flight'] ?? '—'} />
          <Row label="Clima"   value={dest.facts['clima'] ?? dest.facts['temp'] ?? '—'} />
          <Row label="Idioma"  value={dest.facts['idioma'] ?? dest.facts['language'] ?? '—'} />
          <Row label="7 días"  value={`${formatPrice(budget.totalMin)}–${formatPrice(budget.totalMax)}`} />
        </div>
        <Link to={`/destino/${dest.id}`} className="mt-4 block text-center text-sm btn-primary py-2">
          Ver ficha →
        </Link>
      </div>
    )
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 pb-24 sm:pb-8">
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Comparar destinos</h1>
      <p className="text-gray-400 text-sm mb-6">Pon dos destinos cara a cara y decide.</p>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Destino A</p>
          <DestSelect value={idA} onChange={setIdA} exclude={idB} />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Destino B</p>
          <DestSelect value={idB} onChange={setIdB} exclude={idA} />
        </div>
      </div>
      {destA && destB ? (
        <div className="flex gap-4 items-start">
          <DestColumn dest={destA} />
          <div className="flex-shrink-0 pt-32 text-2xl font-bold text-gray-200">vs</div>
          <DestColumn dest={destB} />
        </div>
      ) : (
        <div className="card p-10 text-center text-gray-400 text-sm">
          Selecciona dos destinos para compararlos
        </div>
      )}
    </main>
  )
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────
export function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>('destinos')
  const [view, setView] = useState<View>('cards')

  const perfect = getDestinationsByCategory('perfect')
  const good    = getDestinationsByCategory('good')
  const ok      = getDestinationsByCategory('ok')
  const warning = getDestinationsByCategory('warning')

  const isWarning = activeTab === 'warning'

  useEffect(() => {
    if (isWarning) {
      document.documentElement.setAttribute('data-theme', 'warning')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
    return () => document.documentElement.removeAttribute('data-theme')
  }, [isWarning])

  return (
    <>
      {/* Tab bar */}
      <div className={`sticky top-14 z-40 border-b transition-colors duration-300 ${
        isWarning
          ? 'bg-gray-950 border-warning-red/20'
          : 'bg-white/95 backdrop-blur-sm border-gray-100 shadow-sm'
      }`}>
        <div className="flex overflow-x-auto scrollbar-hide max-w-5xl mx-auto px-2">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id
            const isWarnTab = tab.id === 'warning'
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-4 py-3.5 text-sm font-semibold border-b-2
                            transition-all duration-200 ${
                  isActive
                    ? isWarnTab
                      ? 'border-warning-red text-warning-red'
                      : isWarning ? 'border-egeo text-white' : 'border-egeo text-egeo'
                    : isWarnTab
                      ? isWarning
                        ? 'border-transparent text-warning-red/50 hover:text-warning-red'
                        : 'border-transparent text-warning-red/70 hover:text-warning-red'
                      : isWarning
                        ? 'border-transparent text-gray-500 hover:text-gray-300'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {isWarning ? (
        <WarningZone destinations={warning} />
      ) : activeTab === 'comparar' ? (
        <CompareTab />
      ) : activeTab === 'favoritos' ? (
        <FavoritesTab />
      ) : (
        <main className="py-6 pb-24 sm:pb-8">
          {/* Greeting + toggle */}
          <div className="px-4 mb-6 flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                Hola Fran 👋<br />
                <span className="text-egeo">¿A dónde vamos?</span>
              </h1>
              <p className="text-gray-400 text-sm mt-2">
                {perfect.length + good.length + ok.length + warning.length} destinos analizados para vosotros
              </p>
            </div>
            <div className="flex bg-gray-100 rounded-xl p-1 flex-shrink-0 mt-1">
              <button
                onClick={() => setView('cards')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  view === 'cards' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                }`}
              >
                ⊞ Lista
              </button>
              <button
                onClick={() => setView('map')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  view === 'map' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                }`}
              >
                🗺️ Mapa
              </button>
            </div>
          </div>

          {view === 'map' ? (
            <div className="px-4">
              <div className="flex flex-wrap gap-3 mb-4">
                {[
                  { color: 'bg-egeo',       label: '🔥 Perfecto' },
                  { color: 'bg-arena',      label: '👍 Muy bueno' },
                  { color: 'bg-gray-400',   label: '👌 Está bien' },
                  { color: 'bg-warning-red',label: '⚠️ Cautela' },
                ].map(l => (
                  <span key={l.label} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className={`w-3 h-3 rounded-full ${l.color}`} />
                    {l.label}
                  </span>
                ))}
              </div>
              <Suspense fallback={
                <div className="rounded-2xl bg-gray-100 h-[420px] flex items-center justify-center">
                  <span className="text-gray-400 text-sm">Cargando mapa…</span>
                </div>
              }>
                <AllDestinationsMap destinations={[...perfect, ...good, ...ok, ...warning]} />
              </Suspense>
            </div>
          ) : (
            <>
              <CategoryRow category="perfect" title="🔥 Perfecto para vosotros" subtitle="Los que mejor encajan con lo que buscáis" destinations={perfect} />
              <CategoryRow category="good"    title="👍 Muy bueno"              subtitle="Grandes opciones con algún pero menor"  destinations={good} />
              <CategoryRow category="ok"      title="👌 Está bien"              subtitle="Vale la pena con expectativas claras"    destinations={ok} />
            </>
          )}
        </main>
      )}
    </>
  )
}

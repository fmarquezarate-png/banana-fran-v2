import { useState, lazy, Suspense } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getDestination, type Destination } from '@/data/destinations'
import { BudgetCalculator } from '@/components/destinations/BudgetCalculator'
import { TRIP_DAYS, type TripDays } from '@/lib/budget'

const DestinationMap = lazy(() =>
  import('@/components/destinations/DestinationMap').then((m) => ({ default: m.DestinationMap }))
)

const MATCH_BG: Record<Destination['category'], string> = {
  perfect: 'bg-egeo text-white',
  good: 'bg-arena text-white',
  ok: 'bg-gray-500 text-white',
  warning: 'bg-warning-red text-white',
}

export function DestinationPage() {
  const { id } = useParams<{ id: string }>()
  const dest = id ? getDestination(id) : undefined
  const [planDays, setPlanDays] = useState<TripDays>(7)

  if (!dest) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-400">Destino no encontrado.</p>
        <Link to="/" className="text-egeo text-sm mt-4 block hover:underline">
          ← Volver al catálogo
        </Link>
      </main>
    )
  }

  const isWarning = dest.category === 'warning'
  const plan = getPlan(dest, planDays)
  const storyParagraphs = Array.isArray(dest.story) ? dest.story : [dest.story]
  const fitItems = Array.isArray(dest.fit) ? dest.fit : [dest.fit]

  return (
    <main className="max-w-2xl mx-auto pb-24 sm:pb-8">

      {/* Hero image */}
      <div className="relative h-56 sm:h-72 overflow-hidden bg-gray-200">
        <img
          src={dest.images[0]}
          alt={dest.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <Link
          to="/"
          className="absolute top-4 left-4 bg-black/30 backdrop-blur-sm text-white
                     rounded-full px-3 py-1.5 text-sm font-medium hover:bg-black/50 transition-colors"
        >
          ← Catálogo
        </Link>

        <div className="absolute bottom-4 left-4 right-4">
          <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-2 ${MATCH_BG[dest.category]}`}>
            {dest.match} {dest.matchLabel}
          </span>
          <h1 className="font-display text-3xl font-bold text-white leading-tight drop-shadow">
            {dest.name}
          </h1>
          <p className="text-white/80 text-sm mt-0.5">{dest.country}</p>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-8">

        {/* Tagline */}
        <p className="text-gray-500 text-base leading-relaxed italic">
          "{dest.tagline}"
        </p>

        {/* Warning banner */}
        {isWarning && dest.warning && (
          <div className="bg-warning-stripes rounded-2xl p-0.5">
            <div className="bg-gray-900 rounded-[14px] p-4">
              <p className="text-warning-yellow font-bold text-sm mb-1">⚠️ Ojo con esto</p>
              <p className="text-gray-300 text-sm leading-relaxed">{dest.warning}</p>
            </div>
          </div>
        )}

        {/* Historia */}
        <section>
          <h2 className="font-display text-xl font-bold text-gray-900 mb-2">La historia</h2>
          <div className="space-y-3">
            {storyParagraphs.map((p, i) => (
              <p key={i} className="text-gray-600 leading-relaxed">{p}</p>
            ))}
          </div>
        </section>

        {/* Por qué encaja */}
        <section>
          <h2 className="font-display text-xl font-bold text-gray-900 mb-3">
            {isWarning ? '¿Por qué considerarlo igualmente?' : '¿Por qué os encaja?'}
          </h2>
          <ul className="space-y-2">
            {fitItems.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-600">
                <span className="text-egeo font-bold flex-shrink-0">→</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Facts */}
        <section>
          <h2 className="font-display text-xl font-bold text-gray-900 mb-3">Datos rápidos</h2>
          <div className="space-y-2">
            {Object.entries(dest.facts).map(([key, val]) => (
              <div key={key} className="flex gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-16 flex-shrink-0 pt-0.5">
                  {key}
                </span>
                <span className="text-sm text-gray-700">{val}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Mapa */}
        <section>
          <h2 className="font-display text-xl font-bold text-gray-900 mb-3">Ubicación</h2>
          <Suspense
            fallback={
              <div className="rounded-2xl bg-gray-100 h-52 sm:h-64 flex items-center justify-center">
                <span className="text-gray-400 text-sm">Cargando mapa…</span>
              </div>
            }
          >
            <DestinationMap dest={dest} />
          </Suspense>
        </section>

        {/* Imprescindibles */}
        <section>
          <h2 className="font-display text-xl font-bold text-gray-900 mb-3">
            🗺️ Imprescindibles
          </h2>
          <ul className="space-y-2">
            {dest.musts.map((must, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-700">
                <span className="font-mono text-xs text-gray-300 flex-shrink-0 pt-0.5">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {must}
              </li>
            ))}
          </ul>
        </section>

        {/* Platos */}
        <section>
          <h2 className="font-display text-xl font-bold text-gray-900 mb-3">
            🍽️ Qué comer
          </h2>
          <ul className="space-y-2">
            {dest.dishes.map((dish, i) => (
              <li key={i} className="text-sm text-gray-600 border-l-2 border-coral pl-3 py-0.5">
                {dish}
              </li>
            ))}
          </ul>
        </section>

        {/* Planes */}
        <section>
          <h2 className="font-display text-xl font-bold text-gray-900 mb-3">
            📅 Planes de viaje
          </h2>

          <div className="flex gap-2 flex-wrap mb-4">
            {TRIP_DAYS.map((d) => (
              <button
                key={d}
                onClick={() => setPlanDays(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  planDays === d
                    ? 'bg-egeo text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {d} días
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {plan.map((item, i) =>
              typeof item === 'string' ? (
                <div key={i} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                  <span className="font-mono text-xs text-egeo font-bold flex-shrink-0 pt-0.5 w-6">
                    D{i + 1}
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed">{item}</p>
                </div>
              ) : (
                <div key={i} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex gap-2 items-baseline mb-0.5">
                    <span className="font-mono text-xs text-egeo font-bold uppercase tracking-wide">
                      {item[0]}
                    </span>
                    <span className="font-semibold text-sm text-gray-900">{item[1]}</span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{item[2]}</p>
                </div>
              )
            )}
          </div>
        </section>

        {/* Cotizador */}
        <BudgetCalculator dest={dest} />

      </div>
    </main>
  )
}

function getPlan(dest: Destination, days: TripDays): (string | [string, string, string])[] {
  switch (days) {
    case 3:  return dest.plans3
    case 5:  return dest.plans5
    case 7:  return dest.plans7
    case 10: return dest.plans10
    case 14: return dest.plans14
  }
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDestinationsByCategory, type Destination } from '@/data/destinations'
import { CategoryRow } from '@/components/destinations/CategoryRow'

type Tab = 'destinos' | 'comparar' | 'combinar' | 'favoritos' | 'warning'

const TABS: { id: Tab; label: string }[] = [
  { id: 'destinos',  label: 'Destinos' },
  { id: 'comparar',  label: 'Comparar' },
  { id: 'combinar',  label: 'Combinar' },
  { id: 'favoritos', label: 'Favoritos' },
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
        <p className="font-display font-bold text-warning-yellow text-sm leading-tight truncate">
          {dest.name}
        </p>
        <p className="text-gray-500 text-xs mt-0.5 truncate">{dest.country}</p>
        <p className="text-gray-400 text-xs mt-2 line-clamp-2 leading-snug">
          {dest.tagline}
        </p>
      </div>
      <div className="h-1 w-full bg-warning-stripes" />
    </Link>
  )
}

function WarningZone({ destinations }: { destinations: Destination[] }) {
  return (
    <div className="min-h-screen">
      {/* Stripe banner */}
      <div className="h-3 bg-warning-stripes" />

      <div className="max-w-5xl mx-auto px-4 py-10 pb-24 sm:pb-10">
        {/* Header */}
        <div className="mb-10">
          <p className="font-mono text-xs tracking-[0.3em] uppercase text-warning-red mb-3">
            ⚠ acceso restringido ⚠
          </p>
          <h1 className="font-display text-5xl sm:text-6xl font-bold text-warning-yellow leading-none mb-4">
            Zona<br />Warning
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-lg">
            Destinos famosos con masificación, precio alto o gestión turística
            deficiente. Con información, se pueden disfrutar — pero con los ojos bien abiertos.
          </p>
        </div>

        {/* Warning notice */}
        <div className="bg-warning-stripes p-0.5 rounded-2xl mb-8">
          <div className="bg-gray-900 rounded-[14px] p-4 flex gap-3">
            <span className="text-2xl flex-shrink-0">🚫</span>
            <div>
              <p className="text-warning-yellow font-bold text-sm mb-1">
                Antes de entrar, lee esto
              </p>
              <p className="text-gray-400 text-xs leading-relaxed">
                Estos destinos tienen puntuación negativa no porque sean feos —
                es que el turismo masivo ha destrozado la experiencia real.
                Si vas, te decimos cómo minimizar el daño.
              </p>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {destinations.map((dest) => (
            <WarningCard key={dest.id} dest={dest} />
          ))}
        </div>
      </div>

      <div className="h-3 bg-warning-stripes" />
    </div>
  )
}

// ──────────────────────────────────────────────
// Placeholder for unbuilt tabs
// ──────────────────────────────────────────────
const PLACEHOLDER: Record<string, { emoji: string; title: string; text: string }> = {
  comparar:  { emoji: '⚖️', title: 'Comparar destinos',  text: 'Pon dos destinos frente a frente y decide cuál os encaja más.' },
  combinar:  { emoji: '🧩', title: 'Combinar destinos',  text: 'Diseña un itinerario multi-destino encadenando paradas.' },
  favoritos: { emoji: '⭐', title: 'Mis favoritos',       text: 'Guarda los destinos que más te gustan para tenerlos a mano.' },
}

function Placeholder({ tab }: { tab: Tab }) {
  const p = PLACEHOLDER[tab]
  return (
    <main className="max-w-lg mx-auto px-4 py-20 text-center pb-24 sm:pb-8">
      <span className="text-6xl block mb-5">{p.emoji}</span>
      <p className="font-display font-bold text-gray-900 text-2xl mb-3">{p.title}</p>
      <p className="text-gray-400 text-sm leading-relaxed">{p.text}</p>
      <span className="mt-6 inline-block text-xs font-semibold bg-egeo/10 text-egeo
                       px-3 py-1.5 rounded-full">
        Próximamente
      </span>
    </main>
  )
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────
export function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>('destinos')

  const perfect = getDestinationsByCategory('perfect')
  const good    = getDestinationsByCategory('good')
  const ok      = getDestinationsByCategory('ok')
  const warning = getDestinationsByCategory('warning')
  const total   = perfect.length + good.length + ok.length + warning.length

  const isWarning = activeTab === 'warning'

  // Cambia el fondo de la página completa en modo warning
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
      {/* Tab bar — sticky justo bajo el TopBar (h-14 = 56px) */}
      <div
        className={`sticky top-14 z-40 border-b transition-colors duration-300 ${
          isWarning
            ? 'bg-gray-950 border-warning-red/20'
            : 'bg-white/95 backdrop-blur-sm border-gray-100 shadow-sm'
        }`}
      >
        <div className="flex overflow-x-auto scrollbar-hide max-w-5xl mx-auto px-2">
          {TABS.map((tab) => {
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
                      : isWarning
                        ? 'border-egeo text-white'
                        : 'border-egeo text-egeo'
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

      {/* Contenido de cada tab */}
      {isWarning ? (
        <WarningZone destinations={warning} />
      ) : activeTab === 'destinos' ? (
        <main className="py-6 pb-24 sm:pb-8">
          <div className="px-4 mb-8">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
              ¿A dónde vamos<br />
              <span className="text-egeo">este verano?</span>
            </h1>
            <p className="text-gray-400 text-sm mt-2">
              {total} destinos analizados para vosotros
            </p>
          </div>

          <CategoryRow
            category="perfect"
            title="🔥 Perfecto para vosotros"
            subtitle="Los que mejor encajan con lo que buscáis"
            destinations={perfect}
          />
          <CategoryRow
            category="good"
            title="👍 Muy bueno"
            subtitle="Grandes opciones con algún pero menor"
            destinations={good}
          />
          <CategoryRow
            category="ok"
            title="👌 Está bien"
            subtitle="Vale la pena con expectativas claras"
            destinations={ok}
          />
        </main>
      ) : (
        <Placeholder tab={activeTab} />
      )}
    </>
  )
}

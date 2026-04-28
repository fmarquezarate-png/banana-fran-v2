import { useEffect, useState, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { DESTINATIONS, getDestinationsByCategory, type Destination, type DestinationCategory } from '@/data/destinations'
import { CategoryRow } from '@/components/destinations/CategoryRow'
import { DestinationCard } from '@/components/destinations/DestinationCard'
import { useFavorites } from '@/contexts/FavoritesContext'
import { useRatings } from '@/contexts/RatingsContext'
import { calcBudget, formatPrice, TRIP_DAYS, LEVEL_LABEL, type BudgetLevel, type TripDays } from '@/lib/budget'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'

type SortMode = 'match' | 'price_asc' | 'price_desc' | 'rating'

const AllDestinationsMap = lazy(() =>
  import('@/components/destinations/AllDestinationsMap').then(m => ({ default: m.AllDestinationsMap }))
)

type Tab = 'destinos' | 'comparar' | 'consolidado' | 'favoritos' | 'warning'
type View = 'cards' | 'map'

const TABS: { id: Tab; label: string }[] = [
  { id: 'destinos',    label: 'Destinos' },
  { id: 'comparar',    label: 'Comparar' },
  { id: 'consolidado', label: '📊 Consolidado' },
  { id: 'favoritos',   label: '⭐ Favoritos' },
  { id: 'warning',     label: '⚠️ Zona Warning' },
]

// ──────────────────────────────────────────────
// Warning Zone
// ──────────────────────────────────────────────
function WarningCard({ dest }: { dest: Destination }) {
  return (
    <Link
      to={`/destino/${dest.id}`}
      className="group relative rounded-xl overflow-hidden border border-warning-yellow/30
                 hover:border-warning-yellow/70 transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="relative h-36 overflow-hidden bg-black">
        <img
          src={dest.images[0]}
          alt={dest.name}
          className="w-full h-full object-cover opacity-35 transition-all duration-500
                     group-hover:opacity-55 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <span className="absolute top-2 left-2 text-[10px] font-bold text-black
                         bg-warning-yellow px-2 py-0.5 rounded-sm tracking-widest uppercase">
          ⚠ CAUTELA
        </span>
      </div>
      <div className="p-3 bg-[#0a0a0a]">
        <p className="font-display font-bold text-warning-yellow text-sm leading-tight truncate">{dest.name}</p>
        <p className="text-gray-500 text-xs mt-0.5 truncate">{dest.country}</p>
        <p className="text-gray-600 text-xs mt-2 line-clamp-2 leading-snug italic">{dest.tagline}</p>
      </div>
      {/* Cinta policial amarillo/negro */}
      <div className="h-2" style={{ background: 'repeating-linear-gradient(90deg, #ffd700 0,#ffd700 14px,#111 14px,#111 28px)' }} />
    </Link>
  )
}

function WarningZone({ destinations }: { destinations: Destination[] }) {
  return (
    <div
      className="min-h-screen"
      style={{ background: 'repeating-linear-gradient(45deg,#0a0a0a 0,#0a0a0a 22px,#161616 22px,#161616 44px)' }}
    >
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-24 sm:pb-10">
        {/* Header */}
        <div className="mb-10">
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-warning-yellow/60 mb-4">
            ⚠ &nbsp; ZONA RESTRINGIDA &nbsp; ⚠
          </p>
          <h1 className="font-display text-6xl sm:text-7xl font-bold leading-none mb-5">
            <span className="text-warning-red drop-shadow-[0_0_30px_rgba(255,0,64,0.5)]">ZONA</span>
            <br />
            <span className="text-warning-yellow drop-shadow-[0_0_20px_rgba(255,215,0,0.4)]">WARNING</span>
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed max-w-md">
            Destinos con masificación extrema, precio inflado o gestión turística deficiente.
            Con información, se pueden disfrutar — pero con los ojos bien abiertos.
          </p>
        </div>

        {/* Aviso — borde amarillo */}
        <div className="mb-8 border border-warning-yellow/30 rounded-xl p-4 bg-warning-yellow/5 flex gap-3">
          <span className="text-xl flex-shrink-0 mt-0.5">⚠️</span>
          <div>
            <p className="text-warning-yellow font-bold text-sm mb-1">Antes de entrar</p>
            <p className="text-gray-500 text-xs leading-relaxed">
              Puntuación negativa no porque sean feos — es que el turismo masivo ha destrozado la experiencia real.
              Si vas, te decimos cómo minimizar el daño.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {destinations.map(dest => <WarningCard key={dest.id} dest={dest} />)}
        </div>
      </div>
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
const MAX_COMPARE = 5

function CompareTab() {
  const [slots, setSlots] = useState<string[]>(['', ''])

  const selectedIds = slots.filter(Boolean)

  const groups = [
    { label: '🔥 Match perfecto', dests: DESTINATIONS.filter(d => d.category === 'perfect') },
    { label: '👍 Muy bueno',      dests: DESTINATIONS.filter(d => d.category === 'good') },
    { label: '👌 Está bien',      dests: DESTINATIONS.filter(d => d.category === 'ok') },
    { label: '⚠️ Con cautela',    dests: DESTINATIONS.filter(d => d.category === 'warning') },
  ]

  function setSlot(i: number, val: string) {
    setSlots(prev => prev.map((v, idx) => idx === i ? val : v))
  }

  function addSlot() {
    if (slots.length < MAX_COMPARE) setSlots(prev => [...prev, ''])
  }

  function removeSlot(i: number) {
    setSlots(prev => prev.filter((_, idx) => idx !== i))
  }

  function DestSelect({ value, slotIdx }: { value: string; slotIdx: number }) {
    const otherIds = slots.filter((v, i) => i !== slotIdx && v !== '')
    return (
      <select
        value={value}
        onChange={e => setSlot(slotIdx, e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                   focus:outline-none focus:ring-2 focus:ring-egeo/50 bg-white"
      >
        <option value="">— Elige destino —</option>
        {groups.map(g => (
          <optgroup key={g.label} label={g.label}>
            {g.dests.filter(d => !otherIds.includes(d.id)).map(d => (
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
      <div className="w-44 flex-shrink-0">
        <Link to={`/destino/${dest.id}`}>
          <img src={dest.images[0]} alt={dest.name} className="w-full h-28 object-cover rounded-xl mb-3" />
        </Link>
        <p className="font-display font-bold text-gray-900 text-sm leading-tight">{dest.name}</p>
        <p className="text-xs text-gray-500 mb-2">{dest.country}</p>
        <p className="text-xs text-gray-600 italic mb-3 line-clamp-2">"{dest.tagline}"</p>
        <div className="space-y-2">
          <Row label="Match"   value={`${dest.match} ${dest.matchLabel}`} />
          <Row label="Vuelo"   value={dest.facts['vuelo'] ?? dest.facts['flight'] ?? '—'} />
          <Row label="Clima"   value={dest.facts['clima'] ?? dest.facts['temp'] ?? '—'} />
          <Row label="Idioma"  value={dest.facts['idioma'] ?? dest.facts['language'] ?? '—'} />
          <Row label="7 días"  value={`${formatPrice(budget.totalMin)}–${formatPrice(budget.totalMax)}`} />
        </div>
        <Link to={`/destino/${dest.id}`} className="mt-4 block text-center text-xs btn-primary py-1.5">
          Ver ficha →
        </Link>
      </div>
    )
  }

  const filledDests = slots.map(id => DESTINATIONS.find(d => d.id === id)).filter(Boolean) as Destination[]

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 pb-24 sm:pb-8">
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Comparar destinos</h1>
      <p className="text-gray-400 text-sm mb-6">Hasta {MAX_COMPARE} destinos cara a cara.</p>

      {/* Slot selectors */}
      <div className="space-y-2 mb-4">
        {slots.map((val, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 w-5 text-center">{i + 1}</span>
            <div className="flex-1">
              <DestSelect value={val} slotIdx={i} />
            </div>
            {slots.length > 2 && (
              <button
                onClick={() => removeSlot(i)}
                className="text-gray-300 hover:text-red-400 text-lg leading-none transition-colors"
                aria-label="Eliminar slot"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {slots.length < MAX_COMPARE && (
        <button
          onClick={addSlot}
          className="mb-6 text-sm text-egeo font-semibold hover:text-egeo-600 transition-colors flex items-center gap-1"
        >
          <span className="text-base leading-none">+</span> Añadir destino
        </button>
      )}

      {/* Comparison columns — horizontal scroll on mobile */}
      {filledDests.length >= 2 ? (
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-4 items-start" style={{ minWidth: `${filledDests.length * 192}px` }}>
            {filledDests.map((dest, i) => (
              <div key={dest.id} className="flex items-start gap-4">
                <DestColumn dest={dest} />
                {i < filledDests.length - 1 && (
                  <div className="flex-shrink-0 pt-12 text-xl font-bold text-gray-200 self-start">vs</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-10 text-center text-gray-400 text-sm">
          Selecciona al menos dos destinos para compararlos
        </div>
      )}
    </main>
  )
}

// ──────────────────────────────────────────────
// Consolidado
// ──────────────────────────────────────────────
const LEVELS: BudgetLevel[] = ['mochilero', 'medio', 'confort', 'lujo']
const LEVEL_EMOJI: Record<BudgetLevel, string> = { mochilero: '🎒', medio: '🧳', confort: '✨', lujo: '💎' }

interface ConsolidadoSlot {
  destId: string
  level: BudgetLevel
  days: TripDays
}

function ConsolidadoTab() {
  const [slots, setSlots] = useState<ConsolidadoSlot[]>([
    { destId: '', level: 'medio', days: 7 },
    { destId: '', level: 'medio', days: 7 },
  ])

  const groups = [
    { label: '🔥 Match perfecto', dests: DESTINATIONS.filter(d => d.category === 'perfect') },
    { label: '👍 Muy bueno',      dests: DESTINATIONS.filter(d => d.category === 'good') },
    { label: '👌 Está bien',      dests: DESTINATIONS.filter(d => d.category === 'ok') },
    { label: '⚠️ Con cautela',    dests: DESTINATIONS.filter(d => d.category === 'warning') },
  ]

  function updateSlot(i: number, patch: Partial<ConsolidadoSlot>) {
    setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s))
  }

  function addSlot() {
    if (slots.length < 5) setSlots(prev => [...prev, { destId: '', level: 'medio', days: 7 }])
  }

  function removeSlot(i: number) {
    setSlots(prev => prev.filter((_, idx) => idx !== i))
  }

  const filledSlots = slots.filter(s => s.destId !== '')
  const hasEnough = filledSlots.length >= 1

  const CAT_KEYS = ['flight', 'hotel', 'food', 'act'] as const
  const CAT_LABELS: Record<string, string> = { flight: '✈️ Vuelos', hotel: '🏠 Hotel', food: '🍽️ Comida', act: '🎫 Actividades' }

  const slotResults = filledSlots.map(slot => {
    const dest = DESTINATIONS.find(d => d.id === slot.destId)!
    return { slot, dest, result: calcBudget(dest, slot.days, slot.level, false) }
  })

  const grandMin = slotResults.reduce((s, r) => s + r.result.totalMin, 0)
  const grandMid = slotResults.reduce((s, r) => s + r.result.totalMid, 0)
  const grandMax = slotResults.reduce((s, r) => s + r.result.totalMax, 0)

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 pb-24 sm:pb-8">
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Consolidado</h1>
      <p className="text-gray-400 text-sm mb-6">Configura cada destino con su nivel y días para ver el presupuesto total.</p>

      {/* Slot editors */}
      <div className="space-y-3 mb-4">
        {slots.map((slot, i) => {
          const otherIds = slots.filter((_, idx) => idx !== i).map(s => s.destId).filter(Boolean)
          return (
            <div key={i} className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Destino {i + 1}</span>
                {slots.length > 1 && (
                  <button onClick={() => removeSlot(i)} className="text-gray-300 hover:text-red-400 text-sm transition-colors">
                    ✕ quitar
                  </button>
                )}
              </div>

              {/* Destination picker */}
              <select
                value={slot.destId}
                onChange={e => updateSlot(i, { destId: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-3
                           focus:outline-none focus:ring-2 focus:ring-egeo/50 bg-white"
              >
                <option value="">— Elige destino —</option>
                {groups.map(g => (
                  <optgroup key={g.label} label={g.label}>
                    {g.dests.filter(d => !otherIds.includes(d.id)).map(d => (
                      <option key={d.id} value={d.id}>{d.name} — {d.country}</option>
                    ))}
                  </optgroup>
                ))}
              </select>

              {/* Level + Days */}
              <div className="flex gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-400 mb-1.5">Nivel</p>
                  <div className="flex gap-1 flex-wrap">
                    {LEVELS.map(l => (
                      <button key={l} onClick={() => updateSlot(i, { level: l })}
                        className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          slot.level === l ? 'bg-egeo text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {LEVEL_EMOJI[l]} {LEVEL_LABEL[l]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 mb-1.5">Días</p>
                  <div className="flex gap-1 flex-wrap">
                    {TRIP_DAYS.map(d => (
                      <button key={d} onClick={() => updateSlot(i, { days: d })}
                        className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          slot.days === d ? 'bg-egeo text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {slots.length < 5 && (
        <button onClick={addSlot}
          className="mb-6 text-sm text-egeo font-semibold hover:text-egeo-600 transition-colors flex items-center gap-1"
        >
          <span className="text-base leading-none">+</span> Añadir destino
        </button>
      )}

      {/* Results table */}
      {hasEnough && (
        <div className="card overflow-hidden">
          {/* Header row */}
          <div className="bg-gray-50 border-b border-gray-100 px-4 py-2 flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide w-24 flex-shrink-0">Categoría</span>
            {slotResults.map(({ dest, slot }, i) => (
              <div key={i} className="flex-1 min-w-0 text-center">
                <p className="text-xs font-bold text-gray-700 truncate">{dest.name}</p>
                <p className="text-xs text-gray-400">{LEVEL_EMOJI[slot.level]} {slot.days}d</p>
              </div>
            ))}
          </div>

          {/* Category rows */}
          {CAT_KEYS.map(key => (
            <div key={key} className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-50">
              <span className="text-xs text-gray-500 w-24 flex-shrink-0">{CAT_LABELS[key]}</span>
              {slotResults.map(({ result }, i) => {
                const cat = result.cats.find(c => c.key === key)!
                return (
                  <div key={i} className="flex-1 text-center">
                    <p className="text-xs font-bold text-gray-800">{formatPrice(cat.mid)}</p>
                    <p className="text-xs text-gray-400">{formatPrice(cat.min)}–{formatPrice(cat.max)}</p>
                  </div>
                )
              })}
            </div>
          ))}

          {/* Per-trip totals */}
          <div className="flex items-center gap-2 px-4 py-3 bg-egeo/5 border-b border-egeo/10">
            <span className="text-xs font-bold text-egeo w-24 flex-shrink-0">Total viaje</span>
            {slotResults.map(({ result }, i) => (
              <div key={i} className="flex-1 text-center">
                <p className="text-sm font-bold text-egeo">{formatPrice(result.totalMid)}</p>
                <p className="text-xs text-gray-400">{formatPrice(result.totalMin)}–{formatPrice(result.totalMax)}</p>
              </div>
            ))}
          </div>

          {/* Grand total */}
          {slotResults.length > 1 && (
            <div className="px-4 py-4 flex items-baseline justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">Total consolidado</p>
                <p className="text-xs text-gray-400">{slotResults.length} destinos · pareja</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-display font-bold text-egeo">{formatPrice(grandMid)}</p>
                <p className="text-xs text-gray-400">{formatPrice(grandMin)} – {formatPrice(grandMax)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {!hasEnough && (
        <div className="card p-10 text-center text-gray-400 text-sm">
          Selecciona al menos un destino para ver el presupuesto
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
  const [sort, setSort] = useState<SortMode>('match')
  const [minRating, setMinRating] = useState<0|1|2|3|4|5>(0)

  const { getRating } = useRatings()
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  const userName = profile?.full_name ?? null

  const hasQuiz = typeof window !== 'undefined' && !!localStorage.getItem('quizAnswers')

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
      ) : activeTab === 'consolidado' ? (
        <ConsolidadoTab />
      ) : activeTab === 'favoritos' ? (
        <FavoritesTab />
      ) : (
        <main className="py-6 pb-24 sm:pb-8">
          {/* Greeting + toggle vista */}
          <div className="px-4 mb-4 flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                {userName ? `Hola ${userName} 👋` : 'Hola 👋'}<br />
                <span className="text-egeo">¿A dónde vamos?</span>
              </h1>
              <p className="text-gray-400 text-sm mt-2">
                {perfect.length + good.length + ok.length + warning.length} destinos analizados para vosotros
              </p>
            </div>
            <div className="flex bg-gray-100 rounded-xl p-1 flex-shrink-0 mt-1">
              <button onClick={() => setView('cards')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${view === 'cards' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
                ⊞ Lista
              </button>
              <button onClick={() => setView('map')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${view === 'map' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
                🗺️ Mapa
              </button>
            </div>
          </div>

          {/* Quiz CTA — si aún no se ha hecho el quiz */}
          {!hasQuiz && (
            <div className="px-4 mb-5">
              <Link
                to="/viajes/nuevo"
                className="flex items-center gap-4 bg-egeo text-white rounded-2xl p-4 shadow-md hover:bg-egeo-600 transition-colors"
              >
                <span className="text-3xl flex-shrink-0">🧭</span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-tight">Descubre tu destino ideal</p>
                  <p className="text-xs text-white/70 mt-0.5">
                    Responde 9 preguntas y te encontramos el viaje perfecto
                  </p>
                </div>
                <span className="ml-auto text-white/80 text-lg flex-shrink-0">→</span>
              </Link>
            </div>
          )}

          {/* Filter bar — solo en vista Lista y con quiz hecho */}
          {hasQuiz && view === 'cards' && (
            <div className="px-4 mb-5 flex flex-wrap gap-2 items-center">
              {/* Orden */}
              <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
                {([
                  { id: 'match',      label: 'Coincidencia' },
                  { id: 'price_asc',  label: 'Precio ↑' },
                  { id: 'price_desc', label: 'Precio ↓' },
                  { id: 'rating',     label: '⭐ Mis notas' },
                ] as { id: SortMode; label: string }[]).map(s => (
                  <button key={s.id} onClick={() => setSort(s.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                      sort === s.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                    }`}>
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Filtro mínimo de estrellas */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-xl px-3 py-1.5">
                <span className="text-xs text-gray-500 mr-1">min</span>
                {([0,1,2,3,4,5] as const).map(n => (
                  <button key={n} onClick={() => setMinRating(n)}
                    className={`text-base leading-none transition-colors ${
                      n === 0
                        ? minRating === 0 ? 'text-egeo font-bold text-xs' : 'text-gray-400 text-xs hover:text-gray-600'
                        : n <= minRating ? 'text-amber-400' : 'text-gray-300 hover:text-amber-300'
                    }`}>
                    {n === 0 ? 'todos' : '★'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!hasQuiz ? null : view === 'map' ? (
            <div className="px-4">
              <div className="flex flex-wrap gap-3 mb-4">
                {[
                  { color: 'bg-egeo',        label: '🔥 Perfecto' },
                  { color: 'bg-arena',       label: '👍 Muy bueno' },
                  { color: 'bg-gray-400',    label: '👌 Está bien' },
                  { color: 'bg-warning-red', label: '⚠️ Cautela' },
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
          ) : sort === 'match' && minRating === 0 ? (
            // Vista por categorías (default)
            <>
              <CategoryRow category="perfect" title="🔥 Perfecto para vosotros" subtitle="Los que mejor encajan con lo que buscáis" destinations={perfect} />
              <CategoryRow category="good"    title="👍 Muy bueno"              subtitle="Grandes opciones con algún pero menor"  destinations={good} />
              <CategoryRow category="ok"      title="👌 Está bien"              subtitle="Vale la pena con expectativas claras"    destinations={ok} />
            </>
          ) : (() => {
            // Vista filtrada/ordenada — grid plano
            const base = [...perfect, ...good, ...ok]
            const filtered = minRating > 0
              ? base.filter(d => getRating(d.id) >= minRating)
              : base

            const sorted = [...filtered].sort((a, b) => {
              if (sort === 'price_asc') return calcBudget(a, 7, 'medio', false).totalMid - calcBudget(b, 7, 'medio', false).totalMid
              if (sort === 'price_desc') return calcBudget(b, 7, 'medio', false).totalMid - calcBudget(a, 7, 'medio', false).totalMid
              if (sort === 'rating') return getRating(b.id) - getRating(a.id)
              return 0
            })

            return filtered.length === 0 ? (
              <div className="px-4 py-16 text-center">
                <span className="text-5xl block mb-4">🔍</span>
                <p className="font-display font-bold text-gray-800 mb-2">Sin resultados</p>
                <p className="text-gray-400 text-sm">No hay destinos con {minRating}+ estrellas todavía.</p>
                <button onClick={() => setMinRating(0)} className="mt-4 text-sm text-egeo hover:underline">
                  Ver todos
                </button>
              </div>
            ) : (
              <div className="px-4">
                <p className="text-xs text-gray-400 mb-4">
                  {sorted.length} destino{sorted.length !== 1 ? 's' : ''}
                  {sort === 'price_asc' && ' · precio ascendente (7 días, nivel medio)'}
                  {sort === 'price_desc' && ' · precio descendente (7 días, nivel medio)'}
                  {sort === 'rating' && ' · mejor valorados primero'}
                  {minRating > 0 && ` · mínimo ${'★'.repeat(minRating)}`}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {sorted.map(dest => <DestinationCard key={dest.id} dest={dest} />)}
                </div>
              </div>
            )
          })() : null}
        </main>
      )}
    </>
  )
}

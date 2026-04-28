import { useState } from 'react'
import type { Destination } from '@/data/destinations'
import {
  calcBudget,
  formatPrice,
  TRIP_DAYS,
  LEVEL_LABEL,
  type BudgetLevel,
  type TripDays,
} from '@/lib/budget'

interface Props { dest: Destination }

const LEVELS: BudgetLevel[] = ['mochilero', 'medio', 'confort', 'lujo']
const LEVEL_EMOJI: Record<BudgetLevel, string> = { mochilero: '🎒', medio: '🧳', confort: '✨', lujo: '💎' }

export function BudgetCalculator({ dest }: Props) {
  const [days, setDays] = useState<TripDays>(7)
  const [level, setLevel] = useState<BudgetLevel>('medio')
  const [perPerson, setPerPerson] = useState(false)
  const [customFlight, setCustomFlight] = useState('')
  const [customHotel,  setCustomHotel]  = useState('')
  const [customFood,   setCustomFood]   = useState('')
  const [customAct,    setCustomAct]    = useState('')
  const [showCustom, setShowCustom] = useState(false)

  // Always calculate in couple scale first, divide for display
  const baseResult = calcBudget(dest, days, level, false)

  const fv   = customFlight ? parseFloat(customFlight) : NaN
  const hv   = customHotel  ? parseFloat(customHotel)  : NaN
  const fdv  = customFood   ? parseFloat(customFood)   : NaN
  const actv = customAct    ? parseFloat(customAct)    : NaN

  const hasFlightOverride = !isNaN(fv)   && fv   > 0
  const hasHotelOverride  = !isNaN(hv)   && hv   > 0
  const hasFoodOverride   = !isNaN(fdv)  && fdv  > 0
  const hasActOverride    = !isNaN(actv) && actv > 0
  const hasOverride = hasFlightOverride || hasHotelOverride || hasFoodOverride || hasActOverride

  const overriddenCats = baseResult.cats.map(cat => {
    if (cat.key === 'flight' && hasFlightOverride) {
      const total = fv * 2              // per-person pp → couple total
      return { ...cat, mid: total, min: total * 0.95, max: total * 1.05, custom: true as const }
    }
    if (cat.key === 'hotel' && hasHotelOverride) {
      const total = hv * days           // per-night couple → trip total
      return { ...cat, mid: total, min: total * 0.9, max: total * 1.1, custom: true as const }
    }
    if (cat.key === 'food' && hasFoodOverride) {
      const total = fdv * 2 * days      // per-person per-day → couple total
      return { ...cat, mid: total, min: total * 0.9, max: total * 1.1, custom: true as const }
    }
    if (cat.key === 'act' && hasActOverride) {
      const total = actv * 2 * days     // per-person per-day → couple total
      return { ...cat, mid: total, min: total * 0.85, max: total * 1.15, custom: true as const }
    }
    return { ...cat, custom: false as const }
  })

  const activeCats = hasOverride ? overriddenCats : baseResult.cats

  // Aplicar perPerson al display
  const divisor = perPerson ? 2 : 1
  const displayCats = activeCats.map(c => ({
    ...c,
    mid: c.mid / divisor,
    min: c.min / divisor,
    max: c.max / divisor,
  }))

  const displayTotal    = displayCats.reduce((s, c) => s + c.mid, 0)
  const displayTotalMin = displayCats.reduce((s, c) => s + c.min, 0)
  const displayTotalMax = displayCats.reduce((s, c) => s + c.max, 0)

  return (
    <div className="card p-5">
      <h3 className="font-display font-bold text-lg text-gray-900 mb-4">
        💰 Cotizador de presupuesto
      </h3>

      {/* Días */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Duración</p>
        <div className="flex gap-2 flex-wrap">
          {TRIP_DAYS.map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                days === d ? 'bg-egeo text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {d} días
            </button>
          ))}
        </div>
      </div>

      {/* Nivel */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nivel</p>
        <div className="flex gap-2 flex-wrap">
          {LEVELS.map(l => (
            <button key={l} onClick={() => setLevel(l)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                level === l ? 'bg-egeo text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {LEVEL_EMOJI[l]} {LEVEL_LABEL[l]}
            </button>
          ))}
        </div>
      </div>

      {/* Por persona */}
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => setPerPerson(!perPerson)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            perPerson ? 'bg-egeo' : 'bg-gray-200'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            perPerson ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
        <span className="text-sm text-gray-600">Por persona (÷2)</span>
      </div>

      {/* Precios personalizados */}
      <div className="mb-5">
        <button
          onClick={() => setShowCustom(!showCustom)}
          className="flex items-center gap-2 text-sm font-semibold text-egeo hover:text-egeo-600 transition-colors"
        >
          <span className={`text-xs transition-transform inline-block ${showCustom ? 'rotate-90' : ''}`}>▶</span>
          Usar mis precios reales
          {hasOverride && !showCustom && (
            <span className="ml-1 text-xs bg-egeo text-white px-2 py-0.5 rounded-full">activo</span>
          )}
        </button>

        {showCustom && (
          <div className="mt-3 p-4 bg-egeo/5 rounded-2xl border border-egeo/10 space-y-3">
            <p className="text-xs text-gray-500">
              Tus precios reales. Dejar en blanco para usar la estimación automática.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  ✈️ Vuelo (€/persona, i+v)
                </label>
                <input type="number" value={customFlight}
                  onChange={e => setCustomFlight(e.target.value)}
                  placeholder={String(Math.round(dest.budget.flightPP))} min="0"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-egeo/50"
                />
                {hasFlightOverride && (
                  <p className="text-xs text-egeo mt-1">= {formatPrice(fv * 2)} los dos</p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  🏨 Hotel (€/noche, pareja)
                </label>
                <input type="number" value={customHotel}
                  onChange={e => setCustomHotel(e.target.value)}
                  placeholder={String(Math.round(dest.budget.hotelPD))} min="0"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-egeo/50"
                />
                {hasHotelOverride && (
                  <p className="text-xs text-egeo mt-1">= {formatPrice(hv * days)} total</p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  🍽️ Comida (€/persona/día)
                </label>
                <input type="number" value={customFood}
                  onChange={e => setCustomFood(e.target.value)}
                  placeholder={String(Math.round(dest.budget.foodPD / 2))} min="0"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-egeo/50"
                />
                {hasFoodOverride && (
                  <p className="text-xs text-egeo mt-1">= {formatPrice(fdv * 2 * days)} total</p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  🎫 Actividades (€/persona/día)
                </label>
                <input type="number" value={customAct}
                  onChange={e => setCustomAct(e.target.value)}
                  placeholder={String(Math.round(dest.budget.actPD / 2))} min="0"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-egeo/50"
                />
                {hasActOverride && (
                  <p className="text-xs text-egeo mt-1">= {formatPrice(actv * 2 * days)} total</p>
                )}
              </div>
            </div>
            {hasOverride && (
              <button
                onClick={() => { setCustomFlight(''); setCustomHotel(''); setCustomFood(''); setCustomAct('') }}
                className="text-xs text-gray-400 hover:text-red-400 transition-colors"
              >
                ✕ Borrar precios personalizados
              </button>
            )}
          </div>
        )}
      </div>

      {/* Resultado por categoría */}
      <div className="space-y-2 mb-4">
        {displayCats.map(cat => (
          <div key={cat.key} className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base">{cat.icon}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate flex items-center gap-1">
                  {cat.name}
                  {cat.custom && <span className="text-xs text-egeo font-bold bg-egeo/10 px-1.5 py-0.5 rounded-full">real</span>}
                </p>
                <p className="text-xs text-gray-400 truncate">{cat.desc}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              <p className="text-sm font-bold text-gray-900">{formatPrice(cat.mid)}</p>
              <p className="text-xs text-gray-400">{formatPrice(cat.min)}–{formatPrice(cat.max)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="border-t border-gray-100 pt-3 flex items-baseline justify-between">
        <div>
          <p className="text-sm text-gray-500">Total estimado</p>
          {hasOverride && <p className="text-xs text-egeo">con tus precios reales</p>}
        </div>
        <div className="text-right">
          <p className="text-2xl font-display font-bold text-egeo">{formatPrice(displayTotal)}</p>
          <p className="text-xs text-gray-400">{formatPrice(displayTotalMin)} – {formatPrice(displayTotalMax)}</p>
        </div>
      </div>
    </div>
  )
}

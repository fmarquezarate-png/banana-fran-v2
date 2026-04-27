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

interface Props {
  dest: Destination
}

const LEVELS: BudgetLevel[] = ['mochilero', 'medio', 'confort', 'lujo']

const LEVEL_EMOJI: Record<BudgetLevel, string> = {
  mochilero: '🎒',
  medio: '🧳',
  confort: '✨',
  lujo: '💎',
}

export function BudgetCalculator({ dest }: Props) {
  const [days, setDays] = useState<TripDays>(7)
  const [level, setLevel] = useState<BudgetLevel>('medio')
  const [perPerson, setPerPerson] = useState(false)

  const result = calcBudget(dest, days, level, perPerson)

  return (
    <div className="card p-5">
      <h3 className="font-display font-bold text-lg text-gray-900 mb-4">
        💰 Cotizador de presupuesto
      </h3>

      {/* Días */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Duración</p>
        <div className="flex gap-2 flex-wrap">
          {TRIP_DAYS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                days === d
                  ? 'bg-egeo text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                level === l
                  ? 'bg-egeo text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {LEVEL_EMOJI[l]} {LEVEL_LABEL[l]}
            </button>
          ))}
        </div>
      </div>

      {/* Por persona */}
      <div className="mb-5 flex items-center gap-3">
        <button
          onClick={() => setPerPerson(!perPerson)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            perPerson ? 'bg-egeo' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              perPerson ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className="text-sm text-gray-600">Por persona (÷2)</span>
      </div>

      {/* Resultado por categoría */}
      <div className="space-y-2 mb-4">
        {result.cats.map((cat) => (
          <div key={cat.key} className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base">{cat.icon}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{cat.name}</p>
                <p className="text-xs text-gray-400 truncate">{cat.desc}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              <p className="text-sm font-bold text-gray-900">{formatPrice(cat.mid)}</p>
              <p className="text-xs text-gray-400">
                {formatPrice(cat.min)}–{formatPrice(cat.max)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="border-t border-gray-100 pt-3 flex items-baseline justify-between">
        <p className="text-sm text-gray-500">Total estimado</p>
        <div className="text-right">
          <p className="text-2xl font-display font-bold text-egeo">
            {formatPrice(result.totalMid)}
          </p>
          <p className="text-xs text-gray-400">
            {formatPrice(result.totalMin)} – {formatPrice(result.totalMax)}
          </p>
        </div>
      </div>
    </div>
  )
}

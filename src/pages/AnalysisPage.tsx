import { useState, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTrips } from '@/hooks/useTrips'
import { DESTINATIONS } from '@/data/destinations'
import {
  scoreDests, calcScaleMatch, getScaleCategory,
  type TripAnswers, type ScoredDestination,
} from '@/lib/tripMatcher'
import type { Trip } from '@/types/database'

function getAnswers(trip: Trip): TripAnswers | null {
  if (trip.quiz_answers) return trip.quiz_answers as unknown as TripAnswers
  return null
}

function categoryLabel(pct: number): { label: string; color: string; emoji: string } {
  const cat = getScaleCategory(pct)
  if (cat === 'perfect') return { label: 'Perfecto',  color: 'text-egeo bg-egeo/10',     emoji: '🔥' }
  if (cat === 'good')    return { label: 'Muy bueno', color: 'text-arena-dark bg-arena/20', emoji: '👍' }
  if (cat === 'ok')      return { label: 'Está bien', color: 'text-gray-500 bg-gray-100',  emoji: '👌' }
  return                        { label: 'No encaja', color: 'text-red-500 bg-red-50',     emoji: '⚠️' }
}

function ScoreRow({ s }: { s: ScoredDestination & { pct: number } }) {
  const [open, setOpen] = useState(false)
  const cat = categoryLabel(s.pct)
  const pctDisplay = Math.round(s.pct * 100)

  return (
    <div className="border-b border-gray-50 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        {/* Destino */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm truncate">{s.dest.name}</p>
          <p className="text-xs text-gray-400 truncate">{s.dest.country}</p>
        </div>

        {/* Score en puntos */}
        <div className="flex-shrink-0 text-right w-10">
          <p className="font-bold text-gray-900 text-sm leading-none">{s.score}</p>
          <p className="text-[10px] text-gray-400 leading-none mt-0.5">pts</p>
        </div>

        {/* Barra de afinidad de escalas */}
        <div className="w-20 flex-shrink-0">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pctDisplay}%`,
                background: s.pct >= 0.80 ? '#1e6fb5' : s.pct >= 0.60 ? '#c9a96e' : s.pct >= 0.40 ? '#9ca3af' : '#ff0040',
              }}
            />
          </div>
          <p className="text-[10px] text-gray-500 text-right mt-0.5">{pctDisplay}% afinidad</p>
        </div>

        {/* Badge categoría */}
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${cat.color}`}>
          {cat.emoji} {cat.label}
        </span>

        {/* Expand */}
        <span className="text-gray-300 text-xs flex-shrink-0">{open ? '▲' : '▼'}</span>
      </button>

      {open && s.reasons.length > 0 && (
        <div className="px-4 pb-3">
          <div className="bg-gray-50 rounded-xl p-3 space-y-1">
            {s.reasons.map((r, i) => (
              <p key={i} className="text-xs text-gray-600">· {r}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function AnalysisPage() {
  const { user } = useAuth()
  const { trips, loading } = useTrips(user?.id)
  const [selectedTripId, setSelectedTripId] = useState<string>('')
  const [filter, setFilter] = useState<'all' | 'perfect' | 'good' | 'ok' | 'warning'>('all')

  const tripsWithQuiz = useMemo<Trip[]>(() => {
    return trips.filter(t => !!getAnswers(t))
  }, [trips])

  const answers = useMemo<TripAnswers | null>(() => {
    if (!selectedTripId) return null
    const trip = trips.find(t => t.id === selectedTripId)
    return trip ? getAnswers(trip) : null
  }, [selectedTripId, trips])

  const scored = useMemo<(ScoredDestination & { pct: number })[]>(() => {
    if (!answers) return []
    return scoreDests(DESTINATIONS, answers).map(s => ({
      ...s,
      pct: calcScaleMatch(answers, s.dest),
    }))
  }, [answers])

  const filtered = useMemo(() => {
    if (filter === 'all') return scored
    return scored.filter(s => getScaleCategory(s.pct) === filter)
  }, [scored, filter])

  const counts = useMemo(() => {
    const c = { perfect: 0, good: 0, ok: 0, warning: 0 }
    for (const s of scored) c[getScaleCategory(s.pct)]++
    return c
  }, [scored])

  return (
    <main className="max-w-lg mx-auto px-4 py-6 pb-24 sm:pb-8">

      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-gray-900">Análisis</h1>
        <p className="text-gray-400 text-sm mt-1">
          Tabla de afinidad de todos los destinos según el cuestionario de un viaje
        </p>
      </div>

      {/* Selector de viaje */}
      <div className="card p-4 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selecciona un viaje con cuestionario respondido
        </label>
        {loading ? (
          <p className="text-sm text-gray-400">Cargando viajes…</p>
        ) : tripsWithQuiz.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 mb-1">Ningún viaje tiene cuestionario guardado aún.</p>
            <p className="text-xs text-gray-400">Planifica un nuevo viaje usando el cuestionario para ver el análisis aquí.</p>
          </div>
        ) : (
          <select
            value={selectedTripId}
            onChange={e => { setSelectedTripId(e.target.value); setFilter('all') }}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-egeo/40"
          >
            <option value="">— Elige un viaje —</option>
            {tripsWithQuiz.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Tabla vacía sin viaje */}
      {!answers && !loading && tripsWithQuiz.length > 0 && (
        <div className="card p-10 text-center">
          <span className="text-4xl block mb-3">📊</span>
          <p className="text-gray-400 text-sm">Elige un viaje arriba para ver los scores de todos los destinos</p>
        </div>
      )}

      {/* Tabla con datos */}
      {answers && (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {([
              ['perfect', '🔥', counts.perfect, '#1e6fb5'],
              ['good',    '👍', counts.good,    '#c9a96e'],
              ['ok',      '👌', counts.ok,      '#9ca3af'],
              ['warning', '⚠️', counts.warning, '#ff0040'],
            ] as const).map(([cat, emoji, count, color]) => (
              <button
                key={cat}
                onClick={() => setFilter(filter === cat ? 'all' : cat)}
                className={`card p-3 text-center transition-all ${filter === cat ? 'ring-2 ring-offset-1' : ''}`}
                style={{ '--tw-ring-color': color } as React.CSSProperties}
              >
                <p className="text-xl">{emoji}</p>
                <p className="font-bold text-gray-900 text-lg leading-none">{count}</p>
                <p className="text-xs text-gray-400 mt-0.5 capitalize">{cat === 'warning' ? 'No encaja' : cat === 'perfect' ? 'Perfecto' : cat === 'good' ? 'Muy bueno' : 'Está bien'}</p>
              </button>
            ))}
          </div>

          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">
                {filtered.length} destinos
                {filter !== 'all' && <span className="text-gray-400"> (filtrado)</span>}
              </p>
              {filter !== 'all' && (
                <button onClick={() => setFilter('all')} className="text-xs text-egeo hover:underline">
                  Ver todos
                </button>
              )}
            </div>

            {filtered.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">Sin destinos en esta categoría</p>
            ) : (
              <div>
                {filtered.map(s => <ScoreRow key={s.dest.id} s={s} />)}
              </div>
            )}
          </div>
        </>
      )}

    </main>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { DESTINATIONS } from '@/data/destinations'
import { useAuth } from '@/hooks/useAuth'
import { useTrips } from '@/hooks/useTrips'
import { scoreDests, type TripAnswers, type ScoredDestination } from '@/lib/tripMatcher'
import { calcBudget, formatPrice } from '@/lib/budget'

// ─────────────────────────────────────────────────────────────
// Definición de preguntas
// ─────────────────────────────────────────────────────────────
type Step =
  | { key: 'days';      q: string; type: 'single'; opts: { v: TripAnswers['days'];      l: string; e: string }[] }
  | { key: 'travelers'; q: string; type: 'single'; opts: { v: TripAnswers['travelers']; l: string; e: string }[] }
  | { key: 'vibe';      q: string; type: 'single'; opts: { v: TripAnswers['vibe'];      l: string; e: string }[] }
  | { key: 'crowds';    q: string; type: 'single'; opts: { v: TripAnswers['crowds'];    l: string; e: string }[] }
  | { key: 'month';     q: string; type: 'single'; opts: { v: TripAnswers['month'];     l: string; e: string }[] }
  | { key: 'budget';    q: string; type: 'single'; opts: { v: TripAnswers['budget'];    l: string; e: string }[] }
  | { key: 'novelty';   q: string; type: 'single'; opts: { v: TripAnswers['novelty'];   l: string; e: string }[] }
  | { key: 'musts';     q: string; type: 'multi';  opts: { v: string; l: string; e: string }[] }
  | { key: 'car';       q: string; type: 'single'; opts: { v: TripAnswers['car'];       l: string; e: string }[] }

const STEPS: Step[] = [
  {
    key: 'days', q: '¿Cuántos días tenéis para el viaje?', type: 'single',
    opts: [
      { v: '3-5',   l: 'Una escapada corta', e: '📅' },
      { v: '5-7',   l: 'Una semana',          e: '🗓️' },
      { v: '7-10',  l: 'Diez días',           e: '✈️' },
      { v: '10-14', l: 'Dos semanas',         e: '🌍' },
    ],
  },
  {
    key: 'travelers', q: '¿Cuántas personas viajan?', type: 'single',
    opts: [
      { v: '1',  l: 'Solo/a',             e: '🧍' },
      { v: '2',  l: 'Dos personas',        e: '👫' },
      { v: '3',  l: 'Tres personas',       e: '👨‍👩‍👧' },
      { v: '4+', l: 'Cuatro o más',        e: '👨‍👩‍👧‍👦' },
    ],
  },
  {
    key: 'vibe', q: '¿Qué tipo de viaje buscáis?', type: 'single',
    opts: [
      { v: 'beach',   l: 'Playa y descanso total',   e: '🏖️' },
      { v: 'nature',  l: 'Naturaleza y senderismo',  e: '⛰️' },
      { v: 'culture', l: 'Cultura e historia',        e: '🏛️' },
      { v: 'mix',     l: 'Un mix de todo',            e: '🎒' },
    ],
  },
  {
    key: 'crowds', q: '¿Cómo os lleváis con las multitudes?', type: 'single',
    opts: [
      { v: 'hate',     l: 'Las odiamos, queremos tranquilidad', e: '😤' },
      { v: 'ok',       l: 'Las toleramos si el sitio lo vale',  e: '😐' },
      { v: 'dontcare', l: 'No nos importan para nada',          e: '😊' },
    ],
  },
  {
    key: 'month', q: '¿En qué época del año iréis?', type: 'single',
    opts: [
      { v: 'jun', l: 'Junio',              e: '🌤️' },
      { v: 'jul', l: 'Julio',              e: '☀️' },
      { v: 'aug', l: 'Agosto',             e: '🔆' },
      { v: 'sep', l: 'Septiembre',         e: '🍂' },
      { v: 'any', l: 'Sin fecha definida', e: '📆' },
    ],
  },
  {
    key: 'budget', q: '¿Cuánto presupuesto por persona (todo incluido)?', type: 'single',
    opts: [
      { v: 'low',     l: 'Hasta 600 €',     e: '💶' },
      { v: 'mid',     l: '600 – 1.100 €',   e: '💳' },
      { v: 'high',    l: '1.100 – 1.600 €', e: '💰' },
      { v: 'nolimit', l: 'Sin límite',       e: '💎' },
    ],
  },
  {
    key: 'novelty', q: '¿Preferís destino conocido o algo diferente?', type: 'single',
    opts: [
      { v: 'popular', l: 'Icónico y probado',           e: '🌟' },
      { v: 'hidden',  l: 'Menos turístico y auténtico', e: '🗺️' },
      { v: 'any',     l: 'No tenemos preferencia',      e: '🎲' },
    ],
  },
  {
    key: 'musts', q: '¿Qué no puede faltar? (elige todo lo que queráis)', type: 'multi',
    opts: [
      { v: 'snorkel',   l: 'Snorkel / Buceo',        e: '🤿' },
      { v: 'hiking',    l: 'Senderismo',              e: '🥾' },
      { v: 'beaches',   l: 'Playas espectaculares',   e: '🏝️' },
      { v: 'history',   l: 'Historia y arquitectura', e: '🏛️' },
      { v: 'nightlife', l: 'Vida nocturna',           e: '🎉' },
      { v: 'peace',     l: 'Tranquilidad total',      e: '🧘' },
    ],
  },
  {
    key: 'car', q: '¿Alquiláis coche en el destino?', type: 'single',
    opts: [
      { v: 'yes',   l: 'Sí, siempre',      e: '🚗' },
      { v: 'maybe', l: 'Depende del sitio', e: '🤔' },
      { v: 'no',    l: 'No, preferimos no', e: '🚶' },
    ],
  },
]

const TRAVELERS_NUM: Record<TripAnswers['travelers'], number> = {
  '1': 1, '2': 2, '3': 3, '4+': 4,
}

// ─────────────────────────────────────────────────────────────
// Componente resultado
// ─────────────────────────────────────────────────────────────
function ResultCard({ sd, rank, travelers }: { sd: ScoredDestination; rank: number; travelers: number }) {
  const navigate = useNavigate()
  const budget = calcBudget(sd.dest, 7, 'medio', true)
  const totalMin = budget.totalMin * travelers
  const totalMax = budget.totalMax * travelers
  const ppLabel = travelers > 1 ? ` · ${formatPrice(budget.totalMid)} pp` : ''

  return (
    <div
      onClick={() => navigate(`/destino/${sd.dest.id}`)}
      className="card overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="relative h-32 bg-gray-200">
        <img
          src={sd.dest.images[0]}
          alt={sd.dest.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <span className="absolute top-2 left-2 bg-egeo text-white text-xs font-bold px-2 py-1 rounded-full">
          #{rank} · {sd.score}% match
        </span>
      </div>
      <div className="p-3">
        <p className="font-display font-bold text-gray-900 text-sm">{sd.dest.name}</p>
        <p className="text-xs text-gray-500 mb-2">{sd.dest.country}</p>
        <p className="text-xs text-gray-400 mb-2">
          {formatPrice(totalMin)}–{formatPrice(totalMax)} total{ppLabel} / 7 días
        </p>
        {sd.reasons.slice(0, 2).map((r, i) => (
          <p key={i} className="text-xs text-egeo flex items-start gap-1">
            <span className="flex-shrink-0">✓</span> {r}
          </p>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Wizard principal
// ─────────────────────────────────────────────────────────────
const DEFAULT_ANSWERS: TripAnswers = {
  days: '7-10', travelers: '2', vibe: 'mix', crowds: 'ok', month: 'any',
  budget: 'mid', novelty: 'any', musts: [], car: 'maybe',
}

export function TripWizardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { createTrip } = useTrips(user?.id)

  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<TripAnswers>(DEFAULT_ANSWERS)
  const [phase, setPhase] = useState<'quiz' | 'results' | 'create'>('quiz')
  const [results, setResults] = useState<ScoredDestination[]>([])
  const [tripName, setTripName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)

  const current = STEPS[step]
  const progress = (step / STEPS.length) * 100
  const travelersNum = TRAVELERS_NUM[answers.travelers]

  // ── Handlers ──────────────────────────────────────────────
  function selectSingle(key: string, value: string) {
    const updated = { ...answers, [key]: value }
    setAnswers(updated)
    setTimeout(() => advance(updated), 180)
  }

  function toggleMulti(value: string) {
    setAnswers(prev => {
      const cur = prev.musts
      return {
        ...prev,
        musts: cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value],
      }
    })
  }

  function advance(ans = answers) {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      const scored = scoreDests(DESTINATIONS, ans)
      setResults(scored.slice(0, 6))
      setPhase('results')
    }
  }

  function back() {
    if (step > 0) setStep(s => s - 1)
    else navigate('/viajes')
  }

  async function handleCreate() {
    if (!tripName.trim()) return
    setSaving(true)
    try {
      const trip = await createTrip({
        name: tripName.trim(),
        description: `Viaje planificado con el asistente — ${results[0]?.dest.name ?? ''}`,
        start_date: startDate || null,
        end_date: endDate || null,
        destination_slug: results[0]?.dest.id ?? null,
        travelers: travelersNum,
      })
      toast.success('¡Viaje creado!')
      navigate(trip ? `/viajes/${trip.id}` : '/viajes')
    } catch (err) {
      console.error('Wizard createTrip error:', err)
      const msg = err instanceof Error ? err.message : 'Error creando el viaje'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  // ── Phase: Results ─────────────────────────────────────────
  if (phase === 'results') {
    return (
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 sm:pb-8">
        <div className="mb-6">
          <p className="text-xs text-gray-400 mb-1">Basado en tus respuestas</p>
          <h1 className="font-display text-2xl font-bold text-gray-900">
            Vuestros mejores destinos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Precios para {travelersNum} {travelersNum === 1 ? 'persona' : 'personas'} · 7 días.
            Toca cualquiera para ver la ficha completa.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {results.map((sd, i) => (
            <ResultCard key={sd.dest.id} sd={sd} rank={i + 1} travelers={travelersNum} />
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => { setPhase('quiz'); setStep(0) }}
            className="btn-secondary flex-shrink-0 px-4 text-sm"
          >
            ← Repetir
          </button>
          <button
            onClick={() => setPhase('create')}
            className="btn-primary flex-1 text-sm"
          >
            Crear viaje con estos destinos →
          </button>
        </div>
      </main>
    )
  }

  // ── Phase: Create ──────────────────────────────────────────
  if (phase === 'create') {
    return (
      <main className="max-w-lg mx-auto px-4 py-6 pb-24 sm:pb-8">
        <button onClick={() => setPhase('results')} className="text-sm text-gray-400 hover:text-egeo mb-6 block">
          ← Volver a resultados
        </button>
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Crear el viaje</h1>
        <p className="text-gray-500 text-sm mb-6">
          Destino sugerido: <strong>{results[0]?.dest.name}</strong> · {travelersNum} {travelersNum === 1 ? 'viajero' : 'viajeros'}
        </p>

        <div className="card p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del viaje *</label>
            <input
              type="text"
              value={tripName}
              onChange={e => setTripName(e.target.value)}
              placeholder={`${results[0]?.dest.shortName ?? 'Viaje'} 2025`}
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-egeo/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salida</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-egeo/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vuelta</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-egeo/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Viajeros</label>
            <select
              value={answers.travelers}
              onChange={e => setAnswers(prev => ({ ...prev, travelers: e.target.value as TripAnswers['travelers'] }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-egeo/50 bg-white"
            >
              <option value="1">1 persona</option>
              <option value="2">2 personas</option>
              <option value="3">3 personas</option>
              <option value="4+">4 o más personas</option>
            </select>
          </div>
          <button
            onClick={handleCreate}
            disabled={saving || !tripName.trim()}
            className="btn-primary w-full disabled:opacity-50"
          >
            {saving ? 'Creando…' : '🎉 Crear viaje'}
          </button>
        </div>
      </main>
    )
  }

  // ── Phase: Quiz ────────────────────────────────────────────
  const isMulti = current.type === 'multi'
  const selectedMulti = answers.musts

  return (
    <main className="max-w-lg mx-auto px-4 py-6 pb-24 sm:pb-8">
      {/* Header con progreso */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={back} className="text-gray-400 hover:text-gray-700 flex-shrink-0 text-lg">
          ←
        </button>
        <div className="flex-1">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>Pregunta {step + 1} de {STEPS.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-egeo rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Pregunta */}
      <h2 className="font-display text-2xl font-bold text-gray-900 mb-6 leading-snug">
        {current.q}
      </h2>

      {/* Opciones */}
      <div className="space-y-3">
        {current.opts.map(opt => {
          const isSelected = isMulti
            ? selectedMulti.includes(opt.v)
            : answers[current.key as keyof TripAnswers] === opt.v

          return (
            <button
              key={opt.v}
              onClick={() => isMulti ? toggleMulti(opt.v) : selectSingle(current.key, opt.v)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left
                          transition-all duration-200 ${
                isSelected
                  ? 'border-egeo bg-egeo/5 shadow-sm'
                  : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl flex-shrink-0">{opt.e}</span>
              <span className={`font-medium text-sm ${isSelected ? 'text-egeo' : 'text-gray-700'}`}>
                {opt.l}
              </span>
              {isSelected && (
                <span className="ml-auto text-egeo font-bold flex-shrink-0">✓</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Botón continuar (solo en multi-select) */}
      {isMulti && (
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => advance()}
            className="btn-primary flex-1"
          >
            {selectedMulti.length === 0 ? 'Saltar' : `Continuar (${selectedMulti.length} elegidos)`}
          </button>
        </div>
      )}
    </main>
  )
}

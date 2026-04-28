import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { DESTINATIONS } from '@/data/destinations'
import type { Destination } from '@/data/destinations'
import { useAuth } from '@/hooks/useAuth'
import { useTrips } from '@/hooks/useTrips'
import { scoreDests, type TripAnswers, type ScoredDestination } from '@/lib/tripMatcher'
import { calcBudget, formatPrice } from '@/lib/budget'

// ─────────────────────────────────────────────────────────────
// Steps
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
      { v: '1',  l: 'Solo/a',        e: '🧍' },
      { v: '2',  l: 'Dos personas',  e: '👫' },
      { v: '3',  l: 'Tres personas', e: '👨‍👩‍👧' },
      { v: '4+', l: 'Cuatro o más',  e: '👨‍👩‍👧‍👦' },
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
      { v: 'peace',     l: 'Tranquilidad total',       e: '🧘' },
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

// Days range from quiz answer → [min, max]
const DAYS_RANGE: Record<TripAnswers['days'], [number, number]> = {
  '3-5':   [3, 5],
  '5-7':   [5, 7],
  '7-10':  [7, 10],
  '10-14': [10, 14],
}

// Which plan to show based on quiz days answer
function getPlan(dest: Destination, daysAnswer: TripAnswers['days']) {
  switch (daysAnswer) {
    case '3-5':   return { n: 3,  plan: dest.plans3,  isShort: true  }
    case '5-7':   return { n: 5,  plan: dest.plans5,  isShort: true  }
    case '7-10':  return { n: 7,  plan: dest.plans7,  isShort: false }
    case '10-14': return { n: 10, plan: dest.plans10, isShort: false }
  }
}

// ─────────────────────────────────────────────────────────────
// ResultCard — seleccionable
// ─────────────────────────────────────────────────────────────
function ResultCard({
  sd, rank, travelers, selected, onSelect,
}: {
  sd: ScoredDestination
  rank: number
  travelers: number
  selected: boolean
  onSelect: () => void
}) {
  const budget = calcBudget(sd.dest, 7, 'medio', true)
  const totalMin = budget.totalMin * travelers
  const totalMax = budget.totalMax * travelers

  return (
    <div
      onClick={onSelect}
      className={`card overflow-hidden cursor-pointer transition-all duration-200 ${
        selected
          ? 'ring-2 ring-egeo shadow-md -translate-y-0.5'
          : 'hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      <div className="relative h-32 bg-gray-200">
        <img src={sd.dest.images[0]} alt={sd.dest.name} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {selected ? (
          <span className="absolute top-2 left-2 bg-egeo text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            ✓ Elegido
          </span>
        ) : (
          <span className="absolute top-2 left-2 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded-full">
            #{rank} · {sd.score}%
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="font-display font-bold text-gray-900 text-sm">{sd.dest.name}</p>
        <p className="text-xs text-gray-500 mb-1">{sd.dest.country}</p>
        <p className="text-xs text-gray-400 mb-2">
          {formatPrice(totalMin)}–{formatPrice(totalMax)} · 7 días
        </p>
        {sd.reasons.slice(0, 2).map((r, i) => (
          <p key={i} className="text-xs text-egeo flex items-start gap-1">
            <span className="flex-shrink-0">✓</span> {r}
          </p>
        ))}
        <Link
          to={`/destino/${sd.dest.id}`}
          onClick={e => e.stopPropagation()}
          className="mt-2 text-xs text-gray-400 hover:text-egeo underline block"
        >
          Ver ficha completa →
        </Link>
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

  const [step, setStep]       = useState(0)
  const [answers, setAnswers] = useState<TripAnswers>(DEFAULT_ANSWERS)
  const [phase, setPhase]     = useState<'quiz' | 'results' | 'create'>('quiz')
  const [results, setResults] = useState<ScoredDestination[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [tripName,   setTripName]   = useState('')
  const [startDate,  setStartDate]  = useState('')
  const [endDate,    setEndDate]    = useState('')
  const [saving,     setSaving]     = useState(false)

  const current      = STEPS[step]
  const progress     = (step / STEPS.length) * 100
  const travelersNum = TRAVELERS_NUM[answers.travelers]
  const selectedDest = results.find(r => r.dest.id === selectedId)?.dest ?? null

  // ── Handlers ────────────────────────────────────────────────
  function selectSingle(key: string, value: string) {
    const updated = { ...answers, [key]: value }
    setAnswers(updated)
    setTimeout(() => advance(updated), 180)
  }

  function toggleMulti(value: string) {
    setAnswers(prev => ({
      ...prev,
      musts: prev.musts.includes(value)
        ? prev.musts.filter(v => v !== value)
        : [...prev.musts, value],
    }))
  }

  function advance(ans = answers) {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      const scored = scoreDests(DESTINATIONS, ans)
      const top = scored.slice(0, 6)
      setResults(top)
      setSelectedId(null)           // user must explicitly choose
      localStorage.setItem('quizAnswers', JSON.stringify(ans))
      setPhase('results')
    }
  }

  function back() {
    if (step > 0) setStep(s => s - 1)
    else navigate('/viajes')
  }

  function goToCreate() {
    if (!selectedDest) {
      toast.error('Elige al menos un destino para continuar')
      return
    }
    setTripName(`${selectedDest.shortName} ${new Date().getFullYear() + (new Date().getMonth() >= 8 ? 1 : 0)}`)
    setPhase('create')
  }

  // Date mismatch detection
  const actualDays = startDate && endDate
    ? Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000)
    : null
  const [daysMin, daysMax] = DAYS_RANGE[answers.days]
  const dateMismatch = actualDays !== null && (actualDays < daysMin || actualDays > daysMax)
  const [ignoreMismatch, setIgnoreMismatch] = useState(false)

  async function handleCreate() {
    if (!selectedDest) { toast.error('Selecciona un destino'); return }
    if (!tripName.trim()) { toast.error('Ponle un nombre al viaje'); return }
    setSaving(true)
    try {
      const trip = await createTrip({
        name: tripName.trim(),
        description: `Viaje a ${selectedDest.name} — planificado con el asistente`,
        start_date: startDate || null,
        end_date:   endDate   || null,
        destination_slug: selectedDest.id,
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

  // ── Phase: Results ───────────────────────────────────────────
  if (phase === 'results') {
    return (
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 sm:pb-8">
        <div className="mb-5">
          <p className="text-xs text-gray-400 mb-1">Basado en tus respuestas</p>
          <h1 className="font-display text-2xl font-bold text-gray-900">Vuestros mejores destinos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Toca <strong>una tarjeta</strong> para elegir el destino y continuar.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {results.map((sd, i) => (
            <ResultCard
              key={sd.dest.id}
              sd={sd}
              rank={i + 1}
              travelers={travelersNum}
              selected={sd.dest.id === selectedId}
              onSelect={() => setSelectedId(sd.dest.id)}
            />
          ))}
        </div>

        {/* CTA bar */}
        <div className="sticky bottom-4 sm:static flex gap-3 bg-crema/90 backdrop-blur pt-2 pb-1">
          <button
            onClick={() => { setPhase('quiz'); setStep(0) }}
            className="btn-secondary flex-shrink-0 px-4 text-sm"
          >
            ← Repetir
          </button>
          <button
            onClick={goToCreate}
            disabled={!selectedId}
            className="btn-primary flex-1 text-sm disabled:opacity-40"
          >
            {selectedDest
              ? `Continuar con ${selectedDest.shortName} →`
              : 'Elige un destino para continuar'}
          </button>
        </div>
      </main>
    )
  }

  // ── Phase: Create ────────────────────────────────────────────
  if (phase === 'create' && selectedDest) {
    const { n: planDays, plan, isShort } = getPlan(selectedDest, answers.days)

    function handleStartDate(val: string) {
      setStartDate(val)
      setIgnoreMismatch(false)
      // auto-fill end date when not yet set
      if (val && !endDate) {
        const d = new Date(val + 'T00:00:00')
        d.setDate(d.getDate() + planDays - 1)
        setEndDate(d.toISOString().slice(0, 10))
      }
    }

    return (
      <main className="max-w-lg mx-auto px-4 py-6 pb-24 sm:pb-8">
        <button onClick={() => setPhase('results')} className="text-sm text-gray-400 hover:text-egeo mb-5 block">
          ← Cambiar destino
        </button>

        {/* Destino elegido */}
        <div className="flex items-center gap-3 mb-6">
          <img
            src={selectedDest.images[0]}
            alt={selectedDest.name}
            className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
          />
          <div>
            <p className="text-xs text-gray-400">Destino elegido</p>
            <h1 className="font-display text-xl font-bold text-gray-900 leading-tight">{selectedDest.name}</h1>
            <p className="text-xs text-gray-500">{selectedDest.country} · {travelersNum} {travelersNum === 1 ? 'viajero' : 'viajeros'}</p>
          </div>
        </div>

        {/* Formulario */}
        <div className="card p-5 space-y-4 mb-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del viaje *</label>
            <input
              type="text"
              value={tripName}
              onChange={e => setTripName(e.target.value)}
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-egeo/50"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Fechas del viaje</label>
              <span className="text-xs text-egeo font-medium bg-egeo/8 px-2 py-0.5 rounded-full">
                Programa de {planDays} días
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Salida</p>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => handleStartDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                             focus:outline-none focus:ring-2 focus:ring-egeo/50"
                />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Vuelta</p>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={e => { setEndDate(e.target.value); setIgnoreMismatch(false) }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                             focus:outline-none focus:ring-2 focus:ring-egeo/50"
                />
              </div>
            </div>
            {startDate && endDate && !dateMismatch && (
              <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                ✓ {actualDays} días — coincide con el programa
              </p>
            )}
          </div>

          {/* Mismatch warning — non-blocking */}
          {dateMismatch && !ignoreMismatch && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-amber-700">
                  Los días no coinciden con el programa
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  El programa es de {planDays} días, pero las fechas elegidas son {actualDays} días.
                </p>
              </div>
              <button
                onClick={() => setIgnoreMismatch(true)}
                className="text-xs text-amber-500 hover:text-amber-700 font-semibold flex-shrink-0"
              >
                Continuar igual
              </button>
            </div>
          )}

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

        {/* Itinerario sugerido */}
        <div className="card p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Programa sugerido · {planDays} días
          </p>
          {isShort ? (
            <ul className="space-y-2">
              {(plan as string[]).map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-egeo font-bold flex-shrink-0">D{i + 1}</span>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-3">
              {(plan as [string, string, string][]).map(([label, title, text], i) => (
                <li key={i} className="border-l-2 border-egeo/20 pl-3">
                  <p className="text-xs font-bold text-egeo">{label}</p>
                  <p className="text-sm font-semibold text-gray-800">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    )
  }

  // ── Phase: Quiz ──────────────────────────────────────────────
  const isMulti      = current.type === 'multi'
  const selectedMulti = answers.musts

  return (
    <main className="max-w-lg mx-auto px-4 py-6 pb-24 sm:pb-8">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={back} className="text-gray-400 hover:text-gray-700 flex-shrink-0 text-lg">←</button>
        <div className="flex-1">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>Pregunta {step + 1} de {STEPS.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-egeo rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <h2 className="font-display text-2xl font-bold text-gray-900 mb-6 leading-snug">{current.q}</h2>

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
              <span className={`font-medium text-sm ${isSelected ? 'text-egeo' : 'text-gray-700'}`}>{opt.l}</span>
              {isSelected && <span className="ml-auto text-egeo font-bold flex-shrink-0">✓</span>}
            </button>
          )
        })}
      </div>

      {isMulti && (
        <div className="mt-6">
          <button onClick={() => advance()} className="btn-primary w-full">
            {selectedMulti.length === 0 ? 'Saltar' : `Continuar (${selectedMulti.length} elegidos)`}
          </button>
        </div>
      )}
    </main>
  )
}

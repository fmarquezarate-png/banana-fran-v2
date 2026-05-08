import { useParams, Link } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useTrips } from '@/hooks/useTrips'
import { useTripDocuments } from '@/hooks/useTripDocuments'
import type { Trip, TripDocument, DocType } from '@/types/database'
import { DESTINATIONS } from '@/data/destinations'
import type { Destination, LongPlan, ShortPlan } from '@/data/destinations'
import { calcBudget, formatPrice, LEVEL_LABEL } from '@/lib/budget'
import type { BudgetLevel } from '@/lib/budget'
import {
  scoreDests, calcScaleMatch, getScaleCategory, calcScaleMatchDetail,
  getNNFailures, SCALE_KEYS, SCALE_LABELS, type TripAnswers,
} from '@/lib/tripMatcher'

type MainTab = 'opciones' | 'planificado' | 'tester'

const MAIN_TABS: { id: MainTab; label: string }[] = [
  { id: 'opciones',    label: '🎯 Opciones' },
  { id: 'planificado', label: '📋 Planificado' },
  { id: 'tester',      label: '🔬 Tester' },
]

type MatchSubTab = 'perfect' | 'good' | 'ok' | 'warning' | 'tabla'
const MATCH_TABS: { id: MatchSubTab; label: string; emoji: string }[] = [
  { id: 'perfect', label: 'Perfecto',    emoji: '🔥' },
  { id: 'good',    label: 'Muy bueno',   emoji: '👍' },
  { id: 'ok',      label: 'Está bien',   emoji: '👌' },
  { id: 'warning', label: 'Warning',     emoji: '⚠️' },
  { id: 'tabla',   label: 'Ranking',     emoji: '📊' },
]

// ─────────────────────────────────────────────────────────────
// Precios cotizados (localStorage MVP)
// ─────────────────────────────────────────────────────────────
type QuoteCategory = 'flight' | 'hotel' | 'activity' | 'transfer' | 'other'
interface Quote { id: string; cat: QuoteCategory; concept: string; amount: number }

const QUOTE_CATS: Record<QuoteCategory, { label: string; emoji: string }> = {
  flight:   { label: 'Vuelo',      emoji: '✈️' },
  hotel:    { label: 'Hotel',      emoji: '🏨' },
  activity: { label: 'Actividad',  emoji: '🎟️' },
  transfer: { label: 'Traslado',   emoji: '🚌' },
  other:    { label: 'Otro',       emoji: '📌' },
}

function loadQuotes(tripId: string): Quote[] {
  try { return JSON.parse(localStorage.getItem(`quotes_${tripId}`) ?? '[]') } catch { return [] }
}
function saveQuotes(tripId: string, q: Quote[]) {
  localStorage.setItem(`quotes_${tripId}`, JSON.stringify(q))
}

function TripQuotes({ tripId, estimatedTotal }: { tripId: string; estimatedTotal: number }) {
  const [quotes, setQuotes]     = useState<Quote[]>(() => loadQuotes(tripId))
  const [open, setOpen]         = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [cat, setCat]           = useState<QuoteCategory>('flight')
  const [concept, setConcept]   = useState('')
  const [amount, setAmount]     = useState('')

  const total = quotes.reduce((s, q) => s + q.amount, 0)
  const diff  = total - estimatedTotal
  const hasDiff = estimatedTotal > 0 && total > 0

  function addQuote() {
    const n = parseFloat(amount)
    if (!concept.trim() || isNaN(n) || n <= 0) return
    const q: Quote = { id: Date.now().toString(), cat, concept: concept.trim(), amount: n }
    const updated = [...quotes, q]
    setQuotes(updated)
    saveQuotes(tripId, updated)
    setConcept(''); setAmount(''); setShowForm(false)
  }

  function removeQuote(id: string) {
    const updated = quotes.filter(q => q.id !== id)
    setQuotes(updated)
    saveQuotes(tripId, updated)
  }

  return (
    <div className="card overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between p-5">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧾</span>
          <span className="font-semibold text-gray-800">Mis precios cotizados</span>
          {quotes.length > 0 && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{quotes.length}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {total > 0 && (
            <span className={`text-sm font-semibold ${hasDiff && diff > 0 ? 'text-red-500' : hasDiff ? 'text-green-600' : 'text-egeo'}`}>
              {formatPrice(total)}
            </span>
          )}
          <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-50 px-5 pb-5">
          {/* Comparativa vs estimado */}
          {hasDiff && (
            <div className={`mt-4 mb-4 rounded-xl p-3 text-sm ${diff > 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {diff > 0
                ? `⚠️ ${formatPrice(diff)} por encima del presupuesto estimado`
                : `✓ ${formatPrice(Math.abs(diff))} por debajo del presupuesto estimado`}
            </div>
          )}

          {/* Lista de cotizaciones */}
          {quotes.length > 0 && (
            <ul className="space-y-2 mt-4 mb-4">
              {quotes.map(q => (
                <li key={q.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{QUOTE_CATS[q.cat].emoji}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{q.concept}</p>
                      <p className="text-xs text-gray-400">{QUOTE_CATS[q.cat].label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">{formatPrice(q.amount)}</span>
                    <button onClick={() => removeQuote(q.id)} className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
                  </div>
                </li>
              ))}
              <li className="flex justify-between border-t border-gray-200 pt-2 px-3">
                <span className="text-sm font-semibold text-gray-700">Total cotizado</span>
                <span className="text-sm font-bold text-egeo">{formatPrice(total)}</span>
              </li>
            </ul>
          )}

          {/* Formulario añadir */}
          {showForm ? (
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3 mt-2">
              <select
                value={cat}
                onChange={e => setCat(e.target.value as QuoteCategory)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-egeo/50"
              >
                {(Object.entries(QUOTE_CATS) as [QuoteCategory, { label: string; emoji: string }][]).map(([v, { label, emoji }]) => (
                  <option key={v} value={v}>{emoji} {label}</option>
                ))}
              </select>
              <input
                type="text"
                value={concept}
                onChange={e => setConcept(e.target.value)}
                placeholder="Ej: Vuelos BCN-DUB-BCN (Ryanair)"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-egeo/50"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="€ total"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-egeo/50"
                />
                <button onClick={addQuote} className="btn-primary px-4 text-sm">Añadir</button>
                <button onClick={() => setShowForm(false)} className="btn-secondary px-3 text-sm">✕</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 w-full border-2 border-dashed border-gray-200 hover:border-egeo/40 rounded-xl py-2.5 text-sm text-gray-400 hover:text-egeo transition-colors"
            >
              + Añadir precio cotizado
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function getPlanForDays(dest: Destination, days: number | null): { planDays: number; actualDays: number; plan: ShortPlan | LongPlan; isShort: boolean } {
  const n = days ?? 7
  if (n <= 4)  return { planDays: 3,  actualDays: n, plan: dest.plans3,  isShort: true  }
  if (n <= 6)  return { planDays: 5,  actualDays: n, plan: dest.plans5,  isShort: true  }
  if (n <= 9)  return { planDays: 7,  actualDays: n, plan: dest.plans7,  isShort: false }
  if (n <= 13) return { planDays: 10, actualDays: n, plan: dest.plans10, isShort: false }
  return              { planDays: 14, actualDays: n, plan: dest.plans14, isShort: false }
}

function adaptPlan(plan: ShortPlan | LongPlan, planDays: number, actualDays: number, isShort: boolean): ShortPlan | LongPlan {
  const extra = actualDays - planDays
  if (extra <= 0) return plan
  if (isShort) {
    const adapted = [...plan as ShortPlan]
    for (let i = 0; i < extra; i++)
      adapted.push('Día libre — explorar sin agenda, mercado local o excursión espontánea')
    return adapted
  }
  const adapted = [...plan as LongPlan]
  for (let i = 0; i < extra; i++)
    adapted.push([`Día ${planDays + i + 1}`, 'Día libre', 'Sin agenda fija — descansar, pasear o añadir una excursión a vuestro gusto.'])
  return adapted
}

const DOC_TYPE_LABELS: Record<DocType, { label: string; emoji: string }> = {
  flight:    { label: 'Vuelo',     emoji: '✈️' },
  hotel:     { label: 'Hotel',     emoji: '🏨' },
  activity:  { label: 'Actividad', emoji: '🎟️' },
  transfer:  { label: 'Traslado',  emoji: '🚌' },
  insurance: { label: 'Seguro',    emoji: '🛡️' },
  visa:      { label: 'Visado',    emoji: '📋' },
  other:     { label: 'Otro',      emoji: '📄' },
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

function tripDays(trip: Trip): number | null {
  if (!trip.start_date || !trip.end_date) return null
  return Math.round(
    (new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / 86400000
  )
}

function formatSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─────────────────────────────────────────────────────────────
// Document card
// ─────────────────────────────────────────────────────────────
function DocCard({
  doc,
  onDelete,
  getSignedUrl,
}: {
  doc: TripDocument
  onDelete: () => void
  getSignedUrl: (path: string) => Promise<string | null>
}) {
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [loadingImg, setLoadingImg] = useState(false)
  const isImage = doc.mime_type?.startsWith('image/')
  const typeInfo = DOC_TYPE_LABELS[doc.doc_type] ?? DOC_TYPE_LABELS.other

  useEffect(() => {
    if (!isImage) return
    setLoadingImg(true)
    getSignedUrl(doc.file_path).then(url => {
      setImgUrl(url)
      setLoadingImg(false)
    })
  }, [doc.file_path])

  async function handleOpen() {
    const url = await getSignedUrl(doc.file_path)
    if (url) window.open(url, '_blank')
    else toast.error('No se pudo abrir el archivo')
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      {/* Thumbnail */}
      <div
        className="h-28 bg-gray-50 flex items-center justify-center cursor-pointer relative"
        onClick={handleOpen}
      >
        {isImage && loadingImg && (
          <span className="text-2xl animate-pulse">⏳</span>
        )}
        {isImage && imgUrl && !loadingImg && (
          <img src={imgUrl} alt={doc.name} className="w-full h-full object-contain p-1" />
        )}
        {!isImage && (
          <span className="text-4xl">{typeInfo.emoji}</span>
        )}
        <div className="absolute top-1.5 left-1.5">
          <span className="bg-white/90 text-xs font-semibold px-1.5 py-0.5 rounded-lg text-gray-600">
            {typeInfo.emoji} {typeInfo.label}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="px-3 py-2">
        <p className="text-xs font-semibold text-gray-800 truncate">{doc.name}</p>
        {doc.file_size && (
          <p className="text-xs text-gray-400">{formatSize(doc.file_size)}</p>
        )}
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleOpen}
            className="text-xs text-egeo hover:underline"
          >
            Ver
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-gray-300 hover:text-red-400 transition-colors"
          >
            Borrar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Upload modal
// ─────────────────────────────────────────────────────────────
function UploadModal({
  onClose,
  onUpload,
}: {
  onClose: () => void
  onUpload: (file: File, name: string, docType: DocType) => Promise<void>
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [docType, setDocType] = useState<DocType>('flight')
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  function handleFile(f: File) {
    setFile(f)
    if (!name) setName(f.name.replace(/\.[^.]+$/, ''))
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f)
      setPreview(url)
    } else {
      setPreview(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !name.trim()) return
    setSaving(true)
    try {
      await onUpload(file, name.trim(), docType)
      onClose()
    } catch (err: unknown) {
      const msg = (err as Error).message ?? ''
      if (msg.includes('bucket') || msg.includes('not found')) {
        toast.error('El bucket "documents" no existe en Supabase. Ejecuta la migración SQL primero.')
      } else {
        toast.error('Error subiendo el archivo')
      }
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 shadow-xl">
        <h2 className="font-display text-lg font-bold text-gray-900 mb-4">Subir documento</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File picker */}
          <div
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
              file ? 'border-egeo/50 bg-egeo/5' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {preview ? (
              <img src={preview} alt="preview" className="max-h-32 mx-auto rounded-lg" />
            ) : (
              <>
                <span className="text-3xl block mb-2">{file ? '📄' : '📎'}</span>
                <p className="text-sm text-gray-500">
                  {file ? file.name : 'Toca para elegir imagen o PDF'}
                </p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value as DocType)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white
                         focus:outline-none focus:ring-2 focus:ring-egeo/50"
            >
              {(Object.entries(DOC_TYPE_LABELS) as [DocType, { label: string; emoji: string }][]).map(([v, { label, emoji }]) => (
                <option key={v} value={v}>{emoji} {label}</option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Boarding pass Madrid–Roma"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-egeo/50"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving || !file || !name.trim()}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {saving ? 'Subiendo…' : 'Subir'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary px-5">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Itinerario embebido
// ─────────────────────────────────────────────────────────────
function TripItinerary({ dest, days }: { dest: Destination; days: number | null }) {
  const [open, setOpen] = useState(true)
  const { planDays, actualDays, plan: rawPlan, isShort } = getPlanForDays(dest, days)
  const plan = adaptPlan(rawPlan, planDays, actualDays, isShort)
  const displayDays = actualDays > planDays ? actualDays : planDays

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🗺️</span>
          <span className="font-semibold text-gray-800">Itinerario sugerido</span>
          <span className="text-xs text-egeo bg-egeo/8 px-2 py-0.5 rounded-full font-medium">
            {displayDays} días
          </span>
        </div>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-50">
          {isShort ? (
            <ul className="space-y-3 mt-4">
              {(plan as ShortPlan).map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                  <span className="text-egeo font-bold flex-shrink-0 text-xs">Día {i + 1}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-4 mt-4">
              {(plan as LongPlan).map(([label, title, text], i) => (
                <li key={i} className="border-l-2 border-egeo/20 pl-3">
                  <p className="text-xs font-bold text-egeo">{label}</p>
                  <p className="text-sm font-semibold text-gray-800">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Presupuesto embebido
// ─────────────────────────────────────────────────────────────
const LEVELS: BudgetLevel[] = ['mochilero', 'medio', 'confort', 'lujo']

function TripBudget({ dest, days, travelers }: { dest: Destination; days: number | null; travelers: number }) {
  const [level, setLevel] = useState<BudgetLevel>('medio')
  const [open, setOpen] = useState(false)
  const n = days ?? 7
  const budget = calcBudget(dest, n, level, false)
  const perPax = {
    min: budget.totalMin / 2,
    mid: budget.totalMid / 2,
    max: budget.totalMax / 2,
  }
  const total = {
    min: perPax.min * travelers,
    mid: perPax.mid * travelers,
    max: perPax.max * travelers,
  }

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">💰</span>
          <span className="font-semibold text-gray-800">Presupuesto estimado</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-egeo">{formatPrice(perPax.mid)}<span className="text-xs text-gray-400 font-normal">/pp</span></span>
          <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-gray-50">
          {/* Level selector */}
          <div className="flex gap-1 mt-4 mb-4 bg-gray-100 rounded-xl p-1">
            {LEVELS.map(l => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  l === level ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {LEVEL_LABEL[l]}
              </button>
            ))}
          </div>

          {/* Breakdown */}
          <ul className="space-y-2.5 mb-4">
            {budget.cats.map(cat => {
              const catPP = { mid: cat.mid / 2, min: cat.min / 2, max: cat.max / 2 }
              return (
                <li key={cat.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{cat.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{cat.name}</p>
                      <p className="text-xs text-gray-400">{cat.desc}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 text-right flex-shrink-0 ml-2">
                    {formatPrice(catPP.mid)}<span className="text-xs text-gray-400 font-normal">/pp</span>
                  </p>
                </li>
              )
            })}
          </ul>

          {/* Total */}
          <div className="border-t border-gray-100 pt-3 flex items-end justify-between">
            <div>
              <p className="text-xs text-gray-400">Total {travelers} {travelers === 1 ? 'persona' : 'personas'} · {n} días</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Rango: {formatPrice(total.min)} – {formatPrice(total.max)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">por persona</p>
              <p className="font-display text-xl font-bold text-egeo">{formatPrice(perPax.mid)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Opciones tab
// ─────────────────────────────────────────────────────────────
// Etiquetas por dirección para cada dimensión
const SCALE_DIR: Record<string, { left: string; right: string }> = {
  playa_ciudad:          { left: 'playa',              right: 'ciudad' },
  relax_fiesta:          { left: 'relax',              right: 'vida nocturna' },
  lowcost_fancy:         { left: 'viaje económico',    right: 'lujo' },
  invierno_verano:       { left: 'invierno',           right: 'verano' },
  occidental_exotico:    { left: 'Europa / cercano',   right: 'lo exótico' },
  streetfood_gourmet:    { left: 'comida local',       right: 'gastronomía' },
  descanso_aventura:     { left: 'descanso',           right: 'aventura' },
  solo_grupal:           { left: 'viaje íntimo',       right: 'experiencia social' },
  naturaleza_metropolis: { left: 'naturaleza',         right: 'gran ciudad' },
  moderno_historico:     { left: 'moderno/vanguardista', right: 'histórico/patrimonio' },
  turistico_desconocido: { left: 'destino icónico',   right: 'destino desconocido' },
}
function dimLabel(key: string, val: number): string {
  const d = SCALE_DIR[key]
  if (!d) return key
  return val <= 4 ? d.left : val >= 6 ? d.right : 'neutro'
}

function buildMatchComment(answers: TripAnswers, dest: Destination, pct: number): string {
  const detail = calcScaleMatchDetail(answers, dest)
  const active = detail.dims.filter(d => !d.skipped)
  if (active.length === 0) return ''

  const byContrib = [...active].sort((a, b) => b.contribution - a.contribution)
  const top    = byContrib[0]
  const bottom = byContrib[byContrib.length - 1]

  const uLabel  = (d: typeof top) => dimLabel(d.key, d.userVal)
  const dLabel  = (d: typeof top) => dimLabel(d.key, d.destVal)

  if (pct >= 0.80) {
    const top2 = byContrib[1]
    return top2
      ? `Coincide en ${uLabel(top)} y ${uLabel(top2)} — perfil muy alineado`
      : `Tu preferencia de ${uLabel(top)} encaja perfectamente`
  }
  if (pct >= 0.60) {
    return bottom.dimScore < 0.45
      ? `Buena afinidad en ${uLabel(top)}, algo de diferencia en ${uLabel(bottom)}`
      : `Buena coincidencia en ${uLabel(top)}`
  }
  // ok
  return bottom.dimScore < 0.35
    ? `Tu preferencia de ${uLabel(bottom)} no coincide del todo — aquí es más ${dLabel(bottom)}`
    : `Encaja en lo general con algunas diferencias de perfil`
}

function MatchDestCard({
  dest, score, reasons, quizAnswers, pct,
}: {
  dest: Destination; score: number; reasons: string[]
  quizAnswers: TripAnswers | null; pct: number
}) {
  const comment = quizAnswers ? buildMatchComment(quizAnswers, dest, pct) : ''
  return (
    <Link to={`/destino/${dest.id}`} className="card p-3 flex gap-3 hover:shadow-md transition-shadow">
      <img src={dest.images[0]} alt={dest.name}
        className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-display font-bold text-gray-900 text-sm truncate">{dest.name}</p>
          <span className="text-xs font-bold text-egeo flex-shrink-0">{score}pts</span>
        </div>
        <p className="text-xs text-gray-400 truncate">{dest.country}</p>
        {comment && (
          <p className="text-xs text-egeo mt-1 leading-snug italic">{comment}</p>
        )}
        {reasons.length > 0 && (
          <p className="text-xs text-gray-400 mt-0.5 leading-snug">
            {reasons.slice(0, 2).join(' · ')}
          </p>
        )}
      </div>
    </Link>
  )
}

function WarningMatchCard({ dest, score, antiReasons }: { dest: Destination; score: number; antiReasons: string[] }) {
  return (
    <Link to={`/destino/${dest.id}`}
      className="group relative rounded-xl overflow-hidden border border-warning-yellow/30
                 hover:border-warning-yellow/60 transition-all duration-200 block">
      <div className="relative h-28 overflow-hidden bg-black">
        <img src={dest.images[0]} alt={dest.name}
          className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <span className="absolute top-2 left-2 text-[10px] font-bold text-black
                         bg-warning-yellow px-1.5 py-0.5 rounded-sm tracking-widest uppercase">
          ⚠ Cautela
        </span>
        <span className="absolute top-2 right-2 text-xs font-bold text-warning-yellow/80">{score}pts</span>
      </div>
      <div className="p-2.5 bg-[#0a0a0a]">
        <p className="font-display font-bold text-warning-yellow text-xs truncate">{dest.name}</p>
        <p className="text-gray-500 text-[10px] truncate">{dest.country}</p>
        {antiReasons.length > 0 && (
          <p className="text-[10px] text-warning-yellow/60 mt-1 leading-snug line-clamp-2">
            {antiReasons.slice(0, 2).join(' · ')}
          </p>
        )}
      </div>
      <div className="h-1.5"
        style={{ background: 'repeating-linear-gradient(90deg,#ffd700 0,#ffd700 10px,#111 10px,#111 20px)' }} />
    </Link>
  )
}

function buildAntiReasons(answers: TripAnswers, dest: Destination, score: number, pct: number): string[] {
  const out: string[] = []
  const s = dest.scales ?? {}
  const nnFailed = getNNFailures(answers, dest)

  for (const key of nnFailed) {
    const uLabel = dimLabel(key, (answers[key as keyof TripAnswers] as number | undefined) ?? 5)
    const dLabel = dimLabel(key, (s[key as keyof typeof s] as number | undefined) ?? 5)
    out.push(`⛔ Tu no negociable de ${uLabel} no se cumple — aquí es ${dLabel}`)
  }

  if (nnFailed.length === 0 && pct < 0.40) {
    const detail = calcScaleMatchDetail(answers, dest)
    const worst = detail.dims
      .filter(d => !d.skipped)
      .sort((a, b) => a.dimScore - b.dimScore)[0]
    if (worst) {
      const uLabel = dimLabel(worst.key, worst.userVal)
      const dLabel = dimLabel(worst.key, worst.destVal)
      out.push(`Perfil muy distante: buscas ${uLabel}, aquí predomina ${dLabel}`)
    } else {
      out.push(`Afinidad de perfil baja (${Math.round(pct * 100)}%)`)
    }
  }
  if (score < 30) out.push('Puntuación global baja para tu perfil')
  return out
}

function OpcionesTab({ quizAnswers }: { quizAnswers: TripAnswers | null }) {
  const [subTab, setSubTab] = useState<MatchSubTab>('perfect')
  const isWarning = subTab === 'warning'

  const scored = useMemo(
    () => quizAnswers ? scoreDests(DESTINATIONS, quizAnswers) : [],
    [quizAnswers]
  )

  const groups = useMemo(() => {
    if (!quizAnswers) return {
      perfect: [] as typeof scored, good: [] as typeof scored,
      ok: [] as typeof scored,
      warning: [] as { dest: Destination; score: number; reasons: string[]; antiReasons: string[] }[]
    }

    const isWarn = (s: typeof scored[0]) => {
      const pct = calcScaleMatch(quizAnswers, s.dest)
      return getScaleCategory(pct) === 'warning' || s.score < 30
    }

    const warningList = scored
      .filter(s => isWarn(s))
      .map(s => {
        const pct = calcScaleMatch(quizAnswers, s.dest)
        return { ...s, antiReasons: buildAntiReasons(quizAnswers, s.dest, s.score, pct) }
      })

    const nonWarn = scored.filter(s => !isWarn(s))
    return {
      perfect: nonWarn.filter(s => getScaleCategory(calcScaleMatch(quizAnswers, s.dest)) === 'perfect'),
      good:    nonWarn.filter(s => getScaleCategory(calcScaleMatch(quizAnswers, s.dest)) === 'good'),
      ok:      nonWarn.filter(s => getScaleCategory(calcScaleMatch(quizAnswers, s.dest)) === 'ok'),
      warning: warningList,
    }
  }, [scored, quizAnswers])

  if (!quizAnswers) {
    return (
      <div className="py-14 text-center px-4">
        <span className="text-5xl block mb-4">🧭</span>
        <p className="font-display font-bold text-gray-800 text-lg mb-2">Completa el cuestionario</p>
        <p className="text-gray-400 text-sm mb-5 leading-relaxed">
          Necesitamos conocer tus preferencias para calcular qué destinos encajan mejor contigo.
        </p>
        <Link to="/viajes/nuevo" className="btn-primary text-sm">Hacer el cuestionario →</Link>
      </div>
    )
  }

  type GroupKey = Exclude<MatchSubTab, 'tabla'>
  const current = subTab !== 'tabla' ? groups[subTab as GroupKey] : []

  return (
    <div>
      {/* Sub-tabs */}
      <div className={`sticky top-[6.5rem] z-30 py-3 -mx-4 px-4 transition-colors duration-300 ${
        isWarning ? 'bg-gray-950' : 'bg-gray-50'
      }`}>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {MATCH_TABS.map(tab => {
            const count = tab.id === 'tabla' ? scored.length : groups[tab.id as GroupKey].length
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  subTab === tab.id
                    ? tab.id === 'warning'
                      ? 'bg-warning-yellow text-black'
                      : 'bg-egeo text-white'
                    : tab.id === 'warning'
                      ? 'bg-gray-800 text-warning-yellow/70 hover:text-warning-yellow'
                      : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {tab.emoji} {tab.label}
                <span className="ml-1 opacity-60">({count})</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      {subTab === 'tabla' ? (
        <div className="mt-3 space-y-1.5">
          <p className="text-xs text-gray-400 mb-3">
            Todos los destinos ordenados por afinidad total. La columna % refleja compatibilidad de escala.
          </p>
          {scored.map((s, i) => {
            const pct = calcScaleMatch(quizAnswers!, s.dest)
            const cat = getScaleCategory(pct)
            const isWarn = cat === 'warning' || s.score < 30
            const catColor = isWarn
              ? 'bg-amber-100 text-amber-700'
              : cat === 'perfect' ? 'bg-green-100 text-green-700'
              : cat === 'good' ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600'
            const comment = buildMatchComment(quizAnswers!, s.dest, pct)
            return (
              <Link
                key={s.dest.id}
                to={`/destino/${s.dest.id}`}
                className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 border border-gray-100 hover:shadow-sm transition-shadow"
              >
                <span className="text-xs text-gray-300 font-bold w-5 flex-shrink-0 text-right">{i + 1}</span>
                <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={s.dest.images[0]} alt={s.dest.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 leading-tight truncate">{s.dest.shortName}</p>
                  {comment && <p className="text-xs text-gray-400 truncate mt-0.5">{comment}</p>}
                </div>
                <div className="flex-shrink-0 text-right space-y-0.5">
                  <p className="text-sm font-bold text-gray-900">{Math.round(pct * 100)}%</p>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${catColor}`}>
                    {isWarn ? '⚠️' : cat === 'perfect' ? '🔥' : cat === 'good' ? '👍' : '👌'}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      ) : isWarning ? (
        <div
          className="mt-3 rounded-2xl p-4"
          style={{ background: 'repeating-linear-gradient(45deg,#0a0a0a 0,#0a0a0a 18px,#141414 18px,#141414 36px)' }}
        >
          <p className="text-warning-yellow font-bold text-sm mb-1">⚠ Zona Warning — por qué NO os calza</p>
          <p className="text-gray-500 text-xs mb-4 leading-relaxed">
            Estos destinos no encajan con tu perfil por algún motivo concreto. Infórmate antes de decidir.
          </p>
          {groups.warning.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8 italic">
              Ningún destino en zona warning para tu perfil actual
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {groups.warning.map(({ dest, score, antiReasons }) => (
                <WarningMatchCard key={dest.id} dest={dest} score={score} antiReasons={antiReasons} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2.5 mt-3">
          {current.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-400 text-sm">Sin destinos en esta categoría para tu perfil</p>
            </div>
          ) : (
            current.map(({ dest, score, reasons }) => (
              <MatchDestCard
                key={dest.id} dest={dest} score={score} reasons={reasons}
                quizAnswers={quizAnswers}
                pct={calcScaleMatch(quizAnswers!, dest)}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Tester tab
// ─────────────────────────────────────────────────────────────
function TesterTab({ quizAnswers, defaultDest }: { quizAnswers: TripAnswers | null; defaultDest: Destination | null }) {
  const [selectedId, setSelectedId] = useState<string>(defaultDest?.id ?? '')
  const dest = DESTINATIONS.find(d => d.id === selectedId) ?? null

  if (!quizAnswers) {
    return (
      <div className="py-14 text-center px-4">
        <span className="text-5xl block mb-4">🔬</span>
        <p className="font-display font-bold text-gray-800 text-lg mb-2">Sin datos del cuestionario</p>
        <p className="text-gray-400 text-sm">Completa el quiz para ver el desglose de puntuación.</p>
      </div>
    )
  }

  const detail = dest ? calcScaleMatchDetail(quizAnswers, dest) : null
  const activeKeys = SCALE_KEYS.filter(k => {
    const uVal = quizAnswers[k as keyof TripAnswers] as number
    return Math.abs(uVal - 5) > 0
  })

  return (
    <div className="space-y-4 mt-3">
      {/* Selector de destino */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
          Destino a analizar
        </label>
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white
                     focus:outline-none focus:ring-2 focus:ring-egeo/50"
        >
          <option value="">— Elige un destino —</option>
          {DESTINATIONS.filter(d => d.scales).map(d => (
            <option key={d.id} value={d.id}>{d.name} — {d.country}</option>
          ))}
        </select>
      </div>

      {dest && detail && (
        <>
          {/* Resumen */}
          <div className="card p-4 flex items-center justify-between">
            <div>
              <p className="font-display font-bold text-gray-900">{dest.name}</p>
              <p className="text-xs text-gray-400">{activeKeys.length} de 10 dimensiones activas</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-display font-bold text-egeo">
                {Math.round(detail.pct * 100)}%
              </p>
              <p className={`text-xs font-semibold ${
                detail.pct >= 0.80 ? 'text-green-600' :
                detail.pct >= 0.60 ? 'text-egeo' :
                detail.pct >= 0.40 ? 'text-amber-500' : 'text-red-500'
              }`}>
                {getScaleCategory(detail.pct) === 'perfect' ? '🔥 Perfecto' :
                 getScaleCategory(detail.pct) === 'good'    ? '👍 Muy bueno' :
                 getScaleCategory(detail.pct) === 'ok'      ? '👌 Está bien' : '⚠️ Warning'}
              </p>
            </div>
          </div>

          {/* Tabla de dimensiones */}
          <div className="card overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-100 px-3 py-2 grid grid-cols-[2fr_3fr_3fr_1.5fr] gap-2">
              {['Dimensión', 'Tú →', 'Destino →', 'Score'].map(h => (
                <p key={h} className="text-[10px] font-bold text-gray-400 uppercase tracking-wide first:text-left text-center">{h}</p>
              ))}
            </div>
            {detail.dims.map(d => {
              const [leftLbl] = d.label.split(' ↔ ')
              const c = 44.44  // center%
              const userPct  = ((d.userVal  - 1) / 9) * 100
              const destPct  = ((d.destVal  - 1) / 9) * 100

              function MiniBar({ val, color }: { val: number; color: string }) {
                const s = val < 5 ? 'left' : val > 5 ? 'right' : 'neutral'
                const p = ((val - 1) / 9) * 100
                // Valor bidireccional: magnitud 0-10 desde el centro (v=5)
                const biVal = val === 5 ? 0 : Math.min(10, Math.round(Math.abs(val - 5) / 4 * 10))
                const biLabel = val === 5 ? '·' : `${biVal}`
                return (
                  <div className="flex flex-col items-center gap-0.5 w-full">
                    <span className="text-[9px] font-bold" style={{ color }}>{biLabel}</span>
                    <div className="relative h-1.5 bg-gray-100 rounded-full w-full">
                      {val !== 5 && (
                        <div className="absolute top-0 h-full rounded-full transition-all"
                          style={{ background: color, left: s === 'left' ? `${p}%` : `${c}%`, width: `${Math.abs(p - c)}%` }} />
                      )}
                      <div className="absolute top-1/2 -translate-y-1/2 w-px h-2.5 bg-gray-300 rounded-full"
                        style={{ left: `${c}%` }} />
                    </div>
                  </div>
                )
              }

              return (
                <div key={d.key}
                  className={`px-3 py-2.5 grid grid-cols-[2fr_3fr_3fr_1.5fr] gap-2 border-b border-gray-50 items-center ${
                    d.skipped ? 'opacity-35' : ''
                  }`}
                >
                  <p className="text-[10px] text-gray-600 leading-tight truncate" title={d.label}>
                    {d.isNN && <span className="text-red-500 font-bold mr-0.5">!</span>}
                    {leftLbl}
                  </p>
                  <MiniBar val={d.userVal}  color={d.skipped ? '#9ca3af' : '#1e6fb5'} />
                  <MiniBar val={d.destVal}  color={d.skipped ? '#9ca3af' : '#6b7280'} />
                  <p className={`text-xs font-bold text-center ${
                    d.skipped ? 'text-gray-300' :
                    d.dimScore >= 0.8 ? 'text-green-600' :
                    d.dimScore >= 0.5 ? 'text-amber-500' : 'text-red-500'
                  }`}>
                    {d.skipped ? '·' : d.isNN
                      ? (d.dimScore === 1 ? '✓' : '✗')
                      : `${Math.round(d.dimScore * 100)}%`}
                  </p>
                </div>
              )
            })}
            <div className="px-3 py-2.5 bg-egeo/5 grid grid-cols-[2fr_3fr_3fr_1.5fr] gap-2 items-center">
              <p className="text-xs font-bold text-egeo">TOTAL</p>
              <p className="col-span-2 text-xs text-gray-400">ponderado · {activeKeys.length} dims activas</p>
              <p className="text-sm font-display font-bold text-egeo text-center">{Math.round(detail.pct * 100)}%</p>
            </div>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed px-1">
            · Dimensiones con valor 5 (neutro) se ignoran. · Intensidad = |usuario - 5| / 4.
            · No Negociable (!) usa puntuación binaria: 100% si diff≤1, 0% si no.
          </p>
        </>
      )}

      {!dest && (
        <div className="card p-8 text-center text-gray-400 text-sm">
          Selecciona un destino con escalas definidas para ver el desglose
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────
export function TripDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { trips, deleteTrip, updateTrip } = useTrips(user?.id)
  const { docs, loading: docsLoading, uploadDocument, deleteDocument, getSignedUrl } = useTripDocuments(id, user?.id)
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [mainTab, setMainTab] = useState<MainTab>('opciones')
  const [completing, setCompleting] = useState(false)

  // useState (not useMemo) so it re-reads on every mount — fixes cross-device issue
  const [quizAnswers] = useState<TripAnswers | null>(() => {
    try { return JSON.parse(localStorage.getItem('quizAnswers') ?? '') as TripAnswers }
    catch { return null }
  })

  useEffect(() => {
    if (!id) return
    const cached = trips.find((t) => t.id === id)
    if (cached) { setTrip(cached); setLoading(false); return }
    supabase.from('trips').select('*').eq('id', id).single()
      .then(({ data, error }) => {
        if (error) toast.error('Error cargando el viaje')
        else setTrip(data)
        setLoading(false)
      })
  }, [id, trips])

  async function handleDelete() {
    if (!trip) return
    if (!confirm(`¿Eliminar "${trip.name}"? Esta acción no se puede deshacer.`)) return
    try { await deleteTrip(trip.id); toast.success('Viaje eliminado'); window.history.back() }
    catch { toast.error('Error eliminando el viaje') }
  }

  async function handleComplete() {
    if (!trip) return
    if (!confirm('¿Marcar este viaje como realizado? Aparecerá en tu sección de aventuras en el inicio.')) return
    setCompleting(true)
    try {
      await updateTrip(trip.id, { status_override: 'completed' })
      toast.success('¡Viaje completado! 🎉 Ya vive en tus recuerdos.')
    } catch { toast.error('Error al actualizar el viaje') }
    finally { setCompleting(false) }
  }

  async function handleDeleteDoc(doc: TripDocument) {
    if (!confirm(`¿Borrar "${doc.name}"?`)) return
    try { await deleteDocument(doc); toast.success('Documento borrado') }
    catch { toast.error('Error borrando el documento') }
  }

  async function handleUpload(file: File, name: string, docType: DocType) {
    await uploadDocument(file, name, docType)
    toast.success('Documento subido')
  }

  if (loading) {
    return <div className="flex justify-center py-20"><span className="text-4xl animate-pulse">🍌</span></div>
  }

  if (!trip) {
    return (
      <main className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-gray-400">Viaje no encontrado.</p>
        <Link to="/viajes" className="text-egeo text-sm mt-4 block hover:underline">← Mis viajes</Link>
      </main>
    )
  }

  const days = tripDays(trip)
  const travelers = trip.travelers ?? 2
  const slugParts = trip.destination_slug?.split('+') ?? []
  const destData = slugParts[0] ? (DESTINATIONS.find(d => d.id === slugParts[0]) ?? null) : null
  const destData2 = slugParts[1] ? (DESTINATIONS.find(d => d.id === slugParts[1]) ?? null) : null
  const isCombined = destData !== null && destData2 !== null
  const isCompleted = trip.status_override === 'completed'

  return (
    <>
      <main className="max-w-lg mx-auto px-4 py-6 pb-24 sm:pb-8">

        {/* Cabecera */}
        <div className="mb-4">
          <Link to="/viajes" className="text-sm text-gray-400 hover:text-egeo transition-colors">
            ← Mis viajes
          </Link>
          {destData && !isCombined && (
            <div className="relative h-32 rounded-2xl overflow-hidden mt-3 mb-3">
              <img src={destData.images[0]} alt={destData.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-4">
                <p className="text-white/70 text-xs">{destData.country}</p>
                <p className="text-white font-display font-bold text-lg leading-tight">{destData.name}</p>
              </div>
              {isCompleted && (
                <span className="absolute top-2.5 right-2.5 bg-white/20 backdrop-blur-sm text-white text-xs
                                 font-semibold px-2 py-0.5 rounded-full">✓ Realizado</span>
              )}
            </div>
          )}
          {isCombined && destData2 && (
            <div className="flex gap-2 mt-3 mb-3 h-32">
              <div className="relative flex-1 rounded-2xl overflow-hidden">
                <img src={destData.images[0]} alt={destData.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-2 left-3">
                  <p className="text-white/70 text-[10px]">1ª etapa</p>
                  <p className="text-white font-bold text-sm leading-tight">{destData.shortName}</p>
                </div>
              </div>
              <div className="relative flex-1 rounded-2xl overflow-hidden">
                <img src={destData2.images[0]} alt={destData2.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-2 left-3">
                  <p className="text-white/70 text-[10px]">2ª etapa</p>
                  <p className="text-white font-bold text-sm leading-tight">{destData2.shortName}</p>
                </div>
                {isCompleted && (
                  <span className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm text-white text-xs
                                   font-semibold px-2 py-0.5 rounded-full">✓ Realizado</span>
                )}
              </div>
            </div>
          )}
          <h1 className="font-display text-2xl font-bold text-gray-900 leading-tight">{trip.name}</h1>
          {trip.description && <p className="text-gray-500 text-sm mt-1">{trip.description}</p>}
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-5 bg-gray-100 rounded-2xl p-1">
          {MAIN_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setMainTab(tab.id)}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                mainTab === tab.id ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Opciones ── */}
        {mainTab === 'opciones' && <OpcionesTab quizAnswers={quizAnswers} />}

        {/* ── Tab: Planificado ── */}
        {mainTab === 'planificado' && (
          <div className="space-y-4">
            {/* Fechas y viajeros */}
            <div className="card p-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Salida</p>
                  <p className="font-medium text-gray-900 text-sm">{formatDate(trip.start_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Vuelta</p>
                  <p className="font-medium text-gray-900 text-sm">{formatDate(trip.end_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Viajeros</p>
                  <p className="font-medium text-gray-900 text-sm">
                    {travelers} {travelers === 1 ? 'persona' : 'personas'}
                  </p>
                </div>
                {days !== null && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Duración</p>
                    <p className="font-medium text-gray-900 text-sm">{days} días</p>
                  </div>
                )}
              </div>
            </div>

            {/* Accesos rápidos */}
            <div className="grid grid-cols-2 gap-3">
              <Link to={`/viajes/${trip.id}/fotos`}
                className="card p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow text-center">
                <span className="text-3xl">📷</span>
                <span className="font-semibold text-gray-800 text-sm">Fotos</span>
                <span className="text-xs text-gray-400">Galería del viaje</span>
              </Link>
              <Link to={`/viajes/${trip.id}/diario`}
                className="card p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow text-center">
                <span className="text-3xl">📔</span>
                <span className="font-semibold text-gray-800 text-sm">Diario</span>
                <span className="text-xs text-gray-400">Bitácora del viaje</span>
              </Link>
            </div>

            {destData && <TripItinerary dest={destData} days={days} />}
            {destData && <TripBudget dest={destData} days={days} travelers={travelers} />}

            {(() => {
              const est = destData ? calcBudget(destData, days ?? 7, 'medio', false).totalMid : 0
              return <TripQuotes tripId={trip.id} estimatedTotal={est} />
            })()}

            {/* Documentos */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">📄 Documentos</h2>
                <button onClick={() => setShowUpload(true)}
                  className="text-xs bg-egeo text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-egeo/90 transition-colors">
                  + Subir
                </button>
              </div>
              {docsLoading ? (
                <div className="text-center py-4"><span className="text-2xl animate-pulse">⏳</span></div>
              ) : docs.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-2xl">
                  <span className="text-3xl block mb-2">📎</span>
                  <p className="text-sm text-gray-400">Sin documentos todavía</p>
                  <p className="text-xs text-gray-300 mt-1">Sube QRs de vuelos, hoteles, entradas…</p>
                  <button onClick={() => setShowUpload(true)} className="mt-3 text-sm text-egeo hover:underline">
                    Subir primer documento
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {docs.map(doc => (
                    <DocCard key={doc.id} doc={doc}
                      onDelete={() => handleDeleteDoc(doc)} getSignedUrl={getSignedUrl} />
                  ))}
                </div>
              )}
            </div>

            {/* Marcar como realizado */}
            {!isCompleted && (
              <button
                onClick={handleComplete}
                disabled={completing}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-egeo/30
                           text-egeo text-sm font-semibold hover:border-egeo/60 hover:bg-egeo/5
                           transition-all disabled:opacity-50"
              >
                {completing ? 'Guardando…' : '✓ Marcar viaje como realizado'}
              </button>
            )}
            {isCompleted && (
              <div className="text-center py-3 text-sm text-gray-400">
                ✓ Este viaje ya está en tus recuerdos · <Link to="/" className="text-egeo hover:underline">Ver en inicio</Link>
              </div>
            )}

            <button onClick={handleDelete}
              className="w-full text-sm text-gray-300 hover:text-red-400 transition-colors py-2">
              Eliminar viaje
            </button>
          </div>
        )}

        {/* ── Tab: Tester ── */}
        {mainTab === 'tester' && <TesterTab quizAnswers={quizAnswers} defaultDest={destData} />}

      </main>

      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onUpload={handleUpload} />
      )}
    </>
  )
}

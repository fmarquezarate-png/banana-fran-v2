import { useParams, Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
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

function getPlanForDays(dest: Destination, days: number | null): { planDays: number; plan: ShortPlan | LongPlan; isShort: boolean } {
  const n = days ?? 7
  if (n <= 4)  return { planDays: 3,  plan: dest.plans3,  isShort: true  }
  if (n <= 6)  return { planDays: 5,  plan: dest.plans5,  isShort: true  }
  if (n <= 9)  return { planDays: 7,  plan: dest.plans7,  isShort: false }
  if (n <= 13) return { planDays: 10, plan: dest.plans10, isShort: false }
  return              { planDays: 14, plan: dest.plans14, isShort: false }
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
  const { planDays, plan, isShort } = getPlanForDays(dest, days)

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
            {planDays} días
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
                  <span className="text-egeo font-bold flex-shrink-0 w-6 text-center">D{i + 1}</span>
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
// Main page
// ─────────────────────────────────────────────────────────────
export function TripDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { trips, deleteTrip } = useTrips(user?.id)
  const { docs, loading: docsLoading, uploadDocument, deleteDocument, getSignedUrl } = useTripDocuments(id, user?.id)
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => {
    if (!id) return
    const cached = trips.find((t) => t.id === id)
    if (cached) {
      setTrip(cached)
      setLoading(false)
      return
    }
    supabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) toast.error('Error cargando el viaje')
        else setTrip(data)
        setLoading(false)
      })
  }, [id, trips])

  async function handleDelete() {
    if (!trip) return
    if (!confirm(`¿Eliminar "${trip.name}"? Esta acción no se puede deshacer.`)) return
    try {
      await deleteTrip(trip.id)
      toast.success('Viaje eliminado')
      window.history.back()
    } catch {
      toast.error('Error eliminando el viaje')
    }
  }

  async function handleDeleteDoc(doc: TripDocument) {
    if (!confirm(`¿Borrar "${doc.name}"?`)) return
    try {
      await deleteDocument(doc)
      toast.success('Documento borrado')
    } catch {
      toast.error('Error borrando el documento')
    }
  }

  async function handleUpload(file: File, name: string, docType: DocType) {
    await uploadDocument(file, name, docType)
    toast.success('Documento subido')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="text-4xl animate-pulse">🍌</span>
      </div>
    )
  }

  if (!trip) {
    return (
      <main className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-gray-400">Viaje no encontrado.</p>
        <Link to="/viajes" className="text-egeo text-sm mt-4 block hover:underline">
          ← Mis viajes
        </Link>
      </main>
    )
  }

  const days = tripDays(trip)
  const travelers = trip.travelers ?? 2
  const destData = trip.destination_slug
    ? DESTINATIONS.find(d => d.id === trip.destination_slug) ?? null
    : null

  return (
    <main className="max-w-lg mx-auto px-4 py-6 pb-24 sm:pb-8">
      {/* Cabecera */}
      <div className="mb-6">
        <Link to="/viajes" className="text-sm text-gray-400 hover:text-egeo transition-colors">
          ← Mis viajes
        </Link>
        {destData && (
          <div className="relative h-36 rounded-2xl overflow-hidden mt-3 mb-3">
            <img src={destData.images[0]} alt={destData.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-3 left-4">
              <p className="text-white/70 text-xs">{destData.country}</p>
              <p className="text-white font-display font-bold text-lg leading-tight">{destData.name}</p>
            </div>
          </div>
        )}
        <h1 className="font-display text-2xl font-bold text-gray-900 leading-tight">
          {trip.name}
        </h1>
        {trip.description && (
          <p className="text-gray-500 text-sm mt-1">{trip.description}</p>
        )}
      </div>

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
          <Link
            to={`/viajes/${trip.id}/fotos`}
            className="card p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow text-center"
          >
            <span className="text-3xl">📷</span>
            <span className="font-semibold text-gray-800 text-sm">Fotos</span>
            <span className="text-xs text-gray-400">Galería del viaje</span>
          </Link>
          <Link
            to={`/viajes/${trip.id}/diario`}
            className="card p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow text-center"
          >
            <span className="text-3xl">📔</span>
            <span className="font-semibold text-gray-800 text-sm">Diario</span>
            <span className="text-xs text-gray-400">Bitácora del viaje</span>
          </Link>
        </div>

        {/* Itinerario sugerido — sólo si hay destino */}
        {destData && <TripItinerary dest={destData} days={days} />}

        {/* Presupuesto estimado — sólo si hay destino */}
        {destData && <TripBudget dest={destData} days={days} travelers={travelers} />}

        {/* Precios cotizados */}
        {(() => {
          const est = destData ? calcBudget(destData, days ?? 7, 'medio', false).totalMid : 0
          return <TripQuotes tripId={trip.id} estimatedTotal={est} />
        })()}

        {/* Documentos */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">📄 Documentos</h2>
            <button
              onClick={() => setShowUpload(true)}
              className="text-xs bg-egeo text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-egeo/90 transition-colors"
            >
              + Subir
            </button>
          </div>

          {docsLoading ? (
            <div className="text-center py-4">
              <span className="text-2xl animate-pulse">⏳</span>
            </div>
          ) : docs.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-2xl">
              <span className="text-3xl block mb-2">📎</span>
              <p className="text-sm text-gray-400">Sin documentos todavía</p>
              <p className="text-xs text-gray-300 mt-1">Sube QRs de vuelos, hoteles, entradas…</p>
              <button
                onClick={() => setShowUpload(true)}
                className="mt-3 text-sm text-egeo hover:underline"
              >
                Subir primer documento
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {docs.map(doc => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  onDelete={() => handleDeleteDoc(doc)}
                  getSignedUrl={getSignedUrl}
                />
              ))}
            </div>
          )}
        </div>

        {/* Eliminar */}
        <button
          onClick={handleDelete}
          className="w-full text-sm text-gray-300 hover:text-red-400 transition-colors py-3"
        >
          Eliminar viaje
        </button>
      </div>

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUpload={handleUpload}
        />
      )}
    </main>
  )
}

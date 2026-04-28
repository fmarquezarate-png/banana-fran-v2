import { useParams, Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useTrips } from '@/hooks/useTrips'
import { useTripDocuments } from '@/hooks/useTripDocuments'
import type { Trip, TripDocument, DocType } from '@/types/database'

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

  return (
    <main className="max-w-lg mx-auto px-4 py-6 pb-24 sm:pb-8">
      {/* Cabecera */}
      <div className="mb-6">
        <Link to="/viajes" className="text-sm text-gray-400 hover:text-egeo transition-colors">
          ← Mis viajes
        </Link>
        <h1 className="font-display text-3xl font-bold text-gray-900 mt-2 leading-tight">
          {trip.name}
        </h1>
        {trip.description && (
          <p className="text-gray-500 text-sm mt-1">{trip.description}</p>
        )}
      </div>

      <div className="space-y-4">

        {/* Fechas y viajeros */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">
            Detalles del viaje
          </h2>
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
            className="card p-5 flex flex-col items-center gap-2 hover:shadow-md transition-shadow text-center"
          >
            <span className="text-3xl">📷</span>
            <span className="font-semibold text-gray-800 text-sm">Fotos</span>
            <span className="text-xs text-gray-400">Galería del viaje</span>
          </Link>

          <Link
            to={`/viajes/${trip.id}/diario`}
            className="card p-5 flex flex-col items-center gap-2 hover:shadow-md transition-shadow text-center"
          >
            <span className="text-3xl">📔</span>
            <span className="font-semibold text-gray-800 text-sm">Diario</span>
            <span className="text-xs text-gray-400">Bitácora del viaje</span>
          </Link>
        </div>

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

        {/* Lugares — placeholder */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">📍 Lugares y reseñas</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              Próximamente
            </span>
          </div>
          <p className="text-sm text-gray-400">
            Restaurantes, playas, museos visitados con tu valoración.
          </p>
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

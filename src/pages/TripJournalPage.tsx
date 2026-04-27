import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { TripJournal, Mood } from '@/types/database'

const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: 'amazing',  emoji: '🤩', label: 'Increíble' },
  { value: 'good',     emoji: '😊', label: 'Bien' },
  { value: 'okay',     emoji: '😐', label: 'Regular' },
  { value: 'bad',      emoji: '😔', label: 'Mal' },
  { value: 'terrible', emoji: '😤', label: 'Fatal' },
]

function formatEntryDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function getMoodEmoji(mood: Mood | null) {
  return MOODS.find((m) => m.value === mood)?.emoji ?? ''
}

interface EntryFormProps {
  tripId: string
  userId: string
  onSaved: (entry: TripJournal) => void
  onCancel: () => void
}

function EntryForm({ tripId, userId, onSaved, onCancel }: EntryFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mood, setMood] = useState<Mood | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('trip_journal')
        .insert({
          trip_id: tripId,
          user_id: userId,
          entry_date: date,
          title: title.trim() || null,
          content: content.trim(),
          mood,
        })
        .select()
        .single()
      if (error) throw error
      onSaved(data)
      toast.success('Entrada guardada')
    } catch {
      toast.error('Error guardando la entrada')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="font-display text-xl font-bold text-gray-900 mb-4">Nueva entrada</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-egeo/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado de ánimo</label>
              <div className="flex gap-1">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMood(mood === m.value ? null : m.value)}
                    className={`text-xl px-1.5 py-1 rounded-lg transition-colors ${
                      mood === m.value ? 'bg-egeo/10 ring-2 ring-egeo' : 'hover:bg-gray-100'
                    }`}
                    title={m.label}
                  >
                    {m.emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título (opcional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Día en el agua…"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-egeo/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entrada *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Qué pasó hoy…"
              rows={6}
              required
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none
                         focus:outline-none focus:ring-2 focus:ring-egeo/50"
            />
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={saving || !content.trim()} className="btn-primary flex-1 disabled:opacity-50">
              {saving ? 'Guardando…' : 'Guardar entrada'}
            </button>
            <button type="button" onClick={onCancel} className="btn-secondary px-5">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function TripJournalPage() {
  const { id: tripId } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [entries, setEntries] = useState<TripJournal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (!tripId) return
    supabase
      .from('trip_journal')
      .select('*')
      .eq('trip_id', tripId)
      .order('entry_date', { ascending: false })
      .then(({ data, error }) => {
        if (error) toast.error('Error cargando el diario')
        else setEntries(data ?? [])
        setLoading(false)
      })
  }, [tripId])

  async function handleDelete(id: string) {
    try {
      await supabase.from('trip_journal').delete().eq('id', id)
      setEntries((prev) => prev.filter((e) => e.id !== id))
    } catch {
      toast.error('Error eliminando entrada')
    }
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-6 pb-24 sm:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to={`/viajes/${tripId}`} className="text-sm text-gray-400 hover:text-egeo">
            ← Viaje
          </Link>
          <h1 className="font-display text-2xl font-bold text-gray-900 mt-1">Diario</h1>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm py-2 px-4">
          + Entrada
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="text-3xl animate-pulse">🍌</span>
        </div>
      ) : entries.length === 0 ? (
        <div className="card p-10 text-center">
          <span className="text-5xl block mb-3">📔</span>
          <p className="font-display font-bold text-gray-800 mb-1">El diario está vacío</p>
          <p className="text-gray-400 text-sm mb-4">Escribe tu primera entrada del viaje.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
            Primera entrada
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="card p-5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-xs text-gray-400 capitalize">{formatEntryDate(entry.entry_date)}</p>
                  {entry.title && (
                    <h3 className="font-display font-bold text-gray-900 mt-0.5">{entry.title}</h3>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {entry.mood && (
                    <span className="text-xl">{getMoodEmoji(entry.mood)}</span>
                  )}
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors text-sm"
                  >
                    ×
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {entry.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {showForm && tripId && user && (
        <EntryForm
          tripId={tripId}
          userId={user.id}
          onSaved={(entry) => {
            setEntries((prev) => [entry, ...prev])
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </main>
  )
}

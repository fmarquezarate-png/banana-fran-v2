import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { TripPhoto } from '@/types/database'

export function TripPhotosPage() {
  const { id: tripId } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [photos, setPhotos] = useState<TripPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!tripId) return
    supabase
      .from('trip_photos')
      .select('*')
      .eq('trip_id', tripId)
      .order('order_index')
      .then(({ data, error }) => {
        if (error) toast.error('Error cargando fotos')
        else setPhotos(data ?? [])
        setLoading(false)
      })
  }, [tripId])

  function getUrl(path: string) {
    const { data } = supabase.storage.from('photos').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length || !tripId || !user) return
    setUploading(true)

    for (const file of files) {
      try {
        const ext = file.name.split('.').pop()
        const path = `${user.id}/${tripId}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage.from('photos').upload(path, file)
        if (uploadError) throw uploadError

        const { data, error: dbError } = await supabase
          .from('trip_photos')
          .insert({
            trip_id: tripId,
            user_id: user.id,
            file_path: path,
            file_size: file.size,
            order_index: photos.length,
          })
          .select()
          .single()
        if (dbError) throw dbError
        setPhotos((prev) => [...prev, data])
      } catch {
        toast.error(`Error subiendo ${file.name}`)
      }
    }

    setUploading(false)
    toast.success('Fotos subidas')
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleDelete(photo: TripPhoto) {
    try {
      await supabase.storage.from('photos').remove([photo.file_path])
      await supabase.from('trip_photos').delete().eq('id', photo.id)
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
      if (lightbox === photo.file_path) setLightbox(null)
    } catch {
      toast.error('Error eliminando la foto')
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 pb-24 sm:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to={`/viajes/${tripId}`} className="text-sm text-gray-400 hover:text-egeo">
            ← Viaje
          </Link>
          <h1 className="font-display text-2xl font-bold text-gray-900 mt-1">Fotos</h1>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="btn-primary text-sm py-2 px-4 disabled:opacity-50"
          >
            {uploading ? 'Subiendo…' : '+ Fotos'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="text-3xl animate-pulse">🍌</span>
        </div>
      ) : photos.length === 0 ? (
        <div className="card p-10 text-center">
          <span className="text-5xl block mb-3">📷</span>
          <p className="font-display font-bold text-gray-800 mb-1">Sin fotos todavía</p>
          <p className="text-gray-400 text-sm mb-4">Sube las fotos de tu viaje.</p>
          <button onClick={() => inputRef.current?.click()} className="btn-primary text-sm">
            Subir fotos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group"
              onClick={() => setLightbox(photo.file_path)}
            >
              <img
                src={getUrl(photo.file_path)}
                alt={photo.caption ?? ''}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(photo) }}
                className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6
                           text-xs flex items-center justify-center opacity-0 group-hover:opacity-100
                           transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <img
            src={getUrl(lightbox)}
            alt=""
            className="max-w-full max-h-full object-contain p-4"
          />
          <button
            className="absolute top-4 right-4 text-white text-2xl"
            onClick={() => setLightbox(null)}
          >
            ×
          </button>
        </div>
      )}
    </main>
  )
}

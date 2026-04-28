import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { TripDocument, DocType } from '@/types/database'

export function useTripDocuments(tripId: string | undefined, userId: string | undefined) {
  const [docs, setDocs] = useState<TripDocument[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tripId) { setLoading(false); return }
    fetchDocs()
  }, [tripId])

  async function fetchDocs() {
    if (!tripId) return
    const { data, error } = await supabase
      .from('trip_documents')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })
    if (!error) setDocs(data ?? [])
    setLoading(false)
  }

  async function uploadDocument(file: File, name: string, docType: DocType): Promise<TripDocument> {
    if (!userId || !tripId) throw new Error('No auth')

    const ext = file.name.split('.').pop() ?? 'bin'
    const path = `${userId}/${tripId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(path, file, { contentType: file.type })
    if (uploadError) throw uploadError

    const { data, error } = await supabase
      .from('trip_documents')
      .insert({
        trip_id: tripId,
        user_id: userId,
        name,
        doc_type: docType,
        file_path: path,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single()
    if (error) throw error
    setDocs(prev => [data, ...prev])
    return data
  }

  async function deleteDocument(doc: TripDocument) {
    await supabase.storage.from('documents').remove([doc.file_path])
    const { error } = await supabase.from('trip_documents').delete().eq('id', doc.id)
    if (error) throw error
    setDocs(prev => prev.filter(d => d.id !== doc.id))
  }

  async function getSignedUrl(path: string): Promise<string | null> {
    const { data } = await supabase.storage
      .from('documents')
      .createSignedUrl(path, 3600)
    return data?.signedUrl ?? null
  }

  return { docs, loading, uploadDocument, deleteDocument, getSignedUrl, refetch: fetchDocs }
}

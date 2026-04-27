import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import type { DestinationUser } from '@/types/database'

export function useDestinationRating(userId: string | undefined, destinationId: string) {
  const [data, setData] = useState<DestinationUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    supabase
      .from('destinations_user')
      .select('*')
      .eq('user_id', userId)
      .eq('destination_id', destinationId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          toast.error('Error cargando rating')
          console.error(error)
        } else {
          setData(data)
        }
        setLoading(false)
      })
  }, [userId, destinationId])

  async function upsertRating(updates: Partial<Pick<DestinationUser, 'rating' | 'notes' | 'wish_to_visit'>>) {
    if (!userId) return
    const { data: result, error } = await supabase
      .from('destinations_user')
      .upsert({ user_id: userId, destination_id: destinationId, ...updates })
      .select()
      .single()
    if (error) throw error
    setData(result)
  }

  return { data, loading, upsertRating }
}

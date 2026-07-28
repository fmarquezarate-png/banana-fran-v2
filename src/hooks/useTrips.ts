import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import type { Trip } from '@/types/database'

export function useTrips(userId: string | undefined) {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTrips = async () => {
    if (!userId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) { toast.error('Error cargando viajes'); console.error(error) }
    else setTrips(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    fetchTrips()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function createTrip(
    values: Pick<Trip, 'name' | 'description' | 'start_date' | 'end_date' | 'destination_slug' | 'travelers'>
  ) {
    if (!userId) throw new Error('No hay sesión activa')

    const { data, error } = await supabase
      .from('trips')
      .insert({ ...values, user_id: userId })
      .select()
      .single()

    if (error) {
      console.error('createTrip:', error)
      throw error
    }

    // La lista viene ordenada por created_at DESC (más recientes primero);
    // insertar el nuevo trip al principio para respetar ese orden.
    setTrips(prev => [data, ...prev])
    return data
  }

  async function updateTrip(id: string, patch: Partial<Trip>) {
    const { data, error } = await supabase
      .from('trips').update(patch).eq('id', id).select().single()
    if (error) throw error
    setTrips(prev => prev.map(t => t.id === id ? data : t))
    return data
  }

  async function deleteTrip(id: string) {
    const { error } = await supabase.from('trips').delete().eq('id', id)
    if (error) throw error
    setTrips(prev => prev.filter(t => t.id !== id))
  }

  return { trips, loading, createTrip, updateTrip, deleteTrip, refetch: fetchTrips }
}

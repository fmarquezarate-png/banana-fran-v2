import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import type { Trip } from '@/types/database'

export function useTrips(userId: string | undefined) {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    fetchTrips()
  }, [userId])

  async function fetchTrips() {
    if (!userId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: true, nullsFirst: false })

    if (error) {
      toast.error('Error cargando viajes')
      console.error(error)
    } else {
      setTrips(data ?? [])
    }
    setLoading(false)
  }

  async function createTrip(
    values: Pick<Trip, 'name' | 'description' | 'start_date' | 'end_date' | 'destination_slug'>
  ) {
    if (!userId) return
    const { data, error } = await supabase
      .from('trips')
      .insert({ ...values, user_id: userId })
      .select()
      .single()
    if (error) throw error
    setTrips((prev) => [...prev, data])
    return data
  }

  async function deleteTrip(id: string) {
    const { error } = await supabase.from('trips').delete().eq('id', id)
    if (error) throw error
    setTrips((prev) => prev.filter((t) => t.id !== id))
  }

  return { trips, loading, createTrip, deleteTrip, refetch: fetchTrips }
}

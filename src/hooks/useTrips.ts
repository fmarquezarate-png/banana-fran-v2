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
    values: Pick<Trip, 'name' | 'description' | 'start_date' | 'end_date' | 'destination_slug' | 'travelers'>
  ) {
    if (!userId) throw new Error('No hay sesión activa')

    // Guarantee profile row exists via server-side function (SECURITY DEFINER bypasses RLS)
    const { error: profileErr } = await supabase.rpc('ensure_own_profile')
    if (profileErr) console.error('ensure_own_profile failed:', profileErr)

    const { data, error } = await supabase
      .from('trips')
      .insert({ ...values, user_id: userId })
      .select()
      .single()

    if (error) {
      // If the travelers column doesn't exist yet (migration not run), retry without it
      const missingCol = error.code === '42703' || error.message?.includes('travelers')
      if (missingCol) {
        console.warn('travelers column missing — run migration 001. Retrying without it.')
        const { travelers: _t, ...rest } = values
        const retry = await supabase
          .from('trips')
          .insert({ ...rest, user_id: userId })
          .select()
          .single()
        if (retry.error) {
          console.error('createTrip retry error:', retry.error)
          throw retry.error
        }
        setTrips((prev) => [...prev, retry.data])
        return retry.data
      }
      console.error('createTrip insert error:', error)
      throw error
    }
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

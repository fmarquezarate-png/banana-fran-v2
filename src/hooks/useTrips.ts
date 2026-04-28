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

  async function ensureProfile() {
    // Layer 1: SECURITY DEFINER RPC — bypasses RLS, always safe
    const { error: rpcErr } = await supabase.rpc('ensure_own_profile')

    if (rpcErr) {
      // Layer 2: direct upsert fallback (works if RLS allows own-row insert)
      console.warn('ensure_own_profile RPC failed, trying direct upsert:', rpcErr.message)
      const { error: upsertErr } = await supabase
        .from('profiles')
        .upsert({ id: userId }, { onConflict: 'id' })
      if (upsertErr) {
        console.error('Profile upsert fallback also failed:', upsertErr.message)
      }
    }
  }

  async function createTrip(
    values: Pick<Trip, 'name' | 'description' | 'start_date' | 'end_date' | 'destination_slug' | 'travelers'>
  ) {
    if (!userId) throw new Error('No hay sesión activa')

    await ensureProfile()

    const { data, error } = await supabase
      .from('trips')
      .insert({ ...values, user_id: userId })
      .select()
      .single()

    if (error) {
      // FK violation: profile still doesn't exist after both attempts
      if (error.code === '23503') {
        throw new Error('No se pudo crear tu perfil. Cierra sesión y vuelve a entrar.')
      }

      // travelers column not yet in DB (migration 001 not run) — retry without it
      if (error.code === '42703' || error.message?.includes('travelers')) {
        console.warn('travelers column missing — run migration 001. Retrying without it.')
        const { travelers: _t, ...rest } = values
        const retry = await supabase
          .from('trips')
          .insert({ ...rest, user_id: userId })
          .select()
          .single()
        if (retry.error) {
          if (retry.error.code === '23503') {
            throw new Error('No se pudo crear tu perfil. Cierra sesión y vuelve a entrar.')
          }
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

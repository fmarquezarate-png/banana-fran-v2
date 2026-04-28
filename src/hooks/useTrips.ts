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

    const diag: string[] = []

    // ── Step 1: RPC ensure_own_profile ─────────────────────────
    const { error: rpcErr } = await supabase.rpc('ensure_own_profile')
    if (rpcErr) {
      diag.push(`RPC ensure_own_profile → ERROR ${rpcErr.code}: ${rpcErr.message}`)
    } else {
      diag.push('RPC ensure_own_profile → OK')
    }

    // ── Step 2: Direct profile upsert (fallback / verify) ──────
    const { error: upsertErr } = await supabase
      .from('profiles')
      .upsert({ id: userId }, { onConflict: 'id' })
    if (upsertErr) {
      diag.push(`profiles upsert → ERROR ${upsertErr.code}: ${upsertErr.message}`)
    } else {
      diag.push('profiles upsert → OK')
    }

    // ── Step 3: Verify profile row exists ─────────────────────
    const { data: profileRow, error: profileSelectErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()
    if (profileSelectErr) {
      diag.push(`profiles select → ERROR ${profileSelectErr.code}: ${profileSelectErr.message}`)
    } else if (!profileRow) {
      diag.push('profiles select → ROW NOT FOUND (FK will fail!)')
    } else {
      diag.push('profiles select → row exists ✓')
    }

    // ── Step 4: Insert trip ────────────────────────────────────
    const { data, error } = await supabase
      .from('trips')
      .insert({ ...values, user_id: userId })
      .select()
      .single()

    if (error) {
      diag.push(`trips insert → ERROR ${error.code}: ${error.message}`)

      // Log full diagnostic to console
      console.group('🔴 createTrip FAILED — diagnostic')
      diag.forEach(l => console.log(l))
      console.log('userId:', userId)
      console.log('values:', values)
      console.groupEnd()

      // Show diagnostic in toast (truncated) + full detail in console
      const summary = diag.find(l => l.includes('ERROR')) ?? error.message
      toast.error(`Error: ${summary}`, { duration: 8000 })

      // travelers column missing → retry without it
      if (error.code === '42703' || error.message?.includes('travelers')) {
        console.warn('Retrying without travelers column...')
        const { travelers: _t, ...rest } = values
        const retry = await supabase
          .from('trips')
          .insert({ ...rest, user_id: userId })
          .select()
          .single()
        if (retry.error) {
          console.error('Retry also failed:', retry.error)
          throw retry.error
        }
        setTrips((prev) => [...prev, retry.data])
        return retry.data
      }

      throw error
    }

    diag.push('trips insert → OK ✓')
    console.group('✅ createTrip OK — diagnostic')
    diag.forEach(l => console.log(l))
    console.groupEnd()

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

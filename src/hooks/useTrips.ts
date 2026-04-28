import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import type { Trip } from '@/types/database'

// Columns guaranteed to exist in trips (original schema, no migrations needed)
const SAFE_COLS = ['name', 'description', 'start_date', 'end_date', 'user_id'] as const
type SafeInsert = Pick<Trip, 'name' | 'description' | 'start_date' | 'end_date'> & { user_id: string }

function buildInsertPayload(
  values: Pick<Trip, 'name' | 'description' | 'start_date' | 'end_date' | 'destination_slug' | 'travelers'>,
  userId: string,
  { withSlug, withTravelers }: { withSlug: boolean; withTravelers: boolean }
): Record<string, unknown> {
  const base: SafeInsert = {
    user_id: userId,
    name: values.name,
    description: values.description,
    start_date: values.start_date,
    end_date: values.end_date,
  }
  return {
    ...base,
    ...(withSlug     ? { destination_slug: values.destination_slug } : {}),
    ...(withTravelers ? { travelers: values.travelers }               : {}),
  }
}

export function useTrips(userId: string | undefined) {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
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
    if (error) { toast.error('Error cargando viajes'); console.error(error) }
    else setTrips(data ?? [])
    setLoading(false)
  }

  async function createTrip(
    values: Pick<Trip, 'name' | 'description' | 'start_date' | 'end_date' | 'destination_slug' | 'travelers'>
  ) {
    if (!userId) throw new Error('No hay sesión activa')

    const diag: string[] = []

    // ── Step 1: ensure profile ─────────────────────────────────
    const { error: rpcErr } = await supabase.rpc('ensure_own_profile')
    if (rpcErr) {
      diag.push(`RPC ensure_own_profile → ERROR ${rpcErr.code}: ${rpcErr.message}`)
      // Fallback: direct upsert
      const { error: upsertErr } = await supabase
        .from('profiles').upsert({ id: userId }, { onConflict: 'id' })
      diag.push(upsertErr
        ? `profiles upsert → ERROR ${upsertErr.code}: ${upsertErr.message}`
        : 'profiles upsert (fallback) → OK')
    } else {
      diag.push('RPC ensure_own_profile → OK')
    }

    // ── Step 2: try insert with all optional columns ───────────
    // Start with both optional cols, strip on PGRST204, fall back to safe-only
    const attempts: Array<{ withSlug: boolean; withTravelers: boolean; label: string }> = [
      { withSlug: true,  withTravelers: true,  label: 'full (slug+travelers)' },
      { withSlug: false, withTravelers: true,  label: 'no slug'               },
      { withSlug: true,  withTravelers: false, label: 'no travelers'          },
      { withSlug: false, withTravelers: false, label: 'safe-only'             },
    ]

    for (const attempt of attempts) {
      const payload = buildInsertPayload(values, userId, attempt)
      const { data, error } = await supabase
        .from('trips').insert(payload).select().single()

      if (!error) {
        diag.push(`trips insert (${attempt.label}) → OK ✓`)
        console.group('✅ createTrip OK')
        diag.forEach(l => console.log(l))
        console.groupEnd()
        setTrips(prev => [...prev, data])
        return data
      }

      diag.push(`trips insert (${attempt.label}) → ERROR ${error.code}: ${error.message}`)

      // PGRST204 = unknown column → try next attempt (strip that column)
      if (error.code === 'PGRST204') continue

      // Any other error: stop retrying
      console.group('🔴 createTrip FAILED')
      diag.forEach(l => console.log(l))
      console.log('userId:', userId)
      console.log('payload:', payload)
      console.groupEnd()

      const firstErr = diag.find(l => l.includes('ERROR')) ?? error.message
      toast.error(`Error: ${firstErr}`, { duration: 8000 })
      throw error
    }

    // All attempts exhausted (shouldn't happen with safe-only, but guard anyway)
    console.group('🔴 createTrip FAILED — all attempts exhausted')
    diag.forEach(l => console.log(l))
    console.groupEnd()
    const firstErr = diag.find(l => l.includes('ERROR')) ?? 'Unknown error'
    toast.error(`Error: ${firstErr}`, { duration: 8000 })
    throw new Error(firstErr)
  }

  async function deleteTrip(id: string) {
    const { error } = await supabase.from('trips').delete().eq('id', id)
    if (error) throw error
    setTrips(prev => prev.filter(t => t.id !== id))
  }

  return { trips, loading, createTrip, deleteTrip, refetch: fetchTrips }
}

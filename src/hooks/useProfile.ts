import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database'

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          toast.error('Error cargando perfil')
          console.error(error)
        } else {
          setProfile(data)
        }
        setLoading(false)
      })
  }, [userId])

  async function updateProfile(updates: Partial<Pick<Profile, 'full_name' | 'avatar_url'>>) {
    if (!userId) return
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    setProfile(data)
  }

  return { profile, loading, updateProfile }
}

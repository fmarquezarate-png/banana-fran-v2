import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/', { replace: true })
      } else {
        navigate('/login', { replace: true })
      }
    })
  }, [navigate])

  return (
    <div className="min-h-screen bg-crema flex items-center justify-center">
      <div className="text-center">
        <span className="text-4xl animate-pulse">🍌</span>
        <p className="text-gray-400 mt-3 text-sm">Iniciando sesión...</p>
      </div>
    </div>
  )
}

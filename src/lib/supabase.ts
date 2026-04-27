import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// El build de Netlify pasa aunque no haya vars — el error aparece solo al usar Supabase
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Variables de entorno no configuradas. ' +
      'Añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Netlify > Site settings > Environment variables.'
  )
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-key'
)

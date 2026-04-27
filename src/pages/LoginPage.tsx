import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'

type Mode = 'password' | 'magic'

export function LoginPage() {
  const { signInWithEmail, signInWithPassword, signUpWithPassword } = useAuth()
  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    try {
      await signInWithPassword(email, password)
    } catch (err: unknown) {
      // Si el usuario no existe, intentar registro
      const msg = (err as Error).message ?? ''
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials')) {
        toast.error('Email o contraseña incorrectos')
      } else {
        try {
          await signUpWithPassword(email, password)
          toast.success('Cuenta creada — revisa tu email para confirmar')
        } catch {
          toast.error('Error al crear la cuenta')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await signInWithEmail(email)
      setSent(true)
    } catch {
      toast.error('Error enviando el enlace. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-crema flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Branding */}
        <div className="text-center mb-8">
          <span className="text-5xl block mb-3">✈️</span>
          <h1 className="font-display text-3xl font-bold text-gray-900">
            The Vacation Planner
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Hola Fran 👋 — bienvenida de vuelta</p>
        </div>

        {/* Mode tabs */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-5">
          <button
            onClick={() => { setMode('password'); setSent(false) }}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
              mode === 'password' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            🔑 Contraseña
          </button>
          <button
            onClick={() => { setMode('magic'); setSent(false) }}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
              mode === 'magic' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            ✨ Magic link
          </button>
        </div>

        {mode === 'password' ? (
          <form onSubmit={handlePassword} className="card p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="fran@ejemplo.com"
                required
                autoFocus
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-egeo/50 focus:border-egeo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-egeo/50 focus:border-egeo"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
            <p className="text-center text-xs text-gray-400">
              Si es tu primera vez, se creará la cuenta automáticamente.
            </p>
          </form>
        ) : sent ? (
          <div className="card p-6 text-center">
            <span className="text-4xl">📬</span>
            <h2 className="font-semibold text-gray-900 mt-3 mb-1">Revisa tu correo</h2>
            <p className="text-gray-500 text-sm">
              Hemos enviado un enlace mágico a <strong>{email}</strong>.
            </p>
            <button onClick={() => setSent(false)} className="mt-4 text-sm text-egeo hover:underline">
              Usar otro correo
            </button>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="card p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tu correo</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="fran@ejemplo.com"
                required
                autoFocus
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-egeo/50 focus:border-egeo"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Enviando…' : 'Enviar enlace ✨'}
            </button>
            <p className="text-center text-xs text-gray-400">
              Sin contraseña — recibirás un enlace directo en tu email.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'

type Mode = 'magic' | 'password' | 'register'

export function LoginPage() {
  const { signInWithEmail, signInWithPassword, signUp } = useAuth()
  const [mode, setMode] = useState<Mode>('magic')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [registered, setRegistered] = useState(false)

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

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    try {
      await signInWithPassword(email, password)
    } catch (err: unknown) {
      const msg = (err as Error).message?.toLowerCase() ?? ''
      if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('wrong')) {
        toast.error('Email o contraseña incorrectos')
      } else if (msg.includes('email not confirmed')) {
        toast.error('Confirma tu email primero — revisa tu bandeja de entrada')
      } else {
        toast.error('Error al iniciar sesión')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setLoading(true)
    try {
      await signUp(email, password)
      setRegistered(true)
    } catch (err: unknown) {
      const msg = (err as Error).message?.toLowerCase() ?? ''
      console.error('signUp error:', err)
      if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('user already')) {
        toast.error('Ya existe una cuenta con ese email — usa "Entrar" o el magic link')
        switchMode('password')
      } else if (msg.includes('rate limit') || msg.includes('too many')) {
        toast.error('Demasiados intentos. Espera unos minutos e inténtalo de nuevo.')
      } else if (msg.includes('signup') && msg.includes('disabled')) {
        toast.error('El registro no está habilitado. Usa el magic link para entrar.')
        switchMode('magic')
      } else {
        toast.error((err as Error).message || 'Error creando la cuenta. Inténtalo de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  function switchMode(m: Mode) {
    setMode(m)
    setSent(false)
    setRegistered(false)
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
          <p className="text-gray-500 mt-1 text-sm">Tu próximo viaje empieza aquí</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-5">
          <button
            onClick={() => switchMode('magic')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              mode === 'magic' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            ✨ Magic link
          </button>
          <button
            onClick={() => switchMode('password')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              mode === 'password' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            🔑 Entrar
          </button>
          <button
            onClick={() => switchMode('register')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              mode === 'register' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            🆕 Registro
          </button>
        </div>

        {/* Magic link */}
        {mode === 'magic' && (
          sent ? (
            <div className="card p-6 text-center">
              <span className="text-4xl">📬</span>
              <h2 className="font-semibold text-gray-900 mt-3 mb-1">Revisa tu correo</h2>
              <p className="text-gray-500 text-sm">
                Hemos enviado un enlace a <strong>{email}</strong>. Haz clic en él para entrar.
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
                  placeholder="viajero@ejemplo.com"
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
                Recibirás un enlace directo en tu email — sin contraseña.
              </p>
            </form>
          )
        )}

        {/* Password login */}
        {mode === 'password' && (
          <form onSubmit={handlePassword} className="card p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="viajero@ejemplo.com"
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
              ¿Sin cuenta?{' '}
              <button type="button" onClick={() => switchMode('register')} className="text-egeo hover:underline">
                Regístrate
              </button>
              {' · '}
              <button type="button" onClick={() => switchMode('magic')} className="text-egeo hover:underline">
                Magic link
              </button>
            </p>
          </form>
        )}

        {/* Register */}
        {mode === 'register' && (
          registered ? (
            <div className="card p-6 text-center">
              <span className="text-4xl">📬</span>
              <h2 className="font-semibold text-gray-900 mt-3 mb-1">¡Cuenta creada!</h2>
              <p className="text-gray-500 text-sm">
                Hemos enviado un email de confirmación a <strong>{email}</strong>.
                Haz clic en el enlace para activar tu cuenta, luego inicia sesión con contraseña.
              </p>
              <button
                onClick={() => switchMode('password')}
                className="btn-primary w-full mt-4 text-sm"
              >
                Ir a iniciar sesión
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="card p-6 space-y-4">
              <p className="text-sm text-gray-600 font-medium">Crea una cuenta nueva</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="viajero@ejemplo.com"
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
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                             focus:outline-none focus:ring-2 focus:ring-egeo/50 focus:border-egeo"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading ? 'Creando cuenta…' : 'Crear cuenta'}
              </button>
              <p className="text-center text-xs text-gray-400">
                ¿Ya tienes cuenta?{' '}
                <button type="button" onClick={() => switchMode('password')} className="text-egeo hover:underline">
                  Inicia sesión
                </button>
              </p>
            </form>
          )
        )}
      </div>
    </div>
  )
}

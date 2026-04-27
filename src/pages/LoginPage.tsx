import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'

export function LoginPage() {
  const { signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      await signInWithEmail(email)
      setSent(true)
      toast.success('¡Enlace enviado! Revisa tu correo.')
    } catch {
      toast.error('Error enviando el enlace. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-crema flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-5xl">🍌</span>
          <h1 className="font-display text-3xl font-bold text-gray-900 mt-3">Banana & Fran</h1>
          <p className="text-gray-500 mt-1">Tu app de viajes personal</p>
        </div>

        {sent ? (
          <div className="card p-6 text-center">
            <span className="text-4xl">📬</span>
            <h2 className="font-semibold text-gray-900 mt-3 mb-1">Revisa tu correo</h2>
            <p className="text-gray-500 text-sm">
              Te hemos enviado un magic link a <strong>{email}</strong>. Haz clic en el enlace para entrar.
            </p>
            <button
              onClick={() => setSent(false)}
              className="mt-4 text-sm text-egeo hover:underline"
            >
              Usar otro correo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Tu correo
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="fran@ejemplo.com"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-egeo/50 focus:border-egeo
                           transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enviando...' : 'Enviar magic link ✨'}
            </button>

            <p className="text-center text-xs text-gray-400">
              Sin contraseñas. Solo un enlace mágico en tu email.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

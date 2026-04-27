import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'

export function ProfilePage() {
  const { user, signOut } = useAuth()
  const { profile, loading, updateProfile } = useProfile(user?.id)
  const [name, setName] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  function startEdit() {
    setName(profile?.full_name ?? '')
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setName('')
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      await updateProfile({ full_name: name.trim() })
      toast.success('Perfil actualizado')
      setEditing(false)
    } catch {
      toast.error('Error guardando el perfil')
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    try {
      await signOut()
    } catch {
      toast.error('Error cerrando sesión')
    }
  }

  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'Viajero'
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <main className="max-w-lg mx-auto px-4 py-6 pb-24 sm:pb-8">
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-6">Perfil</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="text-3xl animate-pulse">🍌</span>
        </div>
      ) : (
        <div className="space-y-4">

          {/* Avatar + nombre */}
          <div className="card p-6 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-egeo flex items-center justify-center
                            text-white font-display font-bold text-xl flex-shrink-0">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0">
              <p className="font-display font-bold text-lg text-gray-900 truncate">
                {displayName}
              </p>
              <p className="text-sm text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>

          {/* Nombre editable */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">Nombre</h2>
              {!editing && (
                <button onClick={startEdit} className="text-sm text-egeo hover:underline">
                  Editar
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  autoFocus
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                             focus:outline-none focus:ring-2 focus:ring-egeo/50 focus:border-egeo"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving || !name.trim()}
                    className="btn-primary text-sm py-2 px-4 disabled:opacity-50"
                  >
                    {saving ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button onClick={cancelEdit} className="btn-secondary text-sm py-2 px-4">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-sm">
                {profile?.full_name ?? (
                  <span className="text-gray-400 italic">Sin nombre configurado</span>
                )}
              </p>
            )}
          </div>

          {/* Info de cuenta */}
          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-gray-800">Cuenta</h2>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Email</span>
              <span className="text-gray-700 font-mono text-xs">{user?.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Acceso</span>
              <span className="text-gray-700">Magic link</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Miembro desde</span>
              <span className="text-gray-700">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('es-ES', {
                      month: 'long',
                      year: 'numeric',
                    })
                  : '—'}
              </span>
            </div>
          </div>

          {/* Cerrar sesión */}
          <button
            onClick={handleSignOut}
            className="w-full text-sm text-gray-400 hover:text-red-500 transition-colors py-3"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </main>
  )
}

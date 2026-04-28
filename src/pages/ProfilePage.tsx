import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'

const APP_VERSION = '0.4.0'

const CHANGELOG = [
  { v: '0.4.0', date: 'Abr 2026', notes: 'Registro con contraseña, viajeros por proyecto, subida de documentos (QRs), cambio de contraseña' },
  { v: '0.3.0', date: 'Abr 2026', notes: 'Asistente de viaje (encuesta + ranking de destinos), corrección del inicio de sesión' },
  { v: '0.2.0', date: 'Abr 2026', notes: 'Mapa de destinos, comparar, favoritos, valoraciones con estrellas, filtros y precio personalizado' },
  { v: '0.1.0', date: 'Abr 2026', notes: 'Lanzamiento inicial: catálogo de 30 destinos, zona warning, login con magic link' },
]

export function ProfilePage() {
  const { user, signOut, updatePassword } = useAuth()
  const { profile, loading, updateProfile } = useProfile(user?.id)

  const [name, setName] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [changingPwd, setChangingPwd] = useState(false)
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)

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

  function cancelPwd() {
    setChangingPwd(false)
    setNewPwd('')
    setConfirmPwd('')
  }

  async function handlePasswordSave() {
    if (newPwd.length < 6) { toast.error('Mínimo 6 caracteres'); return }
    if (newPwd !== confirmPwd) { toast.error('Las contraseñas no coinciden'); return }
    setSavingPwd(true)
    try {
      await updatePassword(newPwd)
      toast.success('Contraseña actualizada')
      cancelPwd()
    } catch (err: unknown) {
      const msg = (err as Error).message?.toLowerCase() ?? ''
      if (msg.includes('same password')) {
        toast.error('La nueva contraseña es igual a la actual')
      } else {
        toast.error('Error al cambiar la contraseña')
      }
    } finally {
      setSavingPwd(false)
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

          {/* Contraseña */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">Contraseña</h2>
              {!changingPwd && (
                <button onClick={() => setChangingPwd(true)} className="text-sm text-egeo hover:underline">
                  Cambiar
                </button>
              )}
            </div>

            {changingPwd ? (
              <div className="space-y-3">
                <input
                  type="password"
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  placeholder="Nueva contraseña (mín. 6 caracteres)"
                  autoFocus
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                             focus:outline-none focus:ring-2 focus:ring-egeo/50 focus:border-egeo"
                />
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={e => setConfirmPwd(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                             focus:outline-none focus:ring-2 focus:ring-egeo/50 focus:border-egeo"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handlePasswordSave}
                    disabled={savingPwd || !newPwd || !confirmPwd}
                    className="btn-primary text-sm py-2 px-4 disabled:opacity-50"
                  >
                    {savingPwd ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button onClick={cancelPwd} className="btn-secondary text-sm py-2 px-4">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">••••••••</p>
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

          {/* Versión y changelog */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">The Vacation Planner</h2>
              <span className="text-xs bg-egeo/10 text-egeo font-semibold px-2 py-0.5 rounded-full">
                v{APP_VERSION}
              </span>
            </div>
            <div className="space-y-3">
              {CHANGELOG.map(entry => (
                <div key={entry.v} className="border-l-2 border-gray-100 pl-3">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-gray-700">v{entry.v}</span>
                    <span className="text-xs text-gray-400">{entry.date}</span>
                  </div>
                  <p className="text-xs text-gray-500">{entry.notes}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </main>
  )
}

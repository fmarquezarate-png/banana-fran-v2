import { createContext, useContext, useState } from 'react'

const KEY = 'tvp_favorites'

interface FavCtx {
  favorites: string[]
  toggle: (id: string) => void
  isFav: (id: string) => boolean
}

const Ctx = createContext<FavCtx>({ favorites: [], toggle: () => {}, isFav: () => false })

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
  })

  function toggle(id: string) {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <Ctx.Provider value={{ favorites, toggle, isFav: id => favorites.includes(id) }}>
      {children}
    </Ctx.Provider>
  )
}

export const useFavorites = () => useContext(Ctx)

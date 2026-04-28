import { createContext, useContext, useState } from 'react'

const KEY = 'tvp_ratings'
export type RatingValue = 1 | 2 | 3 | 4 | 5

interface RatingsCtx {
  ratings: Record<string, RatingValue>
  setRating: (id: string, rating: RatingValue | 0) => void
  getRating: (id: string) => RatingValue | 0
}

const Ctx = createContext<RatingsCtx>({ ratings: {}, setRating: () => {}, getRating: () => 0 })

export function RatingsProvider({ children }: { children: React.ReactNode }) {
  const [ratings, setRatings] = useState<Record<string, RatingValue>>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') } catch { return {} }
  })

  function setRating(id: string, rating: RatingValue | 0) {
    setRatings(prev => {
      const next = { ...prev }
      if (rating === 0) delete next[id]
      else next[id] = rating
      localStorage.setItem(KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <Ctx.Provider value={{ ratings, setRating, getRating: id => ratings[id] ?? 0 }}>
      {children}
    </Ctx.Provider>
  )
}

export const useRatings = () => useContext(Ctx)

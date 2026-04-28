import { useState } from 'react'
import type { RatingValue } from '@/contexts/RatingsContext'

interface Props {
  value: RatingValue | 0
  onChange?: (v: RatingValue | 0) => void
  size?: 'sm' | 'md' | 'lg'
  readOnly?: boolean
}

const SIZE = { sm: 'text-sm', md: 'text-xl', lg: 'text-3xl' }

export function StarRating({ value, onChange, size = 'md', readOnly = false }: Props) {
  const [hover, setHover] = useState(0)

  const display = hover || value

  if (readOnly) {
    return (
      <span className={`${SIZE[size]} tracking-tight`}>
        {[1,2,3,4,5].map(i => (
          <span key={i} className={i <= value ? 'text-amber-400' : 'text-gray-200'}>★</span>
        ))}
      </span>
    )
  }

  return (
    <span className={`${SIZE[size]} tracking-tight select-none`}>
      {[1,2,3,4,5].map(i => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange?.(i === value ? 0 : i as RatingValue)}
          className={`transition-colors ${i <= display ? 'text-amber-400' : 'text-gray-200 hover:text-amber-300'}`}
        >
          ★
        </button>
      ))}
      {value > 0 && (
        <button
          type="button"
          onClick={() => onChange?.(0)}
          className="text-gray-300 hover:text-red-400 text-xs ml-1 align-middle"
          title="Quitar valoración"
        >
          ✕
        </button>
      )}
    </span>
  )
}

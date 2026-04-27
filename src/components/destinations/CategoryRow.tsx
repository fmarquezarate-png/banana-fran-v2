import { useRef } from 'react'
import type { Destination, DestinationCategory } from '@/data/destinations'
import { DestinationCard } from './DestinationCard'

interface Props {
  title: string
  subtitle?: string
  destinations: Destination[]
  category: DestinationCategory
}

const ROW_ACCENT: Record<DestinationCategory, string> = {
  perfect: 'text-egeo',
  good: 'text-arena-dark',
  ok: 'text-gray-500',
  warning: 'text-warning-red',
}

export function CategoryRow({ title, subtitle, destinations, category }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  if (destinations.length === 0) return null

  return (
    <section className="mb-10">
      {/* Cabecera de fila */}
      <div className="px-4 mb-3">
        <h2 className={`font-display text-xl font-bold ${ROW_ACCENT[category]}`}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-gray-400 text-xs mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Scroll horizontal */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto px-4 pb-3
                   scrollbar-hide snap-x snap-mandatory"
      >
        {destinations.map((dest) => (
          <div key={dest.id} className="snap-start">
            <DestinationCard dest={dest} />
          </div>
        ))}
      </div>
    </section>
  )
}

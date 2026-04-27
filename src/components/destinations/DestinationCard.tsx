import { Link } from 'react-router-dom'
import type { Destination } from '@/data/destinations'
import { useFavorites } from '@/contexts/FavoritesContext'

interface Props {
  dest: Destination
}

const CATEGORY_BADGE: Record<Destination['category'], string> = {
  perfect: 'bg-egeo text-white',
  good: 'bg-arena text-white',
  ok: 'bg-gray-500 text-white',
  warning: 'bg-warning-red text-white',
}

export function DestinationCard({ dest }: Props) {
  const isWarning = dest.category === 'warning'
  const { isFav, toggle } = useFavorites()
  const fav = isFav(dest.id)

  return (
    <div className="group relative flex-shrink-0 w-44 sm:w-52">
      <Link
        to={`/destino/${dest.id}`}
        className="block rounded-2xl overflow-hidden shadow-md hover:shadow-xl
                   transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03]"
      >
        {/* Imagen */}
        <div className="relative h-32 sm:h-36 overflow-hidden bg-gray-200">
          <img
            src={dest.images[0]}
            alt={dest.name}
            className="w-full h-full object-cover transition-transform duration-500
                       group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full
                            ${CATEGORY_BADGE[dest.category]}`}>
            {dest.match} {dest.matchLabel}
          </span>
        </div>

        {/* Info */}
        <div className={`p-3 ${isWarning ? 'bg-gray-900 text-white' : 'bg-white'}`}>
          <p className={`font-display font-bold text-sm leading-tight truncate
                         ${isWarning ? 'text-warning-yellow' : 'text-gray-900'}`}>
            {dest.name}
          </p>
          <p className={`text-xs mt-0.5 truncate ${isWarning ? 'text-gray-400' : 'text-gray-500'}`}>
            {dest.country}
          </p>
          <p className={`text-xs mt-1.5 leading-snug line-clamp-2 opacity-0 max-h-0
                         group-hover:opacity-100 group-hover:max-h-10
                         transition-all duration-300
                         ${isWarning ? 'text-gray-300' : 'text-gray-600'}`}>
            {dest.tagline}
          </p>
        </div>

        {isWarning && <div className="h-1 w-full bg-warning-stripes" />}
      </Link>

      {/* Star button — fuera del Link para no navegar */}
      <button
        onClick={() => toggle(dest.id)}
        className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center
                    text-sm transition-all duration-200 z-10
                    ${fav
                      ? 'bg-amber-400 text-white scale-110'
                      : 'bg-black/30 text-white/70 opacity-0 group-hover:opacity-100 hover:bg-amber-400 hover:text-white'
                    }`}
        title={fav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      >
        {fav ? '★' : '☆'}
      </button>
    </div>
  )
}

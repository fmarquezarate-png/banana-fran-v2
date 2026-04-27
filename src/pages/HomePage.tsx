import { destinations } from '@/data/destinations'

export function HomePage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-6 pb-20 sm:pb-6">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-1">Catálogo de destinos</h1>
        <p className="text-gray-500 text-sm">{destinations.length} destinos · Tarea 4 pendiente</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {destinations.map((dest) => (
          <article key={dest.id} className="card p-4">
            {/* Placeholder imagen */}
            <div className="h-36 rounded-xl bg-gradient-to-br from-egeo/20 to-arena/30 mb-3 flex items-center justify-center">
              <span className="text-4xl">🌍</span>
            </div>

            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold text-gray-900">{dest.name}</h2>
                <p className="text-sm text-gray-500">{dest.country}</p>
              </div>
              {dest.matchScore && (
                <span className="shrink-0 bg-egeo/10 text-egeo text-xs font-bold px-2 py-1 rounded-lg">
                  {dest.matchScore}%
                </span>
              )}
            </div>

            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{dest.description}</p>

            <div className="mt-3 flex flex-wrap gap-1">
              {dest.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </main>
  )
}

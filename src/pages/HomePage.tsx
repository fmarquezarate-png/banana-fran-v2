import { DESTINATIONS } from '@/data/destinations'

export function HomePage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-6 pb-20 sm:pb-6">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-1">Catálogo de destinos</h1>
        <p className="text-gray-500 text-sm">
          {DESTINATIONS.length} destinos · paso 4b-4d pendiente
        </p>
      </div>

      <div className="card p-8 text-center text-gray-400">
        <span className="text-4xl block mb-3">🌍</span>
        <p className="font-medium">Los destinos se cargan en los pasos 4b–4f</p>
      </div>
    </main>
  )
}

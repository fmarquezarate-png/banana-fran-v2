// Tarea 5: Ficha de destino individual
import { useParams } from 'react-router-dom'
import { destinations } from '@/data/destinations'

export function DestinationPage() {
  const { id } = useParams<{ id: string }>()
  const dest = destinations.find((d) => d.id === id)

  if (!dest) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-6">
        <p className="text-gray-500">Destino no encontrado.</p>
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 pb-20 sm:pb-6">
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">{dest.name}</h1>
      <p className="text-gray-500 mb-6">{dest.country} · {dest.region}</p>
      <div className="card p-8 text-center text-gray-400">
        <p className="font-medium">Próximamente — Tarea 5</p>
        <p className="text-sm mt-1">Ficha completa con mapa, ratings y cotizaciones.</p>
      </div>
    </main>
  )
}

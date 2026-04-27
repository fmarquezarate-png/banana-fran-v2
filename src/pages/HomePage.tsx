import { getDestinationsByCategory } from '@/data/destinations'
import { CategoryRow } from '@/components/destinations/CategoryRow'

export function HomePage() {
  const perfect = getDestinationsByCategory('perfect')
  const good = getDestinationsByCategory('good')
  const ok = getDestinationsByCategory('ok')
  const warning = getDestinationsByCategory('warning')

  return (
    <main className="py-6 pb-24 sm:pb-8">
      {/* Hero */}
      <div className="px-4 mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
          ¿A dónde vamos<br />
          <span className="text-egeo">este verano?</span>
        </h1>
        <p className="text-gray-400 text-sm mt-2">
          {perfect.length + good.length + ok.length + warning.length} destinos
          analizados para vosotros
        </p>
      </div>

      <CategoryRow
        category="perfect"
        title="🔥 Perfecto para vosotros"
        subtitle="Los que mejor encajan con lo que buscáis"
        destinations={perfect}
      />

      <CategoryRow
        category="good"
        title="👍 Muy bueno"
        subtitle="Grandes opciones con algún pero menor"
        destinations={good}
      />

      <CategoryRow
        category="ok"
        title="👌 Está bien"
        subtitle="Vale la pena con expectativas claras"
        destinations={ok}
      />

      <CategoryRow
        category="warning"
        title="⚠️ Con cautela"
        subtitle="Sitios famosos con masificación o precio alto"
        destinations={warning}
      />
    </main>
  )
}

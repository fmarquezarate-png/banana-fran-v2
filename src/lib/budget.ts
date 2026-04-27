import type { DestinationQuotation } from '@/types/database'

// Suma todas las cotizaciones de un destino
export function totalBudget(quotations: DestinationQuotation[]): number {
  return quotations.reduce((acc, q) => acc + q.amount, 0)
}

// Agrupa cotizaciones por categoría y suma
export function budgetByCategory(
  quotations: DestinationQuotation[]
): Record<string, number> {
  return quotations.reduce(
    (acc, q) => {
      acc[q.category] = (acc[q.category] ?? 0) + q.amount
      return acc
    },
    {} as Record<string, number>
  )
}

// Formatea un número como precio en euros
export function formatPrice(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

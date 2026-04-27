// Cálculo de presupuesto — lógica fiel al HTML v1
import type { Destination } from '@/data/destinations'

export type BudgetLevel = 'mochilero' | 'medio' | 'confort' | 'lujo'

export const LEVEL_MULT: Record<BudgetLevel, number> = {
  mochilero: 0.55,
  medio: 1.0,
  confort: 1.55,
  lujo: 2.6,
}

export const LEVEL_LABEL: Record<BudgetLevel, string> = {
  mochilero: 'Mochilero',
  medio: 'Medio',
  confort: 'Confort',
  lujo: 'Lujo',
}

export const TRIP_DAYS = [3, 5, 7, 10, 14] as const
export type TripDays = (typeof TRIP_DAYS)[number]

export interface BudgetCat {
  key: string
  icon: string
  name: string
  desc: string
  mid: number
  min: number
  max: number
}

export interface BudgetResult {
  cats: BudgetCat[]
  totalMid: number
  totalMin: number
  totalMax: number
}

export function calcBudget(
  dest: Destination,
  days: number,
  level: BudgetLevel,
  perPerson: boolean
): BudgetResult {
  const mult = LEVEL_MULT[level]
  const b = dest.budget

  // Vuelos: no escalan con días ni nivel de forma significativa
  const flightTotal = b.flightPP * 2
  const flightMid = Math.round(flightTotal)
  const flightMin = Math.round(flightTotal * (1 - b.fr))
  const flightMax = Math.round(flightTotal * (1 + b.fr))

  const hotel = b.hotelPD * days * mult
  const food = b.foodPD * days * mult
  const act = b.actPD * days * mult

  const cats: BudgetCat[] = [
    {
      key: 'flight',
      icon: '✈️',
      name: 'Vuelos',
      desc: `Ida + vuelta · 2 pax · BCN`,
      mid: flightMid,
      min: flightMin,
      max: flightMax,
    },
    {
      key: 'hotel',
      icon: '🏠',
      name: 'Alojamiento',
      desc: `${days} noches · nivel ${LEVEL_LABEL[level]}`,
      mid: hotel,
      min: hotel * (1 - b.hr),
      max: hotel * (1 + b.hr),
    },
    {
      key: 'food',
      icon: '🍽️',
      name: 'Comida',
      desc: `${days} días · desayuno, comida, cena`,
      mid: food,
      min: food * (1 - b.fdr),
      max: food * (1 + b.fdr),
    },
    {
      key: 'act',
      icon: '🎫',
      name: 'Actividades',
      desc: `${days} días · excursiones, transporte local`,
      mid: act,
      min: act * (1 - b.ar),
      max: act * (1 + b.ar),
    },
  ]

  const result: BudgetResult = {
    cats,
    totalMid: cats.reduce((s, c) => s + c.mid, 0),
    totalMin: cats.reduce((s, c) => s + c.min, 0),
    totalMax: cats.reduce((s, c) => s + c.max, 0),
  }

  if (perPerson) {
    return {
      cats: result.cats.map((c) => ({
        ...c,
        mid: c.mid / 2,
        min: c.min / 2,
        max: c.max / 2,
      })),
      totalMid: result.totalMid / 2,
      totalMin: result.totalMin / 2,
      totalMax: result.totalMax / 2,
    }
  }

  return result
}

export function formatPrice(amount: number): string {
  return '€' + Math.round(amount).toLocaleString('es-ES')
}

// Rango en % entre min y max respecto al mid
export function rangePercent(result: BudgetResult): number {
  return Math.round(((result.totalMax - result.totalMin) / result.totalMid / 2) * 100)
}

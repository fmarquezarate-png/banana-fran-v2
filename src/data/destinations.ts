// ============================================================
// TIPOS — estructura fiel al HTML v1
// ============================================================

export type DestinationCategory = 'perfect' | 'good' | 'ok' | 'warning'
export type MatchEmoji = '🔥' | '👍' | '👌' | '🚫' | '⚠️'

export interface DestinationBudget {
  flightPP: number // vuelo por persona desde BCN
  fr: number       // fracción de variación del vuelo (0.20 = ±20%)
  hotelPD: number  // hotel por día pareja, nivel medio
  hr: number       // variación hotel
  foodPD: number   // comida por día pareja, nivel medio
  fdr: number      // variación comida
  actPD: number    // actividades por día pareja, nivel medio
  ar: number       // variación actividades
}

// Plan corto (3 y 5 días): lista de strings
export type ShortPlan = string[]

// Plan largo (7, 10, 14 días): [etiqueta, título, texto]
export type LongPlanEntry = [label: string, title: string, text: string]
export type LongPlan = LongPlanEntry[]

export interface Destination {
  id: string
  name: string
  shortName: string
  country: string
  match: MatchEmoji
  matchLabel: string
  tagline: string
  category: DestinationCategory
  coords: [lat: number, lng: number]
  images: string[]
  // story puede ser un string único o array de párrafos (formato v1)
  story: string | string[]
  // fit puede ser un string único o array de bullets
  fit: string | string[]
  warning?: string
  // facts es flexible: keys distintas según el origen del dato
  facts: Record<string, string>
  musts: string[]
  dishes: string[]
  plans3: ShortPlan
  plans5: ShortPlan
  plans7: LongPlan
  plans10: LongPlan
  plans14: LongPlan
  budget: DestinationBudget
}

// ============================================================
// DATOS — se importan desde los archivos por tanda
// ============================================================
import { DESTINATIONS_PERFECT } from './destinations-perfect'
import { DESTINATIONS_GOOD } from './destinations-good'
import { DESTINATIONS_OK } from './destinations-ok'
import { DESTINATIONS_WARNING } from './destinations-warning'

export const DESTINATIONS: Destination[] = [
  ...DESTINATIONS_PERFECT,
  ...DESTINATIONS_GOOD,
  ...DESTINATIONS_OK,
  ...DESTINATIONS_WARNING,
]

// Helpers de acceso rápido
export const DESTINATIONS_BY_ID = Object.fromEntries(
  DESTINATIONS.map((d) => [d.id, d])
) as Record<string, Destination>

export function getDestination(id: string): Destination | undefined {
  return DESTINATIONS_BY_ID[id]
}

export function getDestinationsByCategory(category: DestinationCategory): Destination[] {
  return DESTINATIONS.filter((d) => d.category === category)
}

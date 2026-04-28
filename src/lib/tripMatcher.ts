import type { Destination } from '@/data/destinations'
import { calcBudget } from '@/lib/budget'

export interface TripAnswers {
  days:     '3-5' | '5-7' | '7-10' | '10-14'
  vibe:     'beach' | 'nature' | 'culture' | 'mix'
  month:    'jun' | 'jul' | 'aug' | 'sep' | 'any'
  crowds:   'hate' | 'ok' | 'dontcare'
  budget:   'low' | 'mid' | 'high' | 'nolimit'
  novelty:  'popular' | 'hidden' | 'any'
  musts:    string[]  // 'snorkel' | 'hiking' | 'nightlife' | 'history' | 'beaches' | 'peace'
  car:      'yes' | 'maybe' | 'no'
}

const DAYS_MAP: Record<TripAnswers['days'], number> = {
  '3-5': 4, '5-7': 6, '7-10': 8, '10-14': 12,
}

const BUDGET_RANGE: Record<TripAnswers['budget'], [number, number]> = {
  low:     [0,    600],
  mid:     [600,  1100],
  high:    [1100, 1600],
  nolimit: [1600, 9999],
}

// Keywords por tipo de vibe / actividad (busca en toda la data del destino)
const KEYWORDS: Record<string, string[]> = {
  beach:    ['playa', 'snorkel', 'agua', 'cala', 'bahía', 'arena', 'bañar', 'cristal', 'transparente', 'isla', 'plataform'],
  nature:   ['senderismo', 'montaña', 'naturaleza', 'bosque', 'ruta', 'parque', 'acantilado', 'trekking', 'verde'],
  culture:  ['castillo', 'medieval', 'museo', 'arquitectura', 'historia', 'antigua', 'palacio', 'ciudad', 'casco', 'civilizac'],
  snorkel:  ['snorkel', 'buceo', 'submarino', 'fondo', 'peces', 'agua cristal'],
  hiking:   ['senderismo', 'montaña', 'ruta', 'trekking', 'acantilado', 'camino'],
  nightlife:['fiesta', 'noche', 'bares', 'club', 'vida nocturna', 'terraza', 'ambiente'],
  history:  ['castillo', 'medieval', 'historia', 'arqueología', 'antigua', 'imperio', 'venezian', 'romano'],
  beaches:  ['playa', 'cala', 'arena', 'bahía', 'costa', 'litoral'],
  peace:    ['tranquil', 'silencio', 'auténtico', 'local', 'sin turistas', 'poco visitado', 'escondido', 'calma'],
}

function countKeywords(dest: Destination, keys: string[]): number {
  const haystack = JSON.stringify(dest).toLowerCase()
  return keys.filter(k => haystack.includes(k)).length
}

export interface ScoredDestination {
  dest: Destination
  score: number
  reasons: string[]
}

export function scoreDests(
  destinations: Destination[],
  answers: TripAnswers
): ScoredDestination[] {
  const days = DAYS_MAP[answers.days]
  const [budgetMin, budgetMax] = BUDGET_RANGE[answers.budget]

  return destinations.map(dest => {
    let score = 0
    const reasons: string[] = []

    // 1. Base por categoría (0-40)
    const catBase = { perfect: 40, good: 30, ok: 22, warning: 8 }
    score += catBase[dest.category]

    // 2. Multitudes (±20)
    if (answers.crowds === 'hate') {
      if (dest.category === 'warning') { score -= 20; reasons.push('Muy masificado para tu preferencia') }
      if (dest.category === 'ok' || dest.category === 'perfect') { score += 8; reasons.push('Buen nivel de tranquilidad') }
    } else if (answers.crowds === 'ok') {
      if (dest.category === 'warning') score -= 8
    }

    // 3. Presupuesto (±15)
    const budgetResult = calcBudget(dest, days, 'medio', true)
    const ppTotal = budgetResult.totalMid
    if (ppTotal >= budgetMin && ppTotal <= budgetMax) {
      score += 15
      reasons.push(`Encaja en tu presupuesto (~€${Math.round(ppTotal)}pp)`)
    } else if (ppTotal < budgetMin) {
      score += 8  // más barato de lo esperado, también está bien
    } else {
      score -= 10  // más caro de lo esperado
    }

    // 4. Vibe (0-20 basado en keywords)
    const vibeKws = answers.vibe === 'mix' ? [...KEYWORDS.beach, ...KEYWORDS.nature, ...KEYWORDS.culture]
                  : KEYWORDS[answers.vibe] ?? []
    const vibeHits = countKeywords(dest, vibeKws)
    const vibeScore = Math.min(20, vibeHits * 4)
    score += vibeScore
    if (vibeScore >= 12) {
      const vibeLabels = { beach: 'Playas y agua', nature: 'Naturaleza', culture: 'Cultura', mix: 'Variedad' }
      reasons.push(`Fuerte en: ${vibeLabels[answers.vibe]}`)
    }

    // 5. Novedad / popularidad (±10)
    if (answers.novelty === 'hidden') {
      if (dest.category === 'warning') { score -= 10; }
      if (dest.category === 'ok')      { score += 10; reasons.push('Destino menos turístico') }
      if (dest.category === 'perfect') { score += 5;  reasons.push('Destino curado y auténtico') }
    } else if (answers.novelty === 'popular') {
      if (dest.category === 'warning') { score += 5; reasons.push('Destino icónico') }
    }

    // 6. Actividades imprescindibles (0-15)
    let actScore = 0
    for (const must of answers.musts) {
      const hits = countKeywords(dest, KEYWORDS[must] ?? [])
      if (hits >= 2) {
        actScore += 5
        const labels: Record<string, string> = {
          snorkel: 'Snorkel/buceo', hiking: 'Senderismo', nightlife: 'Vida nocturna',
          history: 'Historia', beaches: 'Playas', peace: 'Tranquilidad',
        }
        reasons.push(`Tiene: ${labels[must] ?? must}`)
      }
    }
    score += Math.min(15, actScore)

    // 7. Mes / masificación estacional (±8)
    if ((answers.month === 'jul' || answers.month === 'aug') && dest.category === 'warning') {
      score -= 8  // peor época para destinos masificados
    }
    if (answers.month === 'sep' && (dest.category === 'perfect' || dest.category === 'good')) {
      score += 5; reasons.push('Excelente en septiembre')
    }

    // Asegurar rango 0-100
    score = Math.max(0, Math.min(100, score))

    return { dest, score, reasons: [...new Set(reasons)] }
  })
    .sort((a, b) => b.score - a.score)
}

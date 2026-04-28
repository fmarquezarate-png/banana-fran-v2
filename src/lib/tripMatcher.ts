import type { Destination } from '@/data/destinations'
import { calcBudget } from '@/lib/budget'

export interface TripAnswers {
  days:          '3-5' | '5-7' | '7-10' | '10-14'
  travelers:     '1' | '2' | '3' | '4+'
  vibe:          'beach' | 'nature' | 'culture' | 'mix'
  month:         'spring' | 'summer' | 'autumn' | 'winter' | 'any'
  crowds:        'hate' | 'ok' | 'dontcare'
  budget:        'low' | 'mid' | 'high' | 'nolimit'
  novelty:       'popular' | 'hidden' | 'any'
  musts:         string[]   // 'snorkel'|'hiking'|'nightlife'|'history'|'beaches'|'peace'
  car:           'yes' | 'maybe' | 'no'
  // ── Nuevas (v0.7) ──────────────────────────────────────────
  region:        'europe' | 'americas' | 'asia' | 'africa' | 'oceania' | 'any'
  zone:          'coast' | 'mountains' | 'cities' | 'islands' | 'any'
  accommodation: 'hotel' | 'boutique' | 'apartment' | 'any'
  pace:          'relaxed' | 'moderate' | 'intense'
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

const REGION_COUNTRIES: Record<string, string[]> = {
  europe:   ['italia', 'grecia', 'portugal', 'croacia', 'montenegro', 'hungría', 'malta',
             'república checa', 'españa', 'holanda', 'países bajos', 'austria', 'alemania',
             'francia', 'suiza', 'bélgica', 'irlanda', 'noruega', 'islandia'],
  africa:   ['marruecos', 'túnez', 'egipto', 'kenia', 'tanzanía', 'sudáfrica'],
  asia:     ['japón', 'tailandia', 'vietnam', 'indonesia', 'india', 'singapur', 'bali', 'camboya'],
  americas: ['méxico', 'colombia', 'brasil', 'argentina', 'cuba', 'perú', 'costa rica', 'chile'],
  oceania:  ['australia', 'nueva zelanda', 'fiyi', 'tahití'],
}

const KEYWORDS: Record<string, string[]> = {
  beach:     ['playa', 'snorkel', 'agua', 'cala', 'bahía', 'arena', 'bañar', 'cristal', 'transparente', 'isla', 'plataform'],
  nature:    ['senderismo', 'montaña', 'naturaleza', 'bosque', 'ruta', 'parque', 'acantilado', 'trekking', 'verde'],
  culture:   ['castillo', 'medieval', 'museo', 'arquitectura', 'historia', 'antigua', 'palacio', 'ciudad', 'casco', 'civilizac'],
  snorkel:   ['snorkel', 'buceo', 'submarino', 'fondo', 'peces', 'agua cristal'],
  hiking:    ['senderismo', 'montaña', 'ruta', 'trekking', 'acantilado', 'camino'],
  nightlife: ['fiesta', 'noche', 'bares', 'club', 'vida nocturna', 'terraza', 'ambiente'],
  history:   ['castillo', 'medieval', 'historia', 'arqueología', 'antigua', 'imperio', 'venezian', 'romano'],
  beaches:   ['playa', 'cala', 'arena', 'bahía', 'costa', 'litoral'],
  peace:     ['tranquil', 'silencio', 'auténtico', 'local', 'sin turistas', 'poco visitado', 'escondido', 'calma'],
  // zona
  coast:     ['playa', 'costa', 'litoral', 'mar', 'oceáno', 'bahía', 'cala', 'puerto'],
  mountains: ['montaña', 'sierra', 'volcán', 'cañón', 'senderismo', 'cumbre', 'cordillera'],
  cities:    ['ciudad', 'capital', 'casco', 'barrio', 'urbano', 'museo', 'teatro', 'galería'],
  islands:   ['isla', 'islas', 'archipiélago', 'insular', 'azores', 'creta', 'malta', 'lefkada'],
  // ritmo
  relaxed:   ['tranquil', 'calma', 'descanso', 'pausado', 'slow', 'silencio', 'relajar'],
  intense:   ['actividades', 'museos', 'rutas', 'excursión', 'visitar', 'imprescindible', 'agenda'],
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

    // 1. Base por categoría (0-30)
    const catBase = { perfect: 30, good: 22, ok: 16, warning: 6 }
    score += catBase[dest.category]

    // 2. Región geográfica (±25) — filtro fuerte
    if (answers.region !== 'any') {
      const countryLower = dest.country.toLowerCase()
      const inRegion = (REGION_COUNTRIES[answers.region] ?? []).some(c => countryLower.includes(c))
      if (inRegion) {
        score += 25
        const labels: Record<string, string> = {
          europe: 'Europa', americas: 'Américas', asia: 'Asia', africa: 'África', oceania: 'Oceanía',
        }
        reasons.push(`En ${labels[answers.region]}`)
      } else {
        score -= 25
      }
    }

    // 3. Zona / entorno (±12)
    if (answers.zone !== 'any') {
      const zoneKws = KEYWORDS[answers.zone] ?? []
      const zoneHits = countKeywords(dest, zoneKws)
      if (zoneHits >= 3) {
        score += 12
        const zoneLabels: Record<string, string> = { coast: 'Costa y playas', mountains: 'Montaña', cities: 'Ciudad/cultura', islands: 'Isla' }
        reasons.push(`Encaja: ${zoneLabels[answers.zone]}`)
      } else if (zoneHits === 0) {
        score -= 8
      }
    }

    // 4. Multitudes (±15)
    if (answers.crowds === 'hate') {
      if (dest.category === 'warning') { score -= 15; reasons.push('Muy masificado') }
      if (dest.category === 'perfect') { score += 8;  reasons.push('Buen nivel de tranquilidad') }
    } else if (answers.crowds === 'ok') {
      if (dest.category === 'warning') score -= 6
    }

    // 5. Presupuesto (±15)
    const budgetResult = calcBudget(dest, days, 'medio', true)
    const ppTotal = budgetResult.totalMid
    if (ppTotal >= budgetMin && ppTotal <= budgetMax) {
      score += 15
      reasons.push(`Encaja en presupuesto (~€${Math.round(ppTotal)}pp)`)
    } else if (ppTotal < budgetMin) {
      score += 6
    } else {
      score -= 10
    }

    // 6. Vibe (0-18)
    const vibeKws = answers.vibe === 'mix'
      ? [...KEYWORDS.beach, ...KEYWORDS.nature, ...KEYWORDS.culture]
      : KEYWORDS[answers.vibe] ?? []
    const vibeHits = countKeywords(dest, vibeKws)
    const vibeScore = Math.min(18, vibeHits * 3)
    score += vibeScore
    if (vibeScore >= 12) {
      const vibeLabels: Record<string, string> = { beach: 'Playas y agua', nature: 'Naturaleza', culture: 'Cultura', mix: 'Variedad' }
      reasons.push(`Fuerte en: ${vibeLabels[answers.vibe]}`)
    }

    // 7. Ritmo de viaje (±8)
    if (answers.pace !== 'moderate') {
      const paceKws = KEYWORDS[answers.pace] ?? []
      const paceHits = countKeywords(dest, paceKws)
      if (paceHits >= 2) {
        score += 8
        if (answers.pace === 'relaxed') reasons.push('Ritmo tranquilo, sin prisas')
        if (answers.pace === 'intense') reasons.push('Mucho que ver y hacer')
      }
    }

    // 8. Novedad / popularidad (±10)
    if (answers.novelty === 'hidden') {
      if (dest.category === 'warning') { score -= 10 }
      if (dest.category === 'ok')      { score += 10; reasons.push('Destino menos turístico') }
      if (dest.category === 'perfect') { score += 5;  reasons.push('Destino curado y auténtico') }
    } else if (answers.novelty === 'popular') {
      if (dest.category === 'warning') { score += 5; reasons.push('Destino icónico') }
    }

    // 9. Actividades imprescindibles (0-15)
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

    // 10. Temporada (±8)
    if ((answers.month === 'summer') && dest.category === 'warning') {
      score -= 8
    }
    if (answers.month === 'autumn' && (dest.category === 'perfect' || dest.category === 'good')) {
      score += 5; reasons.push('Excelente en otoño')
    }
    if (answers.month === 'winter' && dest.category === 'perfect') {
      score += 3 // destinos curados suelen aguantar bien el invierno
    }

    score = Math.max(0, Math.min(100, score))

    return { dest, score, reasons: [...new Set(reasons)] }
  })
    .sort((a, b) => b.score - a.score)
}

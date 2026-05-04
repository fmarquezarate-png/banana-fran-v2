import type { Destination, DestinationCategory, DestinationScales } from '@/data/destinations'
import { calcBudget } from '@/lib/budget'

export interface TripAnswers {
  days:            number    // días totales de viaje (ej: 7)
  travelers:       number    // número de viajeros (ej: 2)
  month:           'spring' | 'summer' | 'autumn' | 'winter' | 'any' | null
  crowds:          'hate' | 'ok' | 'dontcare' | null
  budget:          number    // presupuesto máx por persona en € (ej: 800)
  musts:           string[]
  car:             'yes' | 'maybe' | 'no' | null
  region:          'europe' | 'americas' | 'asia' | 'africa' | 'oceania' | 'any' | null
  noNegociable:    string[]
  // Escalas 1-10 (11 dimensiones)
  playa_ciudad:           number
  relax_fiesta:           number
  lowcost_fancy:          number
  invierno_verano:        number
  occidental_exotico:     number
  streetfood_gourmet:     number
  descanso_aventura:      number
  solo_grupal:            number
  naturaleza_metropolis:  number
  moderno_historico:      number
  turistico_desconocido:  number
}

export const SCALE_KEYS: (keyof DestinationScales)[] = [
  'playa_ciudad', 'relax_fiesta', 'lowcost_fancy', 'invierno_verano',
  'occidental_exotico', 'streetfood_gourmet', 'descanso_aventura',
  'solo_grupal', 'naturaleza_metropolis', 'moderno_historico',
  'turistico_desconocido',
]

export const SCALE_LABELS: Record<string, string> = {
  playa_ciudad:           'Playa ↔ Ciudad',
  relax_fiesta:           'Relax ↔ Fiesta',
  lowcost_fancy:          'Lowcost ↔ Lujo',
  invierno_verano:        'Invierno ↔ Verano',
  occidental_exotico:     'Occidental ↔ Exótico',
  streetfood_gourmet:     'Street food ↔ Gourmet',
  descanso_aventura:      'Descanso ↔ Aventura',
  solo_grupal:            'Solo ↔ Grupal',
  naturaleza_metropolis:  'Naturaleza ↔ Metrópolis',
  moderno_historico:      'Moderno ↔ Histórico',
  turistico_desconocido:  'Turístico ↔ Desconocido',
}

export interface ScaleDimDetail {
  key: string
  label: string
  userVal: number
  destVal: number
  intensity: number
  weight: number
  diff: number
  dimScore: number
  contribution: number
  isNN: boolean
  skipped: boolean
}

export function calcScaleMatchDetail(answers: TripAnswers, dest: Destination): {
  pct: number
  dims: ScaleDimDetail[]
} {
  const s = dest.scales ?? {}
  const nn = new Set(answers.noNegociable ?? [])
  let total = 0
  let totalWeight = 0
  const dims: ScaleDimDetail[] = []

  for (const key of SCALE_KEYS) {
    const dVal = (s[key] ?? 5) as number
    const uVal = answers[key as keyof TripAnswers] as number
    const intensity = Math.abs(uVal - 5)
    const weight = intensity / 4
    const diff = Math.abs(uVal - dVal)
    const skipped = intensity === 0
    const isNN = nn.has(key)
    const dimScore = skipped ? 0 : isNN
      ? (diff <= 1 ? 1.0 : 0.0)
      : 1 - diff / 10
    const contribution = skipped ? 0 : dimScore * weight

    dims.push({ key, label: SCALE_LABELS[key], userVal: uVal, destVal: dVal,
      intensity, weight, diff, dimScore, contribution, isNN, skipped })

    if (!skipped) {
      total += contribution
      totalWeight += weight
    }
  }

  const pct = totalWeight > 0 ? total / totalWeight : 0.65
  return { pct, dims }
}

export function calcScaleMatch(answers: TripAnswers, dest: Destination): number {
  const s = dest.scales ?? {}
  const nn = new Set(answers.noNegociable ?? [])

  // Si cualquier dimensión no negociable falla → 0 automático (zona warning)
  for (const key of SCALE_KEYS) {
    if (!nn.has(key)) continue
    const dVal = (s[key] ?? 5) as number
    const uVal = answers[key as keyof TripAnswers] as number
    if (Math.abs(uVal - dVal) > 1) return 0
  }

  let total = 0
  let totalWeight = 0

  for (const key of SCALE_KEYS) {
    const dVal = (s[key] ?? 5) as number
    const uVal = answers[key as keyof TripAnswers] as number
    const intensity = Math.abs(uVal - 5)
    if (intensity === 0) continue

    const weight = intensity / 4
    const diff   = Math.abs(uVal - dVal)
    const dimScore = nn.has(key)
      ? (diff <= 1 ? 1.0 : 0.0)
      : 1 - diff / 10
    total       += dimScore * weight
    totalWeight += weight
  }

  return totalWeight > 0 ? total / totalWeight : 0.65
}

export function getNNFailures(answers: TripAnswers, dest: Destination): string[] {
  const s = dest.scales ?? {}
  const nn = new Set(answers.noNegociable ?? [])
  const failed: string[] = []
  for (const key of SCALE_KEYS) {
    if (!nn.has(key)) continue
    const dVal = (s[key] ?? 5) as number
    const uVal = answers[key as keyof TripAnswers] as number
    if (Math.abs(uVal - dVal) > 1) failed.push(key)
  }
  return failed
}

export function getScaleCategory(pct: number): DestinationCategory {
  if (pct >= 0.80) return 'perfect'
  if (pct >= 0.60) return 'good'
  if (pct >= 0.40) return 'ok'
  return 'warning'
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
  // musts nuevos
  gastronomy:  ['gastronomía', 'vino', 'restaurante', 'cocina', 'marisco', 'mercado gastro', 'bodega', 'maridaje', 'degustación'],
  art:         ['arte', 'museo', 'galería', 'pintura', 'escultura', 'bellas artes', 'contemporáneo'],
  watersports: ['surf', 'vela', 'kayak', 'windsurf', 'paddle', 'deportes acuáticos', 'kitesurf'],
  photography: ['paisaje', 'panorámica', 'mirador', 'atardecer', 'amanecer', 'fotografía', 'vista espectacular'],
  shopping:    ['mercado', 'compras', 'tiendas', 'artesanía', 'bazar', 'souvenirs', 'Grand Bazaar'],
  wellness:    ['spa', 'termas', 'aguas termales', 'balneario', 'bienestar', 'hammam', 'baño turco'],
  // ritmo
  relaxed:     ['tranquil', 'calma', 'descanso', 'pausado', 'slow', 'silencio', 'relajar'],
  intense:     ['actividades', 'museos', 'rutas', 'excursión', 'visitar', 'imprescindible', 'agenda'],
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
  const days = answers.days || 7
  const budgetMax = answers.budget || 9999

  return destinations.map(dest => {
    let score = 0
    const reasons: string[] = []

    // 1. Afinidad por escalas — determinante principal (0-40)
    const scalePct = calcScaleMatch(answers, dest)
    score += Math.round(scalePct * 40)
    if (scalePct >= 0.80) reasons.push('Perfil ideal para vosotros')
    else if (scalePct >= 0.65) reasons.push('Buena afinidad general')
    else if (scalePct < 0.40) score -= 10

    // 2. Región geográfica (±25) — filtro fuerte
    if (answers.region && answers.region !== 'any') {
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

    // 3. Multitudes (±15)
    if (answers.crowds === 'hate') {
      if (dest.category === 'warning') { score -= 15; reasons.push('Muy masificado') }
      if (dest.category === 'perfect') { score += 8;  reasons.push('Buen nivel de tranquilidad') }
    } else if (answers.crowds === 'ok') {
      if (dest.category === 'warning') score -= 6
    }

    // 5. Presupuesto (±15) — compara precio estimado contra máximo del usuario
    const budgetResult = calcBudget(dest, days, 'medio', true)
    const ppTotal = budgetResult.totalMid
    if (ppTotal <= budgetMax) {
      score += 15
      reasons.push(`Encaja en presupuesto (~€${Math.round(ppTotal)}pp)`)
    } else if (ppTotal <= budgetMax * 1.25) {
      score += 4  // ligeramente por encima — no penalizar fuerte
    } else {
      score -= 10
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

    // 8. Temporada — cruza mes real con preferencia estacional del destino (±8)
    const destSeason = dest.scales?.invierno_verano ?? 5
    if (answers.month && answers.month !== 'any') {
      if (answers.month === 'summer'  && destSeason >= 7) { score += 6; reasons.push('Destino ideal en verano') }
      if (answers.month === 'summer'  && destSeason <= 3) { score -= 8 }
      if (answers.month === 'winter'  && destSeason <= 4) { score += 5; reasons.push('Funciona bien en invierno') }
      if (answers.month === 'winter'  && destSeason >= 8) { score -= 6 }
      if (answers.month === 'spring'  && destSeason >= 5) { score += 4; reasons.push('Primavera perfecta') }
      if (answers.month === 'autumn'  && destSeason >= 5 && destSeason <= 8) { score += 4; reasons.push('Excelente en otoño') }
    }

    score = Math.max(0, Math.min(100, score))

    return { dest, score, reasons: [...new Set(reasons)] }
  })
    .sort((a, b) => b.score - a.score)
}

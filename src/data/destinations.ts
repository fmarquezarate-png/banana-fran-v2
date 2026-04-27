// Catálogo estático de destinos — datos de v1
// NO modificar sin revisar HANDOFF.md primero

export interface Destination {
  id: string
  name: string
  country: string
  region: string
  description: string
  coverImage: string
  tags: string[]
  lat: number
  lng: number
  budgetRange: {
    min: number
    max: number
    currency: string
  }
  bestMonths: number[] // 1-12
  matchScore?: number // calculado en v1 según preferencias
}

// Placeholder con estructura — los 30 destinos se migrarán en Tarea 4
export const destinations: Destination[] = [
  {
    id: 'grecia-santorini',
    name: 'Santorini',
    country: 'Grecia',
    region: 'Islas del Egeo',
    description: 'La isla más icónica de Grecia, con sus casas blancas y cúpulas azules sobre el caldera.',
    coverImage: '',
    tags: ['playa', 'romántico', 'gastronomía', 'fotografía'],
    lat: 36.3932,
    lng: 25.4615,
    budgetRange: { min: 1200, max: 2500, currency: 'EUR' },
    bestMonths: [5, 6, 9, 10],
    matchScore: 95,
  },
  {
    id: 'croacia-dubrovnik',
    name: 'Dubrovnik',
    country: 'Croacia',
    region: 'Dalmacia',
    description: 'La perla del Adriático, ciudad amurallada con historia medieval y mar cristalino.',
    coverImage: '',
    tags: ['historia', 'playa', 'casco antiguo', 'Game of Thrones'],
    lat: 42.6507,
    lng: 18.0944,
    budgetRange: { min: 900, max: 1800, currency: 'EUR' },
    bestMonths: [5, 6, 9, 10],
    matchScore: 88,
  },
  {
    id: 'portugal-alentejo',
    name: 'Alentejo',
    country: 'Portugal',
    region: 'Alentejo',
    description: 'Paisajes de cork oaks, vino y gastronomía auténtica en el corazón de Portugal.',
    coverImage: '',
    tags: ['naturaleza', 'vino', 'slow travel', 'gastronomía'],
    lat: 38.5667,
    lng: -7.9000,
    budgetRange: { min: 600, max: 1200, currency: 'EUR' },
    bestMonths: [3, 4, 5, 9, 10, 11],
    matchScore: 82,
  },
]

// TODO (Tarea 4): migrar los 30 destinos completos del HTML v1

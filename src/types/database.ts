// Tipos que mapean las tablas del schema.sql
// Actualizar si se modifica supabase/schema.sql

export type TripStatus = 'planning' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled'

export type PlaceCategory =
  | 'restaurant'
  | 'bar'
  | 'beach'
  | 'museum'
  | 'cultural_site'
  | 'activity'
  | 'viewpoint'
  | 'nature'
  | 'shopping'
  | 'accommodation'
  | 'other'

export type DocType = 'flight' | 'hotel' | 'activity' | 'transfer' | 'insurance' | 'visa' | 'other'

export type QuotationCategory =
  | 'flights'
  | 'accommodation'
  | 'transport'
  | 'food'
  | 'activities'
  | 'other'

export type Mood = 'amazing' | 'good' | 'okay' | 'bad' | 'terrible'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface DestinationUser {
  id: string
  user_id: string
  destination_id: string
  rating: number | null
  match_score: number | null
  notes: string | null
  wish_to_visit: boolean
  visited: boolean
  created_at: string
  updated_at: string
}

export interface DestinationQuotation {
  id: string
  user_id: string
  destination_id: string
  category: QuotationCategory
  amount: number
  currency: string
  notes: string | null
  source_url: string | null
  valid_until: string | null
  created_at: string
  updated_at: string
}

export interface Trip {
  id: string
  user_id: string
  name: string
  description: string | null
  destination_slug: string | null
  start_date: string | null
  end_date: string | null
  travelers: number
  status_override: TripStatus | null
  cover_photo_url: string | null
  is_past: boolean
  quiz_answers: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface TripDestination {
  id: string
  trip_id: string
  destination_id: string
  order_index: number
  arrival_date: string | null
  departure_date: string | null
  created_at: string
}

export interface TripDocument {
  id: string
  trip_id: string
  user_id: string
  name: string
  doc_type: DocType
  file_path: string
  file_size: number | null
  mime_type: string | null
  notes: string | null
  created_at: string
}

export interface TripPlace {
  id: string
  trip_id: string
  user_id: string
  name: string
  category: PlaceCategory
  tags: string[]
  address: string | null
  lat: number | null
  lng: number | null
  rating: number | null
  review: string | null
  price_range: number | null
  visited: boolean
  visited_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface TripPhoto {
  id: string
  trip_id: string
  user_id: string
  place_id: string | null
  file_path: string
  file_size: number | null
  caption: string | null
  taken_at: string | null
  order_index: number
  created_at: string
}

export interface TripJournal {
  id: string
  trip_id: string
  user_id: string
  entry_date: string
  title: string | null
  content: string
  mood: Mood | null
  created_at: string
  updated_at: string
}

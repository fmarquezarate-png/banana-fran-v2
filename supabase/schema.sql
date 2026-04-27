-- ============================================================
-- BANANA & FRAN v2 — Schema PostgreSQL para Supabase
-- ============================================================

-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLA: profiles
-- Perfil del usuario (vinculado a auth.users de Supabase)
-- ============================================================
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TABLA: destinations_user
-- Ratings y preferencias del catálogo de destinos (datos estáticos)
-- ============================================================
CREATE TABLE destinations_user (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  destination_id TEXT NOT NULL, -- slug del destino estático
  rating         INTEGER CHECK (rating >= 1 AND rating <= 5),
  match_score    INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  notes          TEXT,
  wish_to_visit  BOOLEAN DEFAULT FALSE,
  visited        BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, destination_id)
);

-- ============================================================
-- TABLA: destination_quotations
-- Cotizaciones de presupuesto por destino del catálogo
-- ============================================================
CREATE TABLE destination_quotations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  destination_id TEXT NOT NULL, -- slug del destino estático
  category       TEXT NOT NULL CHECK (category IN ('flights', 'accommodation', 'transport', 'food', 'activities', 'other')),
  amount         DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  currency       TEXT DEFAULT 'EUR' NOT NULL,
  notes          TEXT,
  source_url     TEXT,
  valid_until    DATE,
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TABLA: trips
-- Viajes planificados o realizados
-- ============================================================
CREATE TABLE trips (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  destination_slug TEXT, -- destino principal (slug estático)
  start_date       DATE,
  end_date         DATE,
  -- estado auto-calculado: planning → upcoming → ongoing → completed
  -- el override permite forzar un estado manualmente
  status_override  TEXT CHECK (status_override IN ('planning', 'upcoming', 'ongoing', 'completed', 'cancelled')),
  cover_photo_url  TEXT,
  is_past          BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Vista calculada del estado del viaje
CREATE OR REPLACE FUNCTION trip_status(trip trips) RETURNS TEXT AS $$
BEGIN
  IF trip.status_override IS NOT NULL THEN
    RETURN trip.status_override;
  END IF;
  IF trip.start_date IS NULL THEN
    RETURN 'planning';
  END IF;
  IF NOW()::DATE < trip.start_date THEN
    RETURN 'upcoming';
  END IF;
  IF trip.end_date IS NULL OR NOW()::DATE <= trip.end_date THEN
    RETURN 'ongoing';
  END IF;
  RETURN 'completed';
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- TABLA: trip_destinations
-- Destinos visitados dentro de un viaje (multi-destino)
-- ============================================================
CREATE TABLE trip_destinations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id        UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  destination_id TEXT NOT NULL, -- slug del destino estático
  order_index    INTEGER DEFAULT 0 NOT NULL,
  arrival_date   DATE,
  departure_date DATE,
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TABLA: trip_documents
-- PDFs y archivos de viaje (tickets, reservas, seguros)
-- ============================================================
CREATE TABLE trip_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  doc_type    TEXT NOT NULL CHECK (doc_type IN ('flight', 'hotel', 'activity', 'transfer', 'insurance', 'visa', 'other')),
  file_path   TEXT NOT NULL, -- path en Supabase Storage bucket "documents"
  file_size   INTEGER,       -- bytes
  mime_type   TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TABLA: trip_places
-- Lugares específicos visitados o por visitar en el viaje
-- ============================================================
CREATE TABLE trip_places (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id      UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  category     TEXT NOT NULL CHECK (category IN (
                  'restaurant', 'bar', 'beach', 'museum', 'cultural_site',
                  'activity', 'viewpoint', 'nature', 'shopping', 'accommodation', 'other'
                )),
  tags         TEXT[] DEFAULT '{}',
  address      TEXT,
  lat          DECIMAL(10,8),
  lng          DECIMAL(11,8),
  -- Reseña post-visita
  rating       INTEGER CHECK (rating >= 1 AND rating <= 5),
  review       TEXT,
  price_range  INTEGER CHECK (price_range >= 1 AND price_range <= 4), -- € / €€ / €€€ / €€€€
  -- Estado de visita
  visited      BOOLEAN DEFAULT FALSE,
  visited_date DATE,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TABLA: trip_photos
-- Fotos del viaje (pueden estar asociadas a un place o no)
-- ============================================================
CREATE TABLE trip_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id     UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  place_id    UUID REFERENCES trip_places(id) ON DELETE SET NULL,
  file_path   TEXT NOT NULL, -- path en Supabase Storage bucket "photos"
  file_size   INTEGER,       -- bytes
  caption     TEXT,
  taken_at    TIMESTAMPTZ,   -- fecha real de la foto (EXIF si disponible)
  order_index INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TABLA: trip_journal
-- Diario del viaje — 0, 1 o N entradas por día
-- ============================================================
CREATE TABLE trip_journal (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id    UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  title      TEXT,
  content    TEXT NOT NULL,
  mood       TEXT CHECK (mood IN ('amazing', 'good', 'okay', 'bad', 'terrible')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Cada usuario solo ve y edita sus propios datos
-- ============================================================

ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations_user   ENABLE ROW LEVEL SECURITY;
ALTER TABLE destination_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips                ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_destinations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_documents       ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_places          ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_photos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_journal         ENABLE ROW LEVEL SECURITY;

-- Policies: profiles
CREATE POLICY "Users can view own profile"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies: destinations_user
CREATE POLICY "Users can manage own destination ratings"
  ON destinations_user FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies: destination_quotations
CREATE POLICY "Users can manage own quotations"
  ON destination_quotations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies: trips
CREATE POLICY "Users can manage own trips"
  ON trips FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies: trip_destinations
CREATE POLICY "Users can manage own trip destinations"
  ON trip_destinations FOR ALL
  USING (EXISTS (SELECT 1 FROM trips WHERE trips.id = trip_id AND trips.user_id = auth.uid()));

-- Policies: trip_documents
CREATE POLICY "Users can manage own trip documents"
  ON trip_documents FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies: trip_places
CREATE POLICY "Users can manage own trip places"
  ON trip_places FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies: trip_photos
CREATE POLICY "Users can manage own trip photos"
  ON trip_photos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies: trip_journal
CREATE POLICY "Users can manage own journal entries"
  ON trip_journal FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON destinations_user
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON destination_quotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON trip_places
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON trip_journal
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- FUNCIÓN: crear perfil automáticamente al registrarse
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- STORAGE BUCKETS (ejecutar desde Supabase Dashboard o API)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', false);

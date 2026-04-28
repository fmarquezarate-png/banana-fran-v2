-- ============================================================
-- 005 — Storage buckets: photos (public) + documents (private)
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Crear bucket de fotos (público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos', 'photos', true,
  10485760,  -- 10 MB
  ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Crear bucket de documentos (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 'documents', false,
  20971520,  -- 20 MB
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
)
ON CONFLICT (id) DO UPDATE SET public = false;

-- ── Policies: photos ──────────────────────────────────────────

DROP POLICY IF EXISTS "photos_insert" ON storage.objects;
DROP POLICY IF EXISTS "photos_select" ON storage.objects;
DROP POLICY IF EXISTS "photos_delete" ON storage.objects;

CREATE POLICY "photos_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'photos'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "photos_select" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'photos');

CREATE POLICY "photos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'photos'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- ── Policies: documents ───────────────────────────────────────

DROP POLICY IF EXISTS "documents_insert" ON storage.objects;
DROP POLICY IF EXISTS "documents_select" ON storage.objects;
DROP POLICY IF EXISTS "documents_delete" ON storage.objects;

CREATE POLICY "documents_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "documents_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "documents_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Migration 001: Add travelers count to trips + set up storage buckets
-- Run this in the Supabase Dashboard → SQL Editor

-- 1. Add travelers column to trips
ALTER TABLE trips ADD COLUMN IF NOT EXISTS travelers INTEGER DEFAULT 2 NOT NULL;

-- 2. Create storage buckets (if they don't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', false)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS policies for documents bucket
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

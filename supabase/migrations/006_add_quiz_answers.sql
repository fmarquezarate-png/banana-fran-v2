-- Migration 006: add quiz_answers column to trips
-- Safe to run multiple times (IF NOT EXISTS).
-- If using a fresh DB from schema.sql, this column already exists — this is a no-op.
ALTER TABLE trips ADD COLUMN IF NOT EXISTS quiz_answers JSONB DEFAULT NULL;

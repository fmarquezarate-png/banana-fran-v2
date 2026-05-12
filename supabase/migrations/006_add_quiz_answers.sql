-- Add quiz_answers column to trips table
-- Stores the TripAnswers object (quiz responses) associated with each trip
ALTER TABLE trips ADD COLUMN IF NOT EXISTS quiz_answers jsonb DEFAULT NULL;

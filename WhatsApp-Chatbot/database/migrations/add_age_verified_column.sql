-- Migration: Add age_verified column to sessions table
-- This stores age verification status as a dedicated column for better querying

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS age_verified BOOLEAN DEFAULT FALSE;

-- Create index for potential analytics queries
CREATE INDEX IF NOT EXISTS idx_sessions_age_verified ON sessions(age_verified);

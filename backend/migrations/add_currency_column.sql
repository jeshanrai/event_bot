-- Add currency column to restaurants table for Settings feature
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'AUD';

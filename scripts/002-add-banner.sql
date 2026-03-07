-- Add banner_url column to artists table
ALTER TABLE artists ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Update durations for existing tracks
UPDATE tracks SET duration = NULL WHERE duration IS NOT NULL; -- Reset to test

-- This script would need to be run in Node.js to extract durations
-- For now, we'll create a migration script
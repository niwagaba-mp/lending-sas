-- Migration: Add client profile change history column
ALTER TABLE clients ADD COLUMN IF NOT EXISTS profile_history JSONB DEFAULT '[]'::jsonb;

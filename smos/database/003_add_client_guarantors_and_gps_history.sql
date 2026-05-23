-- Migration: Add GPS history and client guarantors table

-- 1. Add gps_history column to clients table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'clients' AND column_name = 'gps_history'
    ) THEN
        ALTER TABLE clients ADD COLUMN gps_history JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 2. Create client_guarantors table
CREATE TABLE IF NOT EXISTS client_guarantors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  relationship VARCHAR(100),
  national_id VARCHAR(50),
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create index for client_id on client_guarantors
CREATE INDEX IF NOT EXISTS idx_client_guarantors_client ON client_guarantors(client_id);

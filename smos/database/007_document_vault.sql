-- ============================================================
-- SYSTEM DOCUMENTS & DOCUMENT VAULT TABLE (IDEMPOTENT)
-- ============================================================

CREATE TABLE IF NOT EXISTS system_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'business', 'client', 'staff', 'loan'
  subcategory VARCHAR(100), -- 'onboarding_verification', 'sla_agreement', etc.
  entity_id UUID, -- client_id, staff_id, or tenant_id
  entity_name VARCHAR(255),
  file_type VARCHAR(100),
  file_size INTEGER,
  file_data TEXT, -- Base64 encoded file data
  notes TEXT,
  uploaded_by VARCHAR(255),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_documents_tenant ON system_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_system_documents_entity ON system_documents(entity_id);

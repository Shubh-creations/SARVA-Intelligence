-- Migration 001: Production Row-Level Security (RLS) Multi-Tenant Hardening
-- Enforces app.current_tenant_id isolation at PostgreSQL engine level.

BEGIN;

-- Enable RLS across all sensitive multi-tenant tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE kg_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE kg_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox_events ENABLE ROW LEVEL SECURITY;

-- Helper Function to resolve session tenant context
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
DECLARE
    v_tenant_id TEXT;
BEGIN
    v_tenant_id := current_setting('app.current_tenant_id', true);
    IF v_tenant_id IS NULL OR v_tenant_id = '' THEN
        RETURN NULL;
    END IF;
    RETURN v_tenant_id::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

-- RLS Isolation Policies
CREATE POLICY tenant_isolation_users ON users 
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_bank_accounts ON bank_accounts 
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_vendors ON vendors 
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_customers ON customers 
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_transactions ON transactions 
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_invoices ON invoices 
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_bills ON bills 
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_documents ON documents 
    FOR ALL USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_embeddings ON embeddings 
    FOR ALL USING (tenant_id = current_tenant_id());

COMMIT;

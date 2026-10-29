-- V2: Add payment_status to invoices table
ALTER TABLE invoices ADD COLUMN payment_status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED';

CREATE INDEX idx_invoices_tenant_payment_status ON invoices(tenant_id, payment_status);


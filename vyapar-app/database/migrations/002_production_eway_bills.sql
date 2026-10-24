-- ==============================================================================
-- Migration: 002_production_eway_bills.sql
-- Description: Production-Grade GST e-Way Bill Integration Schema
-- Expands eway_bills table with official NIC fields & creates business_eway_configs
-- ==============================================================================

-- 1. Create or Expand business_eway_configs table (Encrypted GSP/NIC Credentials per Tenant)
CREATE TABLE IF NOT EXISTS business_eway_configs (
    id VARCHAR(100) NOT NULL,
    business_id VARCHAR(100) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL DEFAULT 'sandbox', -- 'sandbox' | 'gsp_gateway' | 'nic_direct'
    environment VARCHAR(20) NOT NULL DEFAULT 'sandbox', -- 'sandbox' | 'production'
    gstin VARCHAR(20),
    encrypted_username TEXT,
    encrypted_password TEXT,
    encrypted_client_id TEXT,
    encrypted_client_secret TEXT,
    gsp_base_url VARCHAR(255),
    auth_token TEXT,
    token_expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (business_id, id),
    CONSTRAINT uq_biz_eway_config UNIQUE (business_id)
);

CREATE INDEX IF NOT EXISTS idx_eway_config_biz ON business_eway_configs(business_id);

-- 2. Add Missing Official NIC Fields to eway_bills Table
DO $$
BEGIN
    -- Document classification
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='doc_type') THEN
        ALTER TABLE eway_bills ADD COLUMN doc_type VARCHAR(10) DEFAULT 'INV';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='doc_no') THEN
        ALTER TABLE eway_bills ADD COLUMN doc_no VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='doc_date') THEN
        ALTER TABLE eway_bills ADD COLUMN doc_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='supply_type') THEN
        ALTER TABLE eway_bills ADD COLUMN supply_type VARCHAR(5) DEFAULT 'O';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='sub_supply_type') THEN
        ALTER TABLE eway_bills ADD COLUMN sub_supply_type VARCHAR(5) DEFAULT '1';
    END IF;

    -- Consignor (FROM) details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='from_gstin') THEN
        ALTER TABLE eway_bills ADD COLUMN from_gstin VARCHAR(20);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='from_trade_name') THEN
        ALTER TABLE eway_bills ADD COLUMN from_trade_name VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='from_address1') THEN
        ALTER TABLE eway_bills ADD COLUMN from_address1 TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='from_place') THEN
        ALTER TABLE eway_bills ADD COLUMN from_place VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='from_pincode') THEN
        ALTER TABLE eway_bills ADD COLUMN from_pincode VARCHAR(10);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='from_state_code') THEN
        ALTER TABLE eway_bills ADD COLUMN from_state_code INT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='act_from_state_code') THEN
        ALTER TABLE eway_bills ADD COLUMN act_from_state_code INT;
    END IF;

    -- Consignee (TO) details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='to_gstin') THEN
        ALTER TABLE eway_bills ADD COLUMN to_gstin VARCHAR(20);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='to_trade_name') THEN
        ALTER TABLE eway_bills ADD COLUMN to_trade_name VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='to_address1') THEN
        ALTER TABLE eway_bills ADD COLUMN to_address1 TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='to_place') THEN
        ALTER TABLE eway_bills ADD COLUMN to_place VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='to_pincode') THEN
        ALTER TABLE eway_bills ADD COLUMN to_pincode VARCHAR(10);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='to_state_code') THEN
        ALTER TABLE eway_bills ADD COLUMN to_state_code INT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='act_to_state_code') THEN
        ALTER TABLE eway_bills ADD COLUMN act_to_state_code INT;
    END IF;

    -- Tax breakdown & values
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='total_taxable_amount') THEN
        ALTER TABLE eway_bills ADD COLUMN total_taxable_amount NUMERIC(14,2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='cgst_amount') THEN
        ALTER TABLE eway_bills ADD COLUMN cgst_amount NUMERIC(14,2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='sgst_amount') THEN
        ALTER TABLE eway_bills ADD COLUMN sgst_amount NUMERIC(14,2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='igst_amount') THEN
        ALTER TABLE eway_bills ADD COLUMN igst_amount NUMERIC(14,2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='cess_amount') THEN
        ALTER TABLE eway_bills ADD COLUMN cess_amount NUMERIC(14,2) DEFAULT 0.00;
    END IF;

    -- Transport Part B details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='transporter_id') THEN
        ALTER TABLE eway_bills ADD COLUMN transporter_id VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='transport_mode') THEN
        ALTER TABLE eway_bills ADD COLUMN transport_mode VARCHAR(20) DEFAULT '1';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='transport_doc_no') THEN
        ALTER TABLE eway_bills ADD COLUMN transport_doc_no VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='transport_doc_date') THEN
        ALTER TABLE eway_bills ADD COLUMN transport_doc_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='vehicle_type') THEN
        ALTER TABLE eway_bills ADD COLUMN vehicle_type VARCHAR(10) DEFAULT 'R';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='distance_km') THEN
        ALTER TABLE eway_bills ADD COLUMN distance_km INT DEFAULT 20;
    END IF;

    -- Extended metadata, JSON history, errors, cancellation & idempotency
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='items_json') THEN
        ALTER TABLE eway_bills ADD COLUMN items_json JSONB DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='vehicle_update_history') THEN
        ALTER TABLE eway_bills ADD COLUMN vehicle_update_history JSONB DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='nic_response') THEN
        ALTER TABLE eway_bills ADD COLUMN nic_response JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='nic_error_code') THEN
        ALTER TABLE eway_bills ADD COLUMN nic_error_code VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='nic_error_message') THEN
        ALTER TABLE eway_bills ADD COLUMN nic_error_message TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='cancel_reason_code') THEN
        ALTER TABLE eway_bills ADD COLUMN cancel_reason_code INT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='cancel_remarks') THEN
        ALTER TABLE eway_bills ADD COLUMN cancel_remarks TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='cancel_date') THEN
        ALTER TABLE eway_bills ADD COLUMN cancel_date TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='idempotency_key') THEN
        ALTER TABLE eway_bills ADD COLUMN idempotency_key VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='qr_code_data') THEN
        ALTER TABLE eway_bills ADD COLUMN qr_code_data TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='eway_bills' AND column_name='updated_at') THEN
        ALTER TABLE eway_bills ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 3. Create Supporting Performance & Idempotency Indexes
CREATE INDEX IF NOT EXISTS idx_eway_idempotency ON eway_bills(business_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_eway_inv_num ON eway_bills(business_id, invoice_number);
CREATE INDEX IF NOT EXISTS idx_eway_status ON eway_bills(business_id, status);
CREATE INDEX IF NOT EXISTS idx_eway_created ON eway_bills(business_id, created_at DESC);

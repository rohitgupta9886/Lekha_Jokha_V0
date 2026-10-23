-- ==============================================================================
-- Vyapar Pro - Enterprise Multi-Business SaaS PostgreSQL / Supabase Schema
-- Architecture: 1 Subscriber Account Managing Up to 5 Isolated Businesses
-- Scalable to 10+ Lakh Subscribers, 50 Lakh Businesses & 100M+ Annual Invoices
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ==============================================================================
-- 1. SUBSCRIBERS (SaaS User Accounts & Plan Entitlements)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    plan_tier VARCHAR(50) NOT NULL DEFAULT 'Free', -- 'Free' (1 biz), 'Pro' (2 biz), 'Max' (5 biz)
    max_businesses INT NOT NULL DEFAULT 1,
    plan_activated_at TIMESTAMPTZ DEFAULT NOW(),
    plan_expires_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscribers_email ON subscribers(email);
CREATE INDEX idx_subscribers_phone ON subscribers(phone);

-- ==============================================================================
-- 2. BUSINESSES (Up to 5 Isolated Business Entities Per Subscriber)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscriber_id UUID NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    tagline VARCHAR(255),
    gstin VARCHAR(15),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10),
    bank_name VARCHAR(150),
    account_number VARCHAR(50),
    ifsc VARCHAR(20),
    upi_id VARCHAR(100),
    terms TEXT,
    status VARCHAR(50) DEFAULT 'Active', -- 'Active', 'Deactivated'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_businesses_subscriber ON businesses(subscriber_id);
CREATE INDEX idx_businesses_gstin ON businesses(gstin);

-- Function and trigger to enforce max businesses per subscriber on database level
CREATE OR REPLACE FUNCTION check_subscriber_business_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INT;
    allowed_limit INT;
BEGIN
    SELECT max_businesses INTO allowed_limit FROM subscribers WHERE id = NEW.subscriber_id;
    SELECT COUNT(*) INTO current_count FROM businesses WHERE subscriber_id = NEW.subscriber_id AND status = 'Active';
    
    IF current_count >= allowed_limit THEN
        RAISE EXCEPTION 'PLAN_LIMIT_REACHED: Subscriber has reached the maximum allowed businesses (%) for their subscription tier.', allowed_limit;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_business_limit
BEFORE INSERT ON businesses
FOR EACH ROW
EXECUTE FUNCTION check_subscriber_business_limit();

-- ==============================================================================
-- 3. USERS (Business Staff, Cashiers, Accountants & RBAC)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL DEFAULT 'Biller', -- 'Admin', 'Accountant', 'Biller', 'Sales'
    pin_hash VARCHAR(255) NOT NULL,
    permissions JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_business ON users(business_id);

-- ==============================================================================
-- 4. PARTIES (Customers & Suppliers / Vendors - Isolated per Business)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'Customer', -- 'Customer' or 'Supplier'
    phone VARCHAR(20),
    gstin VARCHAR(15),
    address TEXT,
    state VARCHAR(100),
    current_balance NUMERIC(14, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_parties_business_type ON parties(business_id, type);
CREATE INDEX idx_parties_name_trgm ON parties USING gin (name gin_trgm_ops);

-- ==============================================================================
-- 5. ITEMS & INVENTORY (Products & Services - Isolated per Business)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    barcode VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    hsn VARCHAR(20),
    unit VARCHAR(20) DEFAULT 'PCS',
    sale_price NUMERIC(12, 2) NOT NULL,
    purchase_price NUMERIC(12, 2) DEFAULT 0.00,
    gst_rate NUMERIC(5, 2) DEFAULT 0.00,
    current_stock NUMERIC(12, 3) DEFAULT 0.000,
    min_stock_alert NUMERIC(12, 3) DEFAULT 5.000,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_business_barcode UNIQUE (business_id, barcode)
);

CREATE INDEX idx_items_business_barcode ON items(business_id, barcode);
CREATE INDEX idx_items_name_trgm ON items USING gin (name gin_trgm_ops);

-- ==============================================================================
-- 6. SALES & INVOICES (Tax Invoices, Quotations, Returns - Partitioned Ready)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL,
    doc_type VARCHAR(50) DEFAULT 'Invoice', -- 'Invoice', 'Estimate', 'SalesReturn', 'DeliveryChallan'
    invoice_date DATE NOT NULL,
    party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
    party_name VARCHAR(255) NOT NULL,
    place_of_supply VARCHAR(100) NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'Credit',
    subtotal NUMERIC(14, 2) NOT NULL,
    tax_amount NUMERIC(14, 2) NOT NULL,
    grand_total NUMERIC(14, 2) NOT NULL,
    paid_amount NUMERIC(14, 2) DEFAULT 0.00,
    balance_due NUMERIC(14, 2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'Unpaid',
    eway_bill_number VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_business_invoice_number UNIQUE (business_id, invoice_number)
);

CREATE INDEX idx_sales_business_date ON sales(business_id, invoice_date DESC);
CREATE INDEX idx_sales_business_party ON sales(business_id, party_id);

-- Sales Line Items Table
CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    hsn VARCHAR(20),
    quantity NUMERIC(12, 3) NOT NULL,
    rate NUMERIC(12, 2) NOT NULL,
    gst_rate NUMERIC(5, 2) NOT NULL,
    tax_amount NUMERIC(12, 2) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL
);

CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);

-- ==============================================================================
-- 7. PURCHASES & EXPENSES (Stock In & Outflows)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    bill_number VARCHAR(100) NOT NULL,
    doc_type VARCHAR(50) DEFAULT 'Bill', -- 'Bill', 'PurchaseOrder', 'PurchaseReturn'
    bill_date DATE NOT NULL,
    party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
    party_name VARCHAR(255) NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'Bank',
    subtotal NUMERIC(14, 2) NOT NULL,
    tax_amount NUMERIC(14, 2) DEFAULT 0.00,
    grand_total NUMERIC(14, 2) NOT NULL,
    paid_amount NUMERIC(14, 2) DEFAULT 0.00,
    balance_due NUMERIC(14, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_business_bill_number UNIQUE (business_id, bill_number)
);

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    expense_date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'Cash',
    reference_number VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_business_date ON expenses(business_id, expense_date DESC);

-- ==============================================================================
-- 8. e-WAY BILLS (GST Compliance)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS eway_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    eway_number VARCHAR(20) NOT NULL UNIQUE,
    eway_date TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    invoice_number VARCHAR(100),
    party_name VARCHAR(255) NOT NULL,
    party_gstin VARCHAR(15),
    vehicle_number VARCHAR(50),
    transporter_name VARCHAR(150),
    total_value NUMERIC(14, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_eway_business ON eway_bills(business_id, eway_number);

-- ==============================================================================
-- 9. AUDIT LOGS (Security & RBAC Trail)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID,
    user_name VARCHAR(150) NOT NULL,
    action VARCHAR(150) NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_business ON audit_logs(business_id, created_at DESC);

-- ==============================================================================
-- 10. ROW-LEVEL SECURITY (RLS) FOR STRICT DATA ISOLATION
-- ==============================================================================
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE eway_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Dynamic Tenant Context Policy: app.current_business_id
CREATE POLICY rls_parties_isolation ON parties
    USING (business_id = (current_setting('app.current_business_id', true))::UUID);

CREATE POLICY rls_items_isolation ON items
    USING (business_id = (current_setting('app.current_business_id', true))::UUID);

CREATE POLICY rls_sales_isolation ON sales
    USING (business_id = (current_setting('app.current_business_id', true))::UUID);

CREATE POLICY rls_purchases_isolation ON purchases
    USING (business_id = (current_setting('app.current_business_id', true))::UUID);

CREATE POLICY rls_expenses_isolation ON expenses
    USING (business_id = (current_setting('app.current_business_id', true))::UUID);

CREATE POLICY rls_eway_isolation ON eway_bills
    USING (business_id = (current_setting('app.current_business_id', true))::UUID);

CREATE POLICY rls_audit_isolation ON audit_logs
    USING (business_id = (current_setting('app.current_business_id', true))::UUID);

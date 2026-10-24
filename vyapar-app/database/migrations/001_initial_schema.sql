-- ==============================================================================
-- Lekha Jokha - Production Normalized PostgreSQL Schema
-- Migration 001: Initial Complete Schema
-- Multi-Tenant Data Isolation, Financial Numeric Types & Full Business Modules
-- ==============================================================================

-- 0. Schema Migration Metadata Table
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. Subscribers (SaaS Account Owners)
CREATE TABLE IF NOT EXISTS subscribers (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(30) UNIQUE,
    plan_tier VARCHAR(50) NOT NULL DEFAULT 'Free',
    max_businesses INT NOT NULL DEFAULT 1,
    plan_activated_at DATE,
    plan_expires_at DATE,
    active_business_id VARCHAR(100),
    password_hash VARCHAR(255),
    salt VARCHAR(100),
    pin_hash VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_phone ON subscribers(phone);

-- 2. Businesses (Tenant Entities)
CREATE TABLE IF NOT EXISTS businesses (
    id VARCHAR(100) PRIMARY KEY,
    subscriber_id VARCHAR(100) NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    gstin VARCHAR(20),
    pan VARCHAR(20),
    phone VARCHAR(30),
    email VARCHAR(255),
    address TEXT,
    state VARCHAR(100),
    city VARCHAR(100),
    pincode VARCHAR(20),
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_businesses_subscriber ON businesses(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_businesses_gstin ON businesses(gstin);

-- 2b. Business Profiles (Settings, Banking, Invoice Prefixes & Terms)
CREATE TABLE IF NOT EXISTS business_profiles (
    business_id VARCHAR(100) PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    phone VARCHAR(30),
    email VARCHAR(255),
    address TEXT,
    state VARCHAR(100),
    gstin VARCHAR(20),
    pan VARCHAR(20),
    currency VARCHAR(20) DEFAULT 'INR (₹)',
    invoice_prefix VARCHAR(50) DEFAULT 'INV-2026-',
    terms_and_conditions TEXT,
    bank_name VARCHAR(150),
    account_number VARCHAR(60),
    ifsc_code VARCHAR(30),
    branch_name VARCHAR(100),
    upi_id VARCHAR(100),
    logo_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Users (Staff, Cashiers, Accountants & RBAC)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY,
    subscriber_id VARCHAR(100) REFERENCES subscribers(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(30),
    role VARCHAR(50) NOT NULL DEFAULT 'Biller',
    title VARCHAR(100),
    permissions JSONB DEFAULT '[]'::jsonb,
    password_hash VARCHAR(255),
    salt VARCHAR(100),
    pin VARCHAR(20),
    pin_hash VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_subscriber ON users(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 4. Business Memberships (Multi-Tenant User Assignments)
CREATE TABLE IF NOT EXISTS business_memberships (
    id VARCHAR(100) PRIMARY KEY,
    business_id VARCHAR(100) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'Biller',
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_membership_biz_user UNIQUE (business_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_memberships_biz ON business_memberships(business_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON business_memberships(user_id);

-- 5. Business Invitations
CREATE TABLE IF NOT EXISTS business_invitations (
    id VARCHAR(100) PRIMARY KEY,
    business_id VARCHAR(100) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    inviter_user_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
    invitee_email VARCHAR(255),
    invitee_phone VARCHAR(30),
    role VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON business_invitations(token);

-- 6. Sessions & Password Resets
CREATE TABLE IF NOT EXISTS sessions (
    token VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscriber_id VARCHAR(100) REFERENCES subscribers(id) ON DELETE CASCADE,
    business_id VARCHAR(100) REFERENCES businesses(id) ON DELETE SET NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS password_resets (
    token VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- 7. Parties (Customers & Suppliers / Vendors - Isolated per Business)
CREATE TABLE IF NOT EXISTS parties (
    id VARCHAR(100) NOT NULL,
    business_id VARCHAR(100) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'Customer', -- 'Customer' or 'Supplier'
    phone VARCHAR(30),
    email VARCHAR(255),
    gstin VARCHAR(20),
    address TEXT,
    state VARCHAR(100),
    current_balance NUMERIC(14, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (business_id, id)
);
CREATE INDEX IF NOT EXISTS idx_parties_biz_type ON parties(business_id, type);
CREATE INDEX IF NOT EXISTS idx_parties_biz_name ON parties(business_id, name);

-- 8. Items & Inventory (Products & Services - Isolated per Business)
CREATE TABLE IF NOT EXISTS items (
    id VARCHAR(100) NOT NULL,
    business_id VARCHAR(100) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    barcode VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    hsn VARCHAR(20),
    unit VARCHAR(20) DEFAULT 'PCS',
    sale_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    purchase_price NUMERIC(14, 2) DEFAULT 0.00,
    gst_rate NUMERIC(5, 2) DEFAULT 0.00,
    current_stock NUMERIC(12, 3) DEFAULT 0.000,
    min_stock_alert NUMERIC(12, 3) DEFAULT 5.000,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (business_id, id)
);
CREATE INDEX IF NOT EXISTS idx_items_biz_barcode ON items(business_id, barcode);
CREATE INDEX IF NOT EXISTS idx_items_biz_name ON items(business_id, name);

-- 9. Sales (Invoices, Estimates, Sales Returns, Delivery Challans)
CREATE TABLE IF NOT EXISTS sales (
    id VARCHAR(100) NOT NULL,
    business_id VARCHAR(100) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL,
    doc_type VARCHAR(50) DEFAULT 'Invoice', -- 'Invoice', 'Estimate', 'SalesReturn', 'DeliveryChallan'
    invoice_date DATE NOT NULL,
    party_id VARCHAR(100),
    party_name VARCHAR(255) NOT NULL,
    place_of_supply VARCHAR(100),
    payment_mode VARCHAR(50) DEFAULT 'Credit',
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(14, 2) DEFAULT 0.00,
    balance_due NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(50) DEFAULT 'Unpaid',
    eway_bill_number VARCHAR(50),
    notes TEXT,
    idempotency_key VARCHAR(255),
    items_json JSONB DEFAULT '[]'::jsonb, -- Preserves rich nested item calculation snapshots
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (business_id, id),
    CONSTRAINT uq_sales_biz_number UNIQUE (business_id, invoice_number)
);
CREATE INDEX IF NOT EXISTS idx_sales_biz_date ON sales(business_id, invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_biz_party ON sales(business_id, party_id);
CREATE INDEX IF NOT EXISTS idx_sales_idempotency ON sales(business_id, idempotency_key);

-- Line Items for Analytical & Normalized Ledger Lookups
CREATE TABLE IF NOT EXISTS sale_line_items (
    id SERIAL PRIMARY KEY,
    business_id VARCHAR(100) NOT NULL,
    sale_id VARCHAR(100) NOT NULL,
    item_id VARCHAR(100),
    item_name VARCHAR(255) NOT NULL,
    hsn VARCHAR(20),
    quantity NUMERIC(12, 3) NOT NULL DEFAULT 1.000,
    unit VARCHAR(20) DEFAULT 'PCS',
    rate NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    gst_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    FOREIGN KEY (business_id, sale_id) REFERENCES sales(business_id, id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sale_line_items_sale ON sale_line_items(business_id, sale_id);

-- 10. Orders (Sales Orders & Delivery Commitments)
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(100) NOT NULL,
    business_id VARCHAR(100) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    order_number VARCHAR(100) NOT NULL,
    order_date DATE NOT NULL,
    party_id VARCHAR(100),
    party_name VARCHAR(255) NOT NULL,
    salesman_id VARCHAR(100),
    total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Pending',
    delivery_date DATE,
    notes TEXT,
    items_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (business_id, id),
    CONSTRAINT uq_orders_biz_number UNIQUE (business_id, order_number)
);
CREATE INDEX IF NOT EXISTS idx_orders_biz_date ON orders(business_id, order_date DESC);

-- 11. Purchases (Vendor Bills & Purchase Returns)
CREATE TABLE IF NOT EXISTS purchases (
    id VARCHAR(100) NOT NULL,
    business_id VARCHAR(100) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    bill_number VARCHAR(100) NOT NULL,
    doc_type VARCHAR(50) DEFAULT 'Bill',
    bill_date DATE NOT NULL,
    party_id VARCHAR(100),
    party_name VARCHAR(255) NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'Bank',
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(14, 2) DEFAULT 0.00,
    grand_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(14, 2) DEFAULT 0.00,
    balance_due NUMERIC(14, 2) DEFAULT 0.00,
    items_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (business_id, id),
    CONSTRAINT uq_purchases_biz_bill UNIQUE (business_id, bill_number)
);
CREATE INDEX IF NOT EXISTS idx_purchases_biz_date ON purchases(business_id, bill_date DESC);

-- 12. Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(100) NOT NULL,
    business_id VARCHAR(100) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    expense_date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    amount NUMERIC(14, 2) NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'Cash',
    reference_number VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (business_id, id)
);
CREATE INDEX IF NOT EXISTS idx_expenses_biz_date ON expenses(business_id, expense_date DESC);

-- 13. Cash & Bank Accounts and Transactions
CREATE TABLE IF NOT EXISTS cash_bank_accounts (
    id VARCHAR(100) NOT NULL,
    business_id VARCHAR(100) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    account_name VARCHAR(150) NOT NULL,
    bank_name VARCHAR(150),
    account_number VARCHAR(60),
    ifsc VARCHAR(30),
    opening_balance NUMERIC(14, 2) DEFAULT 0.00,
    current_balance NUMERIC(14, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (business_id, id)
);

CREATE TABLE IF NOT EXISTS cash_in_hand (
    business_id VARCHAR(100) PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
    amount NUMERIC(14, 2) DEFAULT 0.00,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Payments In (Receipts from Customers) & Payments Out (Vendor Payments)
CREATE TABLE IF NOT EXISTS payments_in (
    id VARCHAR(100) NOT NULL,
    business_id VARCHAR(100) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    payment_number VARCHAR(100) NOT NULL,
    payment_date DATE NOT NULL,
    party_id VARCHAR(100),
    party_name VARCHAR(255) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'Cash',
    tx_ref VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (business_id, id)
);
CREATE INDEX IF NOT EXISTS idx_payments_in_biz_date ON payments_in(business_id, payment_date DESC);

CREATE TABLE IF NOT EXISTS payments_out (
    id VARCHAR(100) NOT NULL,
    business_id VARCHAR(100) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    payment_number VARCHAR(100) NOT NULL,
    payment_date DATE NOT NULL,
    party_id VARCHAR(100),
    party_name VARCHAR(255) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'Bank',
    tx_ref VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (business_id, id)
);
CREATE INDEX IF NOT EXISTS idx_payments_out_biz_date ON payments_out(business_id, payment_date DESC);

-- 15. e-Way Bills (GST NIC Compliance)
CREATE TABLE IF NOT EXISTS eway_bills (
    id VARCHAR(100) NOT NULL,
    business_id VARCHAR(100) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    eway_number VARCHAR(50) NOT NULL,
    eway_date TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    invoice_number VARCHAR(100),
    party_name VARCHAR(255) NOT NULL,
    party_gstin VARCHAR(20),
    vehicle_number VARCHAR(50),
    transporter_name VARCHAR(150),
    total_value NUMERIC(14, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (business_id, id),
    CONSTRAINT uq_eway_biz_number UNIQUE (business_id, eway_number)
);

-- 16. Estimates & Quotations
CREATE TABLE IF NOT EXISTS estimates (
    id VARCHAR(100) NOT NULL,
    business_id VARCHAR(100) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    estimate_number VARCHAR(100) NOT NULL,
    estimate_date DATE NOT NULL,
    party_id VARCHAR(100),
    party_name VARCHAR(255) NOT NULL,
    total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Open',
    items_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (business_id, id)
);

-- 17. Delivery Challans
CREATE TABLE IF NOT EXISTS delivery_challans (
    id VARCHAR(100) NOT NULL,
    business_id VARCHAR(100) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    challan_number VARCHAR(100) NOT NULL,
    challan_date DATE NOT NULL,
    party_id VARCHAR(100),
    party_name VARCHAR(255) NOT NULL,
    total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Dispatched',
    items_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (business_id, id)
);

-- 18. Sales Returns & Credit Notes
CREATE TABLE IF NOT EXISTS sales_returns (
    id VARCHAR(100) NOT NULL,
    business_id VARCHAR(100) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    return_number VARCHAR(100) NOT NULL,
    return_date DATE NOT NULL,
    invoice_number VARCHAR(100),
    party_id VARCHAR(100),
    party_name VARCHAR(255) NOT NULL,
    total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'Returned',
    items_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (business_id, id)
);

-- 19. Purchase Returns & Debit Notes
CREATE TABLE IF NOT EXISTS purchase_returns (
    id VARCHAR(100) NOT NULL,
    business_id VARCHAR(100) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    return_number VARCHAR(100) NOT NULL,
    return_date DATE NOT NULL,
    party_id VARCHAR(100),
    party_name VARCHAR(255) NOT NULL,
    total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'Returned',
    items_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (business_id, id)
);

-- 20. Salesmen & Field Force Module
CREATE TABLE IF NOT EXISTS salesmen (
    id VARCHAR(100) NOT NULL,
    business_id VARCHAR(100) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    emp_id VARCHAR(50),
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(255),
    territory VARCHAR(150),
    role VARCHAR(50) DEFAULT 'Field Salesman',
    pin VARCHAR(20),
    pin_hash VARCHAR(255),
    salt VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (business_id, id)
);

CREATE TABLE IF NOT EXISTS salesman_tasks (
    id VARCHAR(100) NOT NULL,
    business_id VARCHAR(100) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    salesman_id VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    priority VARCHAR(50) DEFAULT 'Normal',
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (business_id, id)
);

CREATE TABLE IF NOT EXISTS salesman_leads (
    id VARCHAR(100) NOT NULL,
    business_id VARCHAR(100) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    salesman_id VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    address TEXT,
    status VARCHAR(50) DEFAULT 'New',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (business_id, id)
);

CREATE TABLE IF NOT EXISTS salesman_visits (
    id VARCHAR(100) NOT NULL,
    business_id VARCHAR(100) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    salesman_id VARCHAR(100) NOT NULL,
    party_id VARCHAR(100),
    party_name VARCHAR(255),
    visit_date TIMESTAMPTZ DEFAULT NOW(),
    purpose VARCHAR(255),
    notes TEXT,
    outcome VARCHAR(100),
    location JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (business_id, id)
);

CREATE TABLE IF NOT EXISTS salesman_attendance (
    id SERIAL PRIMARY KEY,
    business_id VARCHAR(100) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    salesman_id VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'Present',
    location JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_attendance_salesman_date UNIQUE (business_id, salesman_id, date)
);

-- 21. Accountant Access Tokens & Permissions
CREATE TABLE IF NOT EXISTS accountant_access (
    id VARCHAR(100) NOT NULL,
    business_id VARCHAR(100) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    accountant_email VARCHAR(255) NOT NULL,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'Active',
    permissions JSONB DEFAULT '[]'::jsonb,
    PRIMARY KEY (business_id, id)
);

-- 22. Audit Logs (Security & Immutable Accounting Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    business_id VARCHAR(100) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id VARCHAR(100),
    user_name VARCHAR(150),
    action VARCHAR(150) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_biz_time ON audit_logs(business_id, timestamp DESC);

-- 23. Sync Queue & Delta Sync Tracking (Idempotency and Conflict Protection)
CREATE TABLE IF NOT EXISTS sync_operations (
    id VARCHAR(100) PRIMARY KEY,
    business_id VARCHAR(100) NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    client_id VARCHAR(100),
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    operation VARCHAR(20) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
    idempotency_key VARCHAR(255) UNIQUE,
    payload JSONB NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    client_timestamp TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_sync_biz_entity ON sync_operations(business_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_idempotency ON sync_operations(idempotency_key);

-- Billease Initial Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tenants (Stores / Retailers)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(128),
    address TEXT,
    city VARCHAR(100),
    state_code VARCHAR(10) DEFAULT '27',
    has_gst BOOLEAN DEFAULT false,
    gstin VARCHAR(20),
    is_composition_scheme BOOLEAN DEFAULT false,
    logo_url TEXT,
    banner_url TEXT,
    invoice_prefix VARCHAR(10) DEFAULT 'INV',
    invoice_footer TEXT DEFAULT 'Thank you for shopping with us! Visit again.',
    thermal_width_mm INT DEFAULT 80,
    upi_vpa VARCHAR(100),
    upi_payee_name VARCHAR(255),
    loyalty_points_per_100 NUMERIC(10, 2) DEFAULT 1.00,
    loyalty_point_value_rs NUMERIC(10, 2) DEFAULT 1.00,
    is_active BOOLEAN DEFAULT true,
    features_json JSONB DEFAULT '{"whatsapp_alerts": true, "loyalty_enabled": true, "thermal_print": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users & Roles
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    oidc_sub VARCHAR(255),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(128),
    phone VARCHAR(20),
    role VARCHAR(32) NOT NULL DEFAULT 'CASHIER', -- 'SUPER_ADMIN', 'STORE_ADMIN', 'MANAGER', 'CASHIER'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    barcode VARCHAR(128),
    sku VARCHAR(64),
    unit VARCHAR(20) DEFAULT 'PCS',
    hsn_code VARCHAR(20) DEFAULT '',
    gst_rate NUMERIC(5, 2) DEFAULT 0.00,
    is_price_tax_inclusive BOOLEAN DEFAULT true,
    min_stock_alert INT DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_products_tenant_barcode ON products(tenant_id, barcode);

-- 5. Product Batches & Stock
CREATE TABLE product_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_no VARCHAR(64) DEFAULT 'DEFAULT',
    mfg_date DATE,
    expiry_date DATE,
    mrp NUMERIC(12, 2) NOT NULL,
    cost_price NUMERIC(12, 2) DEFAULT 0.00,
    selling_price NUMERIC(12, 2) NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_selling_price_mrp CHECK (selling_price <= mrp)
);
CREATE INDEX idx_batches_expiry ON product_batches(tenant_id, expiry_date);

-- 6. Customers & Udhaar / Loyalty
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    gstin VARCHAR(20),
    address TEXT,
    credit_limit NUMERIC(12, 2) DEFAULT 5000.00,
    current_due NUMERIC(12, 2) DEFAULT 0.00,
    loyalty_points NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_customer_phone UNIQUE (tenant_id, phone)
);

-- 7. Coupons & Promotions
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,
    discount_type VARCHAR(20) NOT NULL, -- 'PERCENTAGE', 'FLAT'
    discount_value NUMERIC(10, 2) NOT NULL,
    min_order_amount NUMERIC(10, 2) DEFAULT 0.00,
    max_discount_cap NUMERIC(10, 2),
    valid_until TIMESTAMP WITH TIME ZONE,
    usage_count INT DEFAULT 0,
    max_usage INT DEFAULT 1000,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_coupon_code UNIQUE (tenant_id, code)
);

-- 8. Invoices (Bills)
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_number VARCHAR(64) NOT NULL,
    invoice_type VARCHAR(32) NOT NULL DEFAULT 'RETAIL_BILL', -- 'TAX_INVOICE', 'RETAIL_BILL'
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    subtotal NUMERIC(12, 2) NOT NULL,
    item_discount_total NUMERIC(12, 2) DEFAULT 0.00,
    bill_discount_percent NUMERIC(5, 2) DEFAULT 0.00,
    bill_discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    coupon_code VARCHAR(32),
    coupon_discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    loyalty_points_redeemed NUMERIC(12, 2) DEFAULT 0.00,
    loyalty_discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    taxable_amount NUMERIC(12, 2) NOT NULL,
    cgst_amount NUMERIC(12, 2) DEFAULT 0.00,
    sgst_amount NUMERIC(12, 2) DEFAULT 0.00,
    igst_amount NUMERIC(12, 2) DEFAULT 0.00,
    round_off NUMERIC(6, 2) DEFAULT 0.00,
    grand_total NUMERIC(12, 2) NOT NULL,
    payment_mode VARCHAR(32) NOT NULL DEFAULT 'CASH', -- 'CASH', 'UPI', 'CARD', 'CREDIT_KHATA', 'SPLIT'
    cash_tendered NUMERIC(12, 2) DEFAULT 0.00,
    change_returned NUMERIC(12, 2) DEFAULT 0.00,
    cashier_id UUID REFERENCES users(id) ON DELETE SET NULL,
    cashier_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_invoice_num UNIQUE (tenant_id, invoice_number)
);

-- 9. Invoice Line Items
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    batch_id UUID REFERENCES product_batches(id),
    product_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL,
    unit VARCHAR(20) DEFAULT 'PCS',
    unit_price NUMERIC(12, 2) NOT NULL,
    mrp NUMERIC(12, 2) NOT NULL,
    discount_percent NUMERIC(5, 2) DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    gst_rate NUMERIC(5, 2) DEFAULT 0.00,
    cgst_amount NUMERIC(12, 2) DEFAULT 0.00,
    sgst_amount NUMERIC(12, 2) DEFAULT 0.00,
    igst_amount NUMERIC(12, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL
);

-- 10. Customer Khata Ledger
CREATE TABLE khata_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    entry_type VARCHAR(32) NOT NULL, -- 'BILL_CREDIT', 'PAYMENT_RECEIVED', 'ADJUSTMENT'
    amount NUMERIC(12, 2) NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    payment_method VARCHAR(32), -- 'CASH', 'UPI', etc
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Stock & Expiry Alerts Log
CREATE TABLE stock_alerts_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    batch_id UUID REFERENCES product_batches(id) ON DELETE SET NULL,
    alert_type VARCHAR(32) NOT NULL, -- 'LOW_STOCK', 'OUT_OF_STOCK', 'NEAR_EXPIRY'
    message TEXT NOT NULL,
    channel VARCHAR(20) NOT NULL, -- 'WHATSAPP', 'EMAIL'
    recipient VARCHAR(128) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SENT', -- 'SENT', 'FAILED'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Super Admin & Demo Kirana Tenant
INSERT INTO tenants (
    id, slug, name, legal_name, phone, email, address, city, state_code,
    has_gst, gstin, is_composition_scheme, logo_url, banner_url,
    invoice_prefix, thermal_width_mm, upi_vpa, upi_payee_name
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'shree-ganesh-supermarket',
    'Shree Ganesh Supermarket',
    'Shree Ganesh Retail Enterprises LLP',
    '+919876543210',
    'support@shreeganeshstore.com',
    'Shop No. 4, MG Road, Shivaji Nagar',
    'Pune',
    '27',
    true,
    '27ABCDE1234F1Z5',
    false,
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=200&h=200&fit=crop',
    'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1200&h=300&fit=crop',
    'SGS',
    80,
    'shreeganesh@upi',
    'Shree Ganesh Supermarket'
);

INSERT INTO users (
    id, tenant_id, username, password_hash, full_name, email, phone, role
) VALUES (
    'b0000000-0000-0000-0000-000000000001',
    NULL,
    'superadmin',
    'admin123',
    'Platform Administrator',
    'admin@billease.in',
    '+919999900000',
    'SUPER_ADMIN'
), (
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'ganesh_owner',
    'store123',
    'Ganesh Patil (Owner)',
    'owner@shreeganeshstore.com',
    '+919876543210',
    'STORE_ADMIN'
), (
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'cashier1',
    'cashier123',
    'Rahul Deshmukh',
    'rahul@shreeganeshstore.com',
    '+919876543211',
    'CASHIER'
);

-- Seed Sample Categories
INSERT INTO categories (id, tenant_id, name) VALUES
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Groceries & Staples'),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Snacks & Biscuits'),
('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Beverages'),
('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Personal Care & Hygiene');

-- Seed Sample Products & Batches
INSERT INTO products (id, tenant_id, category_id, name, barcode, sku, unit, hsn_code, gst_rate, is_price_tax_inclusive, min_stock_alert) VALUES
('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Parle-G Glucose Biscuit 100g', '8901719101014', 'BIS-001', 'PACK', '19053100', 18.00, true, 10),
('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'Tata Tea Gold 250g', '8901052002345', 'BEV-001', 'PACK', '09024020', 5.00, true, 5),
('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Aashirvaad Shuddh Chakki Atta 5kg', '8901725121019', 'GRC-001', 'PACK', '11010000', 5.00, true, 8),
('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'Dettol Original Soap 75g (Buy 3 Get 1)', '8901396312450', 'HYG-001', 'PACK', '34011110', 18.00, true, 6),
('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Tata Salt Vacuum Evaporated 1kg', '8901015000124', 'GRC-002', 'PACK', '25010010', 0.00, true, 15);

INSERT INTO product_batches (id, tenant_id, product_id, batch_no, mfg_date, expiry_date, mrp, cost_price, selling_price, quantity) VALUES
('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'BATCH-PG-11', '2026-08-01', '2027-02-01', 10.00, 7.80, 10.00, 48.000),
('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'BATCH-TT-04', '2026-09-01', '2027-09-01', 150.00, 122.00, 140.00, 18.000),
('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'BATCH-AA-09', '2026-10-01', '2027-04-01', 260.00, 220.00, 245.00, 12.000),
('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', 'BATCH-DT-02', '2026-07-01', '2028-07-01', 120.00, 95.00, 110.00, 22.000),
('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', 'BATCH-TS-01', '2026-09-15', '2028-09-15', 28.00, 21.00, 28.00, 35.000);

-- Seed Sample Customers with Khata and Loyalty Points
INSERT INTO customers (id, tenant_id, name, phone, address, credit_limit, current_due, loyalty_points) VALUES
('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Ramesh Bhai Shinde', '+919822012345', 'Flat 102, Shanti Heights', 5000.00, 1250.00, 45.00),
('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Pooja Sharma', '+919765432109', 'B-14, Laxmi Park', 3000.00, 0.00, 120.00);

-- Seed Sample Coupons
INSERT INTO coupons (id, tenant_id, code, discount_type, discount_value, min_order_amount, max_discount_cap, valid_until) VALUES
('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'DIWALI50', 'FLAT', 50.00, 500.00, 50.00, '2027-12-31 23:59:59'),
('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'SAVE10', 'PERCENTAGE', 10.00, 300.00, 100.00, '2027-12-31 23:59:59');


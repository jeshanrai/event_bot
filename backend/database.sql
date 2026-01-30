-- ==========================================
-- MULTI-TENANT RESTAURANT SaaS SCHEMA
-- ==========================================

-- =========================
-- 1. RESTAURANTS
-- =========================
CREATE TABLE IF NOT EXISTS restaurants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    contact_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- 2. USERS
-- =========================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(512) NOT NULL,
    role VARCHAR(50) NOT NULL
        CHECK (role IN ('superadmin', 'restaurant_owner', 'staff')),
    image_url TEXT,
    restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- 3. FOODS (MENU ITEMS)
-- =========================
CREATE TABLE IF NOT EXISTS foods (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    category VARCHAR(100) NOT NULL,
    image_url TEXT,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_foods_restaurant_id ON foods(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_foods_category ON foods(category);
CREATE INDEX IF NOT EXISTS idx_foods_available ON foods(available);

-- =========================
-- 4. ORDERS
-- =========================
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,

    restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,

    customer_platform_id VARCHAR(100) NOT NULL,
    platform VARCHAR(20) DEFAULT 'whatsapp',

    status VARCHAR(50) DEFAULT 'created'
        CHECK (status IN (
            'created',
            'confirmed',
            'preparing',
            'completed',
            'cancelled'
        )),

    service_type VARCHAR(20) DEFAULT 'dine_in'
        CHECK (service_type IN ('dine_in')),

    payment_method VARCHAR(20)
        CHECK (payment_method IN ('cash', 'esewa', 'khalti', 'fonepay', 'card')),

    total_amount DECIMAL(10,2) CHECK (total_amount >= 0),
    payment_verified BOOLEAN DEFAULT false,
    payment_screenshot_url TEXT,

    verified_by INTEGER REFERENCES users(id),
    verified_at TIMESTAMP,
    rejection_reason TEXT,

    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    special_instructions TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_platform_id ON orders(customer_platform_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- =========================
-- 5. ORDER ITEMS
-- =========================
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    food_id INTEGER NOT NULL REFERENCES foods(id),
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- =========================
-- 6. SESSIONS (WHATSAPP BOT CONTEXT)
-- =========================
CREATE TABLE IF NOT EXISTS sessions (
    user_id VARCHAR(50) PRIMARY KEY, -- Keeping VARCHAR for WhatsApp ID compatibility
    context JSONB NOT NULL,
    cart JSONB DEFAULT '[]',
    payment_method VARCHAR(20),
    service_type VARCHAR(20),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- 7. CREDENTIALS (MULTI-ACCOUNT SUPPORT)
-- =========================

-- WhatsApp Credentials (Multi-Account per Restaurant)
CREATE TABLE IF NOT EXISTS whatsapp_credentials (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    
    -- WhatsApp Business API credentials
    access_token TEXT NOT NULL,
    phone_number_id VARCHAR(50) NOT NULL UNIQUE,
    whatsapp_business_account_id VARCHAR(50),
    expires_at TIMESTAMP,
    
    -- Phone number details
    phone_number VARCHAR(50),
    display_phone_number VARCHAR(50),
    quality_rating VARCHAR(50),
    
    -- Connection status
    status VARCHAR(50) DEFAULT 'active' 
        CHECK (status IN ('active', 'pending_signup', 'pending_phone', 'expired', 'inactive')),
    is_active BOOLEAN DEFAULT true,
    
    -- Webhook configuration
    webhook_url TEXT,
    
    -- Timestamps
    connected_at TIMESTAMP DEFAULT NOW(),
    last_verified_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Facebook Credentials (Multi-Account per Restaurant)
CREATE TABLE IF NOT EXISTS facebook_credentials (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    
    -- Facebook Page credentials
    page_id VARCHAR(255) NOT NULL UNIQUE,
    page_name VARCHAR(255),
    page_access_token TEXT NOT NULL,
    
    -- Connection status
    status VARCHAR(50) DEFAULT 'active'
        CHECK (status IN ('active', 'expired', 'inactive')),
    is_active BOOLEAN DEFAULT true,
    
    -- Webhook configuration
    webhook_url TEXT,
    
    -- Timestamps
    connected_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_user_id ON whatsapp_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_restaurant_id ON whatsapp_credentials(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_phone_number_id ON whatsapp_credentials(phone_number_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_is_active ON whatsapp_credentials(is_active);

CREATE INDEX IF NOT EXISTS idx_facebook_user_id ON facebook_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_facebook_restaurant_id ON facebook_credentials(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_facebook_page_id ON facebook_credentials(page_id);
CREATE INDEX IF NOT EXISTS idx_facebook_is_active ON facebook_credentials(is_active);

-- =========================
-- 8. DEFAULT SEED DATA
-- =========================
INSERT INTO restaurants (name, address, contact_number) VALUES
('Momo House', 'Kathmandu, Nepal', '+977-9800000000')
ON CONFLICT DO NOTHING;


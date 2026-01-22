
-- =========================
--- =========================
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
-- 2. AI USAGE STATS
-- =========================
CREATE TABLE IF NOT EXISTS ai_usage_stats (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(50) NOT NULL,
    llm_call_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- 3. USERS
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
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
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

    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,

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
    user_id VARCHAR(50) PRIMARY KEY,
    context JSONB NOT NULL,
    cart JSONB DEFAULT '[]',
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- END OF SCHEMA
-- =========================


ALTER TABLE orders DROP CONSTRAINT orders_status_check;

ALTER TABLE orders
ADD CONSTRAINT orders_status_check
CHECK (status IN (
    'created',
    'pending',
    'accepted',
    'confirmed',
    'preparing',
    'ready',
    'completed',
    'cancelled',
    'rejected'
));
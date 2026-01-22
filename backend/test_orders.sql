
-- =========================
-- 1. USERS
-- =========================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL
        CHECK (role IN ('superadmin', 'restaurant_owner', 'staff')),
    image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- 2. FOODS (MENU ITEMS)
-- =========================
CREATE TABLE IF NOT EXISTS foods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    image_url TEXT,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_foods_category ON foods(category);
CREATE INDEX IF NOT EXISTS idx_foods_available ON foods(available);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,

    customer_id VARCHAR(50) NOT NULL,
    platform VARCHAR(20) DEFAULT 'whatsapp',

    status VARCHAR(50) DEFAULT 'created'
        CHECK (status IN (
            'created',
            'confirmed',
            'preparing',
            'ready',
            'completed',
            'cancelled',
            'rejected'
        )),

    service_type VARCHAR(20)
        CHECK (service_type IN ('dine_in', 'delivery', 'pickup')),

    delivery_address TEXT,

    payment_method VARCHAR(20)
        CHECK (payment_method IN ('cash', 'esewa', 'khalti', 'fonepay', 'card')),

    total_amount DECIMAL(10,2),
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

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_platform ON orders(platform);


CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    food_id INTEGER REFERENCES foods(id),
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- =========================
-- 5. TABLES (DINE-IN)
-- =========================
CREATE TABLE IF NOT EXISTS tables (
    id SERIAL PRIMARY KEY,
    table_number INTEGER UNIQUE NOT NULL,
    capacity INTEGER NOT NULL,
    location VARCHAR(50)
        CHECK (location IN ('indoor', 'outdoor', 'private')),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- 6. RESERVATIONS
-- =========================
CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    platform VARCHAR(20) NOT NULL,
    table_id INTEGER REFERENCES tables(id),
    party_size INTEGER DEFAULT 2,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- END OF SCHEMA
-- =============================================

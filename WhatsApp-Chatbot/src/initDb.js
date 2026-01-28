/**
 * Database Initialization Script
 * Run this once to create tables and seed data on Render PostgreSQL
 * 
 * Usage: node src/initDb.js
 */

import db from './db.js';

const schema = `
-- =========================
-- =========================
-- 1. RESTAURANTS
-- =========================
CREATE TABLE IF NOT EXISTS restaurants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    contact_number VARCHAR(50),
    menu JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_usage_stats (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(50) NOT NULL,
    llm_call_count INTEGER DEFAULT 0,
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
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL
        CHECK (role IN ('superadmin', 'restaurant_owner', 'staff')),
    image_url TEXT,
    restaurant_id INTEGER REFERENCES restaurants(id),
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
-- 7. SESSIONS (APP CONTEXT)
-- =========================
CREATE TABLE IF NOT EXISTS sessions (
    user_id VARCHAR(50) PRIMARY KEY,
    context JSONB NOT NULL,
    cart JSONB DEFAULT '[]',
    updated_at TIMESTAMP DEFAULT NOW()
);
`;

const seedData = `
-- Insert food categories and items
-- Insert default restaurant and food items
INSERT INTO restaurants (name, address, contact_number) VALUES
('Momo House', 'Kathmandu, Nepal', '+977-9800000000')
ON CONFLICT DO NOTHING;

INSERT INTO foods (restaurant_id, name, description, price, category, image_url, available) VALUES
-- Momos
(1, 'Steamed Veg Momo', 'Fresh vegetables & herbs wrapped in soft dough, steamed to perfection', 18.00, 'momos', 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=400&q=80', true),
(1, 'Steamed Chicken Momo', 'Juicy chicken filling in soft steamed dumplings', 22.00, 'momos', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&q=80', true),
(1, 'Fried Veg Momo', 'Crispy fried vegetable momos with crunchy exterior', 20.00, 'momos', 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&q=80', true),
(1, 'Fried Chicken Momo', 'Golden fried chicken momos, crispy and delicious', 24.00, 'momos', 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&q=80', true),
(1, 'Tandoori Momo', 'Momos grilled in tandoor with special spices', 26.00, 'momos', 'https://images.unsplash.com/photo-1541696490-8744a5dc0228?w=400&q=80', true),
(1, 'Jhol Momo', 'Steamed momos served in spicy soup gravy', 25.00, 'momos', 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80', true),

-- Noodles
(1, 'Veg Thukpa', 'Traditional Tibetan noodle soup with vegetables', 20.00, 'noodles', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80', true),
(1, 'Chicken Thukpa', 'Hearty noodle soup with tender chicken pieces', 25.00, 'noodles', 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=400&q=80', true),
(1, 'Veg Chowmein', 'Stir-fried noodles with fresh vegetables', 18.00, 'noodles', 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&q=80', true),
(1, 'Chicken Chowmein', 'Stir-fried noodles with chicken and vegetables', 22.00, 'noodles', 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=400&q=80', true),
(1, 'Veg Chopsuey', 'Crispy noodles with vegetable gravy', 22.00, 'noodles', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&q=80', true),

-- Rice Dishes
(1, 'Veg Fried Rice', 'Wok-tossed rice with mixed vegetables', 18.00, 'rice', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80', true),
(1, 'Chicken Fried Rice', 'Delicious fried rice with chicken pieces', 22.00, 'rice', 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80', true),
(1, 'Egg Fried Rice', 'Classic egg fried rice with vegetables', 19.00, 'rice', 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=400&q=80', true),
(1, 'Chicken Biryani', 'Aromatic basmati rice with spiced chicken', 30.00, 'rice', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80', true),

-- Beverages (Australian Selection)
(1, 'Flat White', 'Classic Australian coffee with velvety microfoam and rich espresso.', 4.50, 'Beverages', 'images/flat_white.jpg', true),
(1, 'Long Black', 'Hot water topped with a double shot of espresso for a strong flavor.', 4.00, 'Beverages', 'images/long_black.jpg', true),
(1, 'Cappuccino', 'Espresso with steamed milk and a thick layer of foam, dusted with cocoa.', 4.80, 'Beverages', 'images/cappuccino.jpg', true),
(1, 'Iced Coffee (Aussie Style)', 'Chilled coffee served with milk, ice cream, and whipped cream.', 6.50, 'Beverages', 'images/iced_coffee.jpg', true),
(1, 'Milo Drink', 'Hot chocolate malt drink loved across Australia.', 3.50, 'Beverages', 'images/milo.jpg', true),
(1, 'Lemon Lime Bitters', 'Refreshing mix of lemon squash, lime cordial, and bitters.', 4.20, 'Beverages', 'images/lemon_lime_bitters.jpg', true),
(1, 'Bundaberg Ginger Beer', 'Famous Australian brewed ginger beer, non-alcoholic.', 3.80, 'Beverages', 'images/ginger_beer.jpg', true),
(1, 'Chai Latte', 'Spiced tea latte with steamed milk and cinnamon aroma.', 4.60, 'Beverages', 'images/chai_latte.jpg', true),
(1, 'Iced Chocolate', 'Cold chocolate drink topped with whipped cream and chocolate syrup.', 5.80, 'Beverages', 'images/iced_chocolate.jpg', true),
(1, 'Affogato', 'Vanilla ice cream topped with a shot of hot espresso.', 5.20, 'Beverages', 'images/affogato.jpg', true)

ON CONFLICT DO NOTHING;
`;

async function initializeDatabase() {
    console.log('🚀 Starting database initialization...\n');

    try {
        // Create tables
        console.log('📦 Creating tables...');
        await db.query(schema);
        console.log('✅ Tables created successfully!\n');

        // Check if data already exists
        const existingData = await db.query('SELECT COUNT(*) FROM foods');
        const count = parseInt(existingData.rows[0].count);

        if (count > 0) {
            console.log(`ℹ️  Database already has ${count} food items. Skipping seed data.`);
        } else {
            // Seed data
            console.log('🌱 Seeding initial data...');
            await db.query(seedData);
            console.log('✅ Seed data inserted successfully!\n');
        }

        // Verify
        const foods = await db.query('SELECT COUNT(*) FROM foods');
        const orders = await db.query('SELECT COUNT(*) FROM orders');

        console.log('📊 Database Status:');
        console.log(`   - Foods: ${foods.rows[0].count} items`);
        console.log(`   - Orders: ${orders.rows[0].count} orders`);
        console.log('\n✅ Database initialization complete!');

    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        throw error;
    } finally {
        await db.end();
        process.exit(0);
    }
}

initializeDatabase();

const { pool } = require('../config/db');

const initPricingPlans = async () => {
    try {
        console.log('Creating pricing_plans table...');

        // Create table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS pricing_plans (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                price DECIMAL(10, 2) NOT NULL,
                currency VARCHAR(3) DEFAULT 'PKR',
                billing_period VARCHAR(20) DEFAULT 'monthly',
                features JSONB,
                is_active BOOLEAN DEFAULT true,
                display_order INTEGER,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        console.log('✓ pricing_plans table created');

        // Create indexes
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_pricing_plans_active ON pricing_plans(is_active)
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_pricing_plans_display_order ON pricing_plans(display_order)
        `);

        console.log('✓ Indexes created');

        // Insert default plans
        await pool.query(`
            INSERT INTO pricing_plans (name, description, price, currency, billing_period, features, is_active, display_order) VALUES
            (
                'Starter',
                'Perfect for small restaurants getting started',
                2999,
                'PKR',
                'monthly',
                '{"ai_enabled": true, "platforms": ["whatsapp"], "max_conversations": 5000, "users": 3, "analytics": true, "support": "email"}',
                true,
                1
            ),
            (
                'Professional',
                'For growing restaurants looking to scale',
                7999,
                'PKR',
                'monthly',
                '{"ai_enabled": true, "platforms": ["whatsapp", "messenger", "web"], "max_conversations": 25000, "users": 10, "analytics": true, "support": "priority_email", "api_access": true}',
                true,
                2
            ),
            (
                'Enterprise',
                'Complete package for established restaurants',
                19999,
                'PKR',
                'monthly',
                '{"ai_enabled": true, "platforms": ["whatsapp", "messenger", "web", "api"], "max_conversations": 100000, "users": 50, "analytics": true, "support": "phone_chat", "api_access": true, "custom_ai": true, "dedicated_manager": true}',
                true,
                3
            )
            ON CONFLICT (name) DO NOTHING
        `);

        console.log('✓ Default plans inserted');

        // Create view
        await pool.query(`
            CREATE OR REPLACE VIEW v_active_plans AS
            SELECT 
                id,
                name,
                description,
                price,
                currency,
                billing_period,
                features,
                display_order
            FROM pricing_plans
            WHERE is_active = true
            ORDER BY display_order ASC
        `);

        console.log('✓ View v_active_plans created');
        console.log('\n✅ Pricing plans table setup completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error setting up pricing plans:', error);
        process.exit(1);
    }
};

initPricingPlans();

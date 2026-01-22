const db = require('../src/config/db');

async function runMigration() {
    try {
        console.log('Creating whatsapp_credentials table...');

        // Create the table
        await db.query(`
            CREATE TABLE IF NOT EXISTS whatsapp_credentials (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                
                -- Facebook/WhatsApp credentials
                access_token TEXT NOT NULL,
                phone_number_id VARCHAR(255),
                whatsapp_business_account_id VARCHAR(255),
                
                -- Token metadata
                token_type VARCHAR(50) DEFAULT 'Bearer',
                expires_at TIMESTAMP,
                
                -- Connection status
                is_active BOOLEAN DEFAULT true,
                connected_at TIMESTAMP DEFAULT NOW(),
                last_verified_at TIMESTAMP,
                
                -- Additional metadata
                phone_number VARCHAR(50),
                display_phone_number VARCHAR(50),
                quality_rating VARCHAR(50),
                
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                
                UNIQUE(user_id)
            );
        `);

        console.log('✅ Table created successfully');

        // Create indexes
        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_whatsapp_user_id 
            ON whatsapp_credentials(user_id);
        `);

        await db.query(`
            CREATE INDEX IF NOT EXISTS idx_whatsapp_active 
            ON whatsapp_credentials(is_active);
        `);

        console.log('✅ Indexes created successfully');
        console.log('✅ Migration completed!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();

-- Run this script to create the whatsapp_credentials table
-- Execute: psql -U your_username -d your_database -f whatsapp_credentials.sql

\c restaurant_bot;

-- WhatsApp Business API Credentials Table
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

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_whatsapp_user_id ON whatsapp_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_active ON whatsapp_credentials(is_active);

-- Grant permissions (adjust username as needed)
GRANT ALL PRIVILEGES ON TABLE whatsapp_credentials TO postgres;
GRANT USAGE, SELECT ON SEQUENCE whatsapp_credentials_id_seq TO postgres;

SELECT 'WhatsApp credentials table created successfully!' AS status;

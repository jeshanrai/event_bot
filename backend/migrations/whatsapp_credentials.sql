-- Create whatsapp_credentials table
CREATE TABLE IF NOT EXISTS whatsapp_credentials (
    user_id VARCHAR(50) PRIMARY KEY,
    access_token TEXT NOT NULL,
    phone_number_id VARCHAR(50) NOT NULL,
    whatsapp_business_account_id VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP,
    phone_number VARCHAR(50),
    display_phone_number VARCHAR(50),
    quality_rating VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    connected_at TIMESTAMP DEFAULT NOW(),
    last_verified_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create simple index
CREATE INDEX IF NOT EXISTS idx_whatsapp_credentials_user_id ON whatsapp_credentials(user_id);

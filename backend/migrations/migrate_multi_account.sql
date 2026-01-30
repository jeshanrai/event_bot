-- Migration script to update credentials tables for multi-account support
-- Run this script to migrate existing data to the new schema

-- Step 1: Backup existing data
CREATE TABLE IF NOT EXISTS whatsapp_credentials_backup AS 
SELECT * FROM whatsapp_credentials;

CREATE TABLE IF NOT EXISTS facebook_credentials_backup AS 
SELECT * FROM facebook_credentials;

-- Step 2: Drop old tables (data is backed up)
DROP TABLE IF EXISTS whatsapp_credentials CASCADE;
DROP TABLE IF EXISTS facebook_credentials CASCADE;

-- Step 3: Create new whatsapp_credentials table with multi-account support
CREATE TABLE whatsapp_credentials (
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

-- Step 4: Create new facebook_credentials table with multi-account support
CREATE TABLE facebook_credentials (
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

-- Step 5: Migrate existing WhatsApp credentials (if any)
-- Note: This assumes user_id in old table was VARCHAR and needs to be mapped to INTEGER user_id
-- You may need to adjust this based on your actual data
INSERT INTO whatsapp_credentials (
    user_id, 
    restaurant_id, 
    access_token, 
    phone_number_id, 
    whatsapp_business_account_id,
    expires_at,
    phone_number,
    display_phone_number,
    quality_rating,
    is_active,
    connected_at,
    last_verified_at,
    created_at
)
SELECT 
    CAST(wb.user_id AS INTEGER),  -- Convert VARCHAR user_id to INTEGER
    u.restaurant_id,
    wb.access_token,
    wb.phone_number_id,
    wb.whatsapp_business_account_id,
    wb.expires_at,
    wb.phone_number,
    wb.display_phone_number,
    wb.quality_rating,
    wb.is_active,
    wb.connected_at,
    wb.last_verified_at,
    wb.created_at
FROM whatsapp_credentials_backup wb
JOIN users u ON CAST(wb.user_id AS INTEGER) = u.id
WHERE wb.phone_number_id IS NOT NULL;

-- Step 6: Migrate existing Facebook credentials (if any)
INSERT INTO facebook_credentials (
    user_id,
    restaurant_id,
    page_id,
    page_name,
    page_access_token,
    is_active,
    connected_at,
    created_at
)
SELECT 
    fb.user_id,
    u.restaurant_id,
    fb.page_id,
    fb.page_name,
    fb.page_access_token,
    fb.is_active,
    fb.connected_at,
    fb.created_at
FROM facebook_credentials_backup fb
JOIN users u ON fb.user_id = u.id;

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_user_id ON whatsapp_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_restaurant_id ON whatsapp_credentials(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_phone_number_id ON whatsapp_credentials(phone_number_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_is_active ON whatsapp_credentials(is_active);

CREATE INDEX IF NOT EXISTS idx_facebook_user_id ON facebook_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_facebook_restaurant_id ON facebook_credentials(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_facebook_page_id ON facebook_credentials(page_id);
CREATE INDEX IF NOT EXISTS idx_facebook_is_active ON facebook_credentials(is_active);

-- Step 8: Verify migration
SELECT 'WhatsApp Credentials Migration:' as info;
SELECT COUNT(*) as backup_count FROM whatsapp_credentials_backup;
SELECT COUNT(*) as migrated_count FROM whatsapp_credentials;

SELECT 'Facebook Credentials Migration:' as info;
SELECT COUNT(*) as backup_count FROM facebook_credentials_backup;
SELECT COUNT(*) as migrated_count FROM facebook_credentials;

-- Note: Keep backup tables for safety. Drop them manually after verifying migration:
-- DROP TABLE whatsapp_credentials_backup;
-- DROP TABLE facebook_credentials_backup;

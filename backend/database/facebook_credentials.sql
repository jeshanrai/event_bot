-- Facebook Page Integration Credentials Table
CREATE TABLE IF NOT EXISTS facebook_credentials (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Facebook Page credentials
    page_id VARCHAR(255) NOT NULL,
    page_name VARCHAR(255),
    page_access_token TEXT NOT NULL,
    
    -- Connection status
    is_active BOOLEAN DEFAULT true,
    connected_at TIMESTAMP DEFAULT NOW(),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id),
    UNIQUE(page_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_facebook_user_id ON facebook_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_facebook_page_id ON facebook_credentials(page_id);

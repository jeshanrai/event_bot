-- ==========================================
-- AI USAGE SIMPLE TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS ai_usage_stats (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('whatsapp', 'messenger', 'web')),
    llm_call_count INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_ai_usage_platform ON ai_usage_stats(platform);
CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON ai_usage_stats(DATE(created_at));

-- Trigger to auto-increment on duplicate platform for the same day
-- This ensures one record per platform per day

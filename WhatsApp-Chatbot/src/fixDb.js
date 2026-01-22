
import db from './db.js';

const fixSchema = `
-- AI USAGE STATS
CREATE TABLE IF NOT EXISTS ai_usage_stats (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(50) NOT NULL,
    llm_call_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- SESSIONS
CREATE TABLE IF NOT EXISTS sessions (
    user_id VARCHAR(50) PRIMARY KEY,
    context JSONB NOT NULL,
    cart JSONB DEFAULT '[]',
    updated_at TIMESTAMP DEFAULT NOW()
);
`;

async function fixDatabase() {
    console.log('🔧 Starting database fix...');
    try {
        await db.query(fixSchema);
        console.log('✅ Missing tables created/verified successfully!');

        // Verify
        const aiStats = await db.query("SELECT to_regclass('public.ai_usage_stats')");
        const sessions = await db.query("SELECT to_regclass('public.sessions')");

        if (aiStats.rows[0].to_regclass && sessions.rows[0].to_regclass) {
            console.log('✅ Verification passed: Tables exist.');
        } else {
            console.error('❌ Verification failed: Tables still missing.');
        }

    } catch (error) {
        console.error('❌ Database fix failed:', error);
    } finally {
        await db.end();
        process.exit(0);
    }
}

fixDatabase();

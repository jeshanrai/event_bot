/**
 * Simple AI Usage Logger
 * Tracks LLM API calls by platform
 */

import db from '../db.js';

/**
 * Log LLM call by platform
 * Increments count for the platform on the current day
 * @param {string} platform - Platform (whatsapp, messenger, web)
 */
export async function logLLMCall(platform = 'web') {
    try {
        const validPlatforms = ['whatsapp', 'messenger', 'web'];
        const normalizedPlatform = validPlatforms.includes(platform?.toLowerCase()) 
            ? platform.toLowerCase() 
            : 'web';

        // Check if record exists for today
        const checkQuery = `
            SELECT id FROM ai_usage_stats 
            WHERE platform = $1 
            AND DATE(created_at) = CURRENT_DATE
            LIMIT 1;
        `;

        const existing = await db.query(checkQuery, [normalizedPlatform]);

        if (existing.rows.length > 0) {
            // Update existing record
            const updateQuery = `
                UPDATE ai_usage_stats 
                SET llm_call_count = llm_call_count + 1,
                    updated_at = NOW()
                WHERE id = $1
                RETURNING *;
            `;
            const result = await db.query(updateQuery, [existing.rows[0].id]);
            return result.rows[0];
        } else {
            // Create new record
            const insertQuery = `
                INSERT INTO ai_usage_stats (platform, llm_call_count)
                VALUES ($1, 1)
                RETURNING *;
            `;
            const result = await db.query(insertQuery, [normalizedPlatform]);
            return result.rows[0];
        }
    } catch (error) {
        console.error('Error logging LLM call:', error);
        return null;
    }
}

/**
 * Get AI usage stats for the last N days
 * @param {number} days - Number of days to retrieve (default: 7)
 * @returns {Promise<Array>} - Usage stats grouped by platform and date
 */
export async function getAIUsageStats(days = 7) {
    try {
        const query = `
            SELECT 
                platform,
                DATE(created_at) as date,
                SUM(llm_call_count) as total_calls
            FROM ai_usage_stats
            WHERE created_at >= NOW() - INTERVAL '${days} days'
            GROUP BY platform, DATE(created_at)
            ORDER BY DATE(created_at) DESC, platform;
        `;

        const result = await db.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error fetching AI usage stats:', error);
        return [];
    }
}

/**
 * Get total calls by platform (all time)
 * @returns {Promise<Array>} - Total calls per platform
 */
export async function getPlatformStats() {
    try {
        const query = `
            SELECT 
                platform,
                SUM(llm_call_count) as total_calls,
                COUNT(*) as days_active,
                MAX(updated_at) as last_used
            FROM ai_usage_stats
            GROUP BY platform
            ORDER BY total_calls DESC;
        `;

        const result = await db.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error fetching platform stats:', error);
        return [];
    }
}

/**
 * Get total calls for today
 * @returns {Promise<number>} - Total LLM calls today
 */
export async function getTodaysTotalCalls() {
    try {
        const query = `
            SELECT SUM(llm_call_count) as total
            FROM ai_usage_stats
            WHERE DATE(created_at) = CURRENT_DATE;
        `;

        const result = await db.query(query);
        return result.rows[0]?.total || 0;
    } catch (error) {
        console.error('Error fetching today\'s calls:', error);
        return 0;
    }
}

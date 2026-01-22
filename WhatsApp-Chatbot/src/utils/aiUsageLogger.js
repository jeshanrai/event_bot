/**
 * AI Usage Logger - Tracks LLM API calls and usage metrics
 * Logs to the ai_usage table in the database
 */

import db from '../db.js';

/**
 * Log LLM API call to database
 * @param {Object} params - Usage parameters
 * @param {string} params.userId - User/Customer ID
 * @param {string} params.platform - Platform (whatsapp, messenger, web)
 * @param {string} params.intent - Detected intent/tool name
 * @param {string} params.toolUsed - Tool that was executed
 * @param {number} params.tokensUsed - Tokens consumed by API
 * @param {number} params.responseTime - Response time in milliseconds
 * @param {boolean} params.success - Whether the call succeeded
 * @param {string} params.error - Error message if failed
 * @param {number} params.restaurantId - Restaurant ID (optional)
 * @returns {Promise<Object>} - Logged usage record
 */
export async function logAIUsage({
    userId,
    platform,
    intent,
    toolUsed,
    tokensUsed = 0,
    responseTime = 0,
    success = true,
    error = null,
    restaurantId = null
}) {
    try {
        const query = `
            INSERT INTO ai_usage (
                restaurant_id,
                user_id,
                platform,
                llm_model,
                intent,
                tool_used,
                tokens_used,
                response_time_ms,
                success,
                error_message,
                created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
            RETURNING *;
        `;

        const values = [
            restaurantId || null,
            userId,
            platform || 'web',
            'groq-mixtral',
            intent,
            toolUsed,
            tokensUsed,
            responseTime,
            success,
            error
        ];

        const result = await db.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error('Error logging AI usage:', error);
        // Don't throw - logging shouldn't break the main flow
        return null;
    }
}

/**
 * Get AI usage stats for a restaurant
 * @param {number} restaurantId - Restaurant ID
 * @param {number} days - Number of days to look back (default: 30)
 * @returns {Promise<Object>} - Usage statistics
 */
export async function getAIUsageStats(restaurantId, days = 30) {
    try {
        const query = `
            SELECT
                platform,
                COUNT(*) as count,
                SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_calls,
                AVG(response_time_ms) as avg_response_time,
                SUM(tokens_used) as total_tokens
            FROM ai_usage
            WHERE restaurant_id = $1
            AND created_at >= NOW() - INTERVAL '${days} days'
            GROUP BY platform;
        `;

        const result = await db.query(query, [restaurantId]);
        return result.rows;
    } catch (error) {
        console.error('Error fetching AI usage stats:', error);
        return [];
    }
}

/**
 * Get daily AI usage trends
 * @param {number} restaurantId - Restaurant ID
 * @param {number} days - Number of days to look back (default: 7)
 * @returns {Promise<Array>} - Daily usage records
 */
export async function getDailyAITrends(restaurantId, days = 7) {
    try {
        const query = `
            SELECT
                DATE(created_at) as date,
                platform,
                COUNT(*) as llm_calls,
                ROUND(100.0 * SUM(CASE WHEN success THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
            FROM ai_usage
            WHERE restaurant_id = $1
            AND created_at >= NOW() - INTERVAL '${days} days'
            GROUP BY DATE(created_at), platform
            ORDER BY date DESC;
        `;

        const result = await db.query(query, [restaurantId]);
        return result.rows;
    } catch (error) {
        console.error('Error fetching daily AI trends:', error);
        return [];
    }
}

/**
 * Get total API costs estimate
 * Cost calculation: Groq charges per 1M tokens
 * @param {number} restaurantId - Restaurant ID
 * @param {number} days - Number of days to look back (default: 7)
 * @returns {Promise<Object>} - Cost estimate
 */
export async function estimateAPICosts(restaurantId, days = 7) {
    try {
        // Groq pricing: ~$0.27 per 1M input tokens, ~$0.27 per 1M output tokens
        const GROQ_INPUT_COST_PER_M = 0.27;
        const GROQ_OUTPUT_COST_PER_M = 0.27;
        const AVG_OUTPUT_TOKENS = 200; // Average output tokens per request

        const query = `
            SELECT
                COUNT(*) as total_calls,
                SUM(tokens_used) as total_input_tokens,
                platform,
                SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_calls
            FROM ai_usage
            WHERE restaurant_id = $1
            AND created_at >= NOW() - INTERVAL '${days} days'
            GROUP BY platform;
        `;

        const result = await db.query(query, [restaurantId]);
        
        let totalCost = 0;
        let breakdown = [];

        result.rows.forEach(row => {
            const inputCost = (row.total_input_tokens / 1000000) * GROQ_INPUT_COST_PER_M;
            const outputCost = (row.total_calls * AVG_OUTPUT_TOKENS / 1000000) * GROQ_OUTPUT_COST_PER_M;
            const platformCost = inputCost + outputCost;
            totalCost += platformCost;

            breakdown.push({
                platform: row.platform,
                calls: row.total_calls,
                successfulCalls: row.successful_calls,
                inputTokens: row.total_input_tokens,
                estimatedCost: platformCost.toFixed(4)
            });
        });

        return {
            totalEstimatedCost: totalCost.toFixed(4),
            days,
            breakdown
        };
    } catch (error) {
        console.error('Error estimating API costs:', error);
        return { totalEstimatedCost: 0, breakdown: [] };
    }
}

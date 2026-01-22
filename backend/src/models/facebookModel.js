const db = require('../config/db');

class FacebookCredentials {
    static async upsert(userId, { page_id, page_name, page_access_token }) {
        const query = `
            INSERT INTO facebook_credentials (user_id, page_id, page_name, page_access_token)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                page_id = EXCLUDED.page_id,
                page_name = EXCLUDED.page_name,
                page_access_token = EXCLUDED.page_access_token,
                is_active = true,
                updated_at = NOW()
            RETURNING *;
        `;
        const values = [userId, page_id, page_name, page_access_token];
        const { rows } = await db.query(query, values);
        return rows[0];
    }

    static async findActive(userId) {
        const query = 'SELECT * FROM facebook_credentials WHERE user_id = $1 AND is_active = true;';
        const { rows } = await db.query(query, [userId]);
        return rows[0];
    }

    static async deactivate(userId) {
        const query = 'UPDATE facebook_credentials SET is_active = false, updated_at = NOW() WHERE user_id = $1 RETURNING *;';
        const { rows } = await db.query(query, [userId]);
        return rows[0];
    }
}

module.exports = FacebookCredentials;

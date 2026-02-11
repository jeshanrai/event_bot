const db = require('../config/db');

class FacebookCredentials {
    static async upsert(userId, restaurantId, { page_id, page_name, page_access_token }) {
        // Check if this restaurant already has a Facebook credential
        const checkQuery = 'SELECT id FROM facebook_credentials WHERE restaurant_id = $1 LIMIT 1;';
        const { rows: existingRows } = await db.query(checkQuery, [restaurantId]);

        if (existingRows.length > 0) {
            // Update the existing row for this restaurant
            const updateQuery = `
                UPDATE facebook_credentials 
                SET 
                    user_id = $1,
                    page_id = $2,
                    page_name = $3,
                    page_access_token = $4,
                    is_active = true,
                    updated_at = NOW()
                WHERE restaurant_id = $5
                RETURNING *;
            `;
            const values = [userId, page_id, page_name, page_access_token, restaurantId];
            const { rows } = await db.query(updateQuery, values);
            return rows[0];
        } else {
            // Insert new row for this restaurant
            const insertQuery = `
                INSERT INTO facebook_credentials (user_id, restaurant_id, page_id, page_name, page_access_token)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *;
            `;
            const values = [userId, restaurantId, page_id, page_name, page_access_token];
            const { rows } = await db.query(insertQuery, values);
            return rows[0];
        }
    }

    static async findActive(userId) {
        const query = 'SELECT * FROM facebook_credentials WHERE user_id = $1 AND is_active = true ORDER BY connected_at DESC LIMIT 1;';
        const { rows } = await db.query(query, [userId]);
        return rows[0];
    }

    static async findByRestaurantId(restaurantId) {
        const query = 'SELECT * FROM facebook_credentials WHERE restaurant_id = $1 ORDER BY is_active DESC, connected_at DESC;';
        const { rows } = await db.query(query, [restaurantId]);
        return rows;
    }

    static async findAllActiveByRestaurant(restaurantId) {
        const query = 'SELECT * FROM facebook_credentials WHERE restaurant_id = $1 AND is_active = true ORDER BY connected_at DESC;';
        const { rows } = await db.query(query, [restaurantId]);
        return rows;
    }

    static async findByPageId(pageId) {
        const query = `
            SELECT fc.*, r.name as restaurant_name, r.id as restaurant_id
            FROM facebook_credentials fc
            LEFT JOIN restaurants r ON fc.restaurant_id = r.id
            WHERE fc.page_id = $1 AND fc.is_active = true
        `;
        const { rows } = await db.query(query, [pageId]);
        return rows[0];
    }

    static async findById(id) {
        const query = 'SELECT * FROM facebook_credentials WHERE id = $1;';
        const { rows } = await db.query(query, [id]);
        return rows[0];
    }

    static async deactivate(userId) {
        const query = 'UPDATE facebook_credentials SET is_active = false, updated_at = NOW() WHERE user_id = $1 RETURNING *;';
        const { rows } = await db.query(query, [userId]);
        return rows[0];
    }

    static async deactivateById(id) {
        const query = 'UPDATE facebook_credentials SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *;';
        const { rows } = await db.query(query, [id]);
        return rows[0];
    }

    static async deleteById(id) {
        const query = 'DELETE FROM facebook_credentials WHERE id = $1 RETURNING *;';
        const { rows } = await db.query(query, [id]);
        return rows[0];
    }

    static async updateWebhookUrl(id, webhookUrl) {
        const query = 'UPDATE facebook_credentials SET webhook_url = $2, updated_at = NOW() WHERE id = $1 RETURNING *;';
        const { rows } = await db.query(query, [id, webhookUrl]);
        return rows[0];
    }
}

module.exports = FacebookCredentials;


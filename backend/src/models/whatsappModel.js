const db = require('../config/db');

const WhatsAppCredentials = {
    // Create or update credentials (multi-account support)
    upsert: async (userId, restaurantId, credentialData) => {
        const {
            access_token,
            phone_number_id,
            whatsapp_business_account_id,
            expires_at,
            phone_number,
            display_phone_number,
            quality_rating,
            status = 'active'
        } = credentialData;

        const query = `
            INSERT INTO whatsapp_credentials (
                user_id, restaurant_id, access_token, phone_number_id, 
                whatsapp_business_account_id, expires_at,
                phone_number, display_phone_number, quality_rating,
                status, is_active, connected_at, last_verified_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, NOW(), NOW())
            ON CONFLICT (phone_number_id) 
            DO UPDATE SET
                access_token = $3,
                whatsapp_business_account_id = $5,
                expires_at = $6,
                phone_number = $7,
                display_phone_number = $8,
                quality_rating = $9,
                status = $10,
                is_active = true,
                last_verified_at = NOW(),
                updated_at = NOW()
            RETURNING *;
        `;

        const values = [
            userId,
            restaurantId,
            access_token,
            phone_number_id,
            whatsapp_business_account_id,
            expires_at,
            phone_number,
            display_phone_number,
            quality_rating,
            status
        ];

        const result = await db.query(query, values);
        return result.rows[0];
    },

    // Get credentials by user ID (backward compatibility - returns first active)
    findByUserId: async (userId) => {
        const query = 'SELECT * FROM whatsapp_credentials WHERE user_id = $1 ORDER BY is_active DESC, connected_at DESC LIMIT 1';
        const result = await db.query(query, [userId]);
        return result.rows[0];
    },

    // Get active credentials (backward compatibility - returns first active)
    findActive: async (userId) => {
        const query = `
            SELECT * FROM whatsapp_credentials 
            WHERE user_id = $1 AND is_active = true
            ORDER BY connected_at DESC
            LIMIT 1
        `;
        const result = await db.query(query, [userId]);
        return result.rows[0];
    },

    // Get all credentials by restaurant ID
    findByRestaurantId: async (restaurantId) => {
        const query = `
            SELECT * FROM whatsapp_credentials 
            WHERE restaurant_id = $1
            ORDER BY is_active DESC, connected_at DESC
        `;
        const result = await db.query(query, [restaurantId]);
        return result.rows;
    },

    // Get all active credentials by restaurant ID
    findAllActiveByRestaurant: async (restaurantId) => {
        const query = `
            SELECT * FROM whatsapp_credentials 
            WHERE restaurant_id = $1 AND is_active = true
            ORDER BY connected_at DESC
        `;
        const result = await db.query(query, [restaurantId]);
        return result.rows;
    },

    // Find by phone number ID (for webhook routing)
    findByPhoneNumberId: async (phoneNumberId) => {
        const query = `
            SELECT wc.*, r.name as restaurant_name, r.id as restaurant_id
            FROM whatsapp_credentials wc
            LEFT JOIN restaurants r ON wc.restaurant_id = r.id
            WHERE wc.phone_number_id = $1 AND wc.is_active = true
        `;
        const result = await db.query(query, [phoneNumberId]);
        return result.rows[0];
    },

    // Find by ID
    findById: async (id) => {
        const query = 'SELECT * FROM whatsapp_credentials WHERE id = $1';
        const result = await db.query(query, [id]);
        return result.rows[0];
    },

    // Deactivate credentials by user ID (backward compatibility)
    deactivate: async (userId) => {
        const query = `
            UPDATE whatsapp_credentials 
            SET is_active = false, updated_at = NOW()
            WHERE user_id = $1
            RETURNING *;
        `;
        const result = await db.query(query, [userId]);
        return result.rows[0];
    },

    // Deactivate specific credential by ID
    deactivateById: async (id) => {
        const query = `
            UPDATE whatsapp_credentials 
            SET is_active = false, updated_at = NOW()
            WHERE id = $1
            RETURNING *;
        `;
        const result = await db.query(query, [id]);
        return result.rows[0];
    },

    // Delete credentials
    delete: async (userId) => {
        const query = 'DELETE FROM whatsapp_credentials WHERE user_id = $1 RETURNING *';
        const result = await db.query(query, [userId]);
        return result.rows[0];
    },

    // Delete by ID
    deleteById: async (id) => {
        const query = 'DELETE FROM whatsapp_credentials WHERE id = $1 RETURNING *';
        const result = await db.query(query, [id]);
        return result.rows[0];
    },

    // Update last verified timestamp
    updateVerified: async (userId) => {
        const query = `
            UPDATE whatsapp_credentials 
            SET last_verified_at = NOW(), updated_at = NOW()
            WHERE user_id = $1
            RETURNING *;
        `;
        const result = await db.query(query, [userId]);
        return result.rows[0];
    },

    // Update webhook URL
    updateWebhookUrl: async (id, webhookUrl) => {
        const query = `
            UPDATE whatsapp_credentials 
            SET webhook_url = $2, updated_at = NOW()
            WHERE id = $1
            RETURNING *;
        `;
        const result = await db.query(query, [id, webhookUrl]);
        return result.rows[0];
    }
};

module.exports = WhatsAppCredentials;

const db = require('../config/db');

const WhatsAppCredentials = {
    // Create or update credentials
    upsert: async (userId, credentialData) => {
        const {
            access_token,
            phone_number_id,
            whatsapp_business_account_id,
            expires_at,
            phone_number,
            display_phone_number,
            quality_rating
        } = credentialData;

        const query = `
            INSERT INTO whatsapp_credentials (
                user_id, access_token, phone_number_id, 
                whatsapp_business_account_id, expires_at,
                phone_number, display_phone_number, quality_rating,
                is_active, connected_at, last_verified_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())
            ON CONFLICT (user_id) 
            DO UPDATE SET
                access_token = $2,
                phone_number_id = $3,
                whatsapp_business_account_id = $4,
                expires_at = $5,
                phone_number = $6,
                display_phone_number = $7,
                quality_rating = $8,
                is_active = true,
                last_verified_at = NOW(),
                updated_at = NOW()
            RETURNING *;
        `;

        const values = [
            userId,
            access_token,
            phone_number_id,
            whatsapp_business_account_id,
            expires_at,
            phone_number,
            display_phone_number,
            quality_rating
        ];

        const result = await db.query(query, values);
        return result.rows[0];
    },

    // Get credentials by user ID
    findByUserId: async (userId) => {
        const query = 'SELECT * FROM whatsapp_credentials WHERE user_id = $1';
        const result = await db.query(query, [userId]);
        return result.rows[0];
    },

    // Get active credentials
    findActive: async (userId) => {
        const query = `
            SELECT * FROM whatsapp_credentials 
            WHERE user_id = $1 AND is_active = true
        `;
        const result = await db.query(query, [userId]);
        return result.rows[0];
    },

    // Deactivate credentials
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

    // Delete credentials
    delete: async (userId) => {
        const query = 'DELETE FROM whatsapp_credentials WHERE user_id = $1 RETURNING *';
        const result = await db.query(query, [userId]);
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
    }
};

module.exports = WhatsAppCredentials;

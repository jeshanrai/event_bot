const db = require('../config/db');

const Restaurant = {
    create: async (data) => {
        const { name, address, contact_number } = data;
        const query = `
            INSERT INTO restaurants (name, address, contact_number)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const values = [name, address || null, contact_number || null];
        const result = await db.query(query, values);
        return result.rows[0];
    },

    findById: async (id) => {
        const query = 'SELECT * FROM restaurants WHERE id = $1';
        const result = await db.query(query, [id]);
        return result.rows[0];
    },

    updateCurrency: async (id, currency) => {
        const query = `
            UPDATE restaurants 
            SET currency = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING *;
        `;
        const result = await db.query(query, [currency, id]);
        return result.rows[0];
    }
};

module.exports = Restaurant;

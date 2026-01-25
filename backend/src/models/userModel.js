const db = require('../config/db');

const User = {
    create: async (user) => {
        const { username, email, password_hash, role, restaurant_id } = user;
        const query = `
      INSERT INTO users (username, email, password_hash, role, restaurant_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, role, restaurant_id, created_at;
    `;
        const values = [username, email, password_hash, role, restaurant_id];
        const result = await db.query(query, values);
        return result.rows[0];
    },

    findByEmail: async (email) => {
        const query = 'SELECT * FROM users WHERE email = $1';
        const result = await db.query(query, [email]);
        return result.rows[0];
    },

    findById: async (id) => {
        const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0];
    },

    findAll: async () => {
        const result = await db.query('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC');
        return result.rows;
    },

    findByRestaurant: async (restaurantId) => {
        const query = `
            SELECT id, username, email, role, created_at 
            FROM users 
            WHERE restaurant_id = $1 AND role = 'staff'
            ORDER BY created_at DESC
        `;
        const result = await db.query(query, [restaurantId]);
        return result.rows;
    }
};

module.exports = User;

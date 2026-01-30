const db = require('../config/db');

const Menu = {
    /**
     * Get all menu items for a restaurant
     */
    findByRestaurantId: async (restaurantId, category = null) => {
        let query = `
            SELECT id, name, description, price, category, image_url, available, created_at, updated_at
            FROM foods
            WHERE restaurant_id = $1
        `;
        const params = [restaurantId];

        if (category) {
            query += ` AND category = $2`;
            params.push(category);
        }

        query += ` ORDER BY category, name`;

        const result = await db.query(query, params);
        return result.rows;
    },

    /**
     * Get unique categories with item counts for a restaurant
     */
    getCategories: async (restaurantId) => {
        const query = `
            SELECT category as name, COUNT(*) as count
            FROM foods
            WHERE restaurant_id = $1
            GROUP BY category
            ORDER BY category
        `;
        const result = await db.query(query, [restaurantId]);
        return result.rows;
    },

    /**
     * Find a single menu item by ID
     */
    findById: async (id) => {
        const query = `
            SELECT id, restaurant_id, name, description, price, category, image_url, available, created_at, updated_at
            FROM foods
            WHERE id = $1
        `;
        const result = await db.query(query, [id]);
        return result.rows[0];
    },

    /**
     * Create a new menu item
     */
    create: async (data) => {
        const { restaurant_id, name, description, price, category, image_url, available = true } = data;
        const query = `
            INSERT INTO foods (restaurant_id, name, description, price, category, image_url, available)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const values = [restaurant_id, name, description, price, category, image_url, available];
        const result = await db.query(query, values);
        return result.rows[0];
    },

    /**
     * Update an existing menu item
     */
    update: async (id, data) => {
        const { name, description, price, category, image_url, available } = data;
        const query = `
            UPDATE foods
            SET name = COALESCE($1, name),
                description = COALESCE($2, description),
                price = COALESCE($3, price),
                category = COALESCE($4, category),
                image_url = COALESCE($5, image_url),
                available = COALESCE($6, available),
                updated_at = NOW()
            WHERE id = $7
            RETURNING *
        `;
        const values = [name, description, price, category, image_url, available, id];
        const result = await db.query(query, values);
        return result.rows[0];
    },

    /**
     * Delete a menu item
     */
    delete: async (id) => {
        const query = `DELETE FROM foods WHERE id = $1 RETURNING *`;
        const result = await db.query(query, [id]);
        return result.rows[0];
    },

    /**
     * Toggle availability of a menu item
     */
    toggleAvailability: async (id, available) => {
        const query = `
            UPDATE foods
            SET available = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING *
        `;
        const result = await db.query(query, [available, id]);
        return result.rows[0];
    }
};

module.exports = Menu;

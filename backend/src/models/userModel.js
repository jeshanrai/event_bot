const db = require("../config/db");

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
    const query = "SELECT * FROM users WHERE email = $1";
    const result = await db.query(query, [email]);
    return result.rows[0];
  },

  findById: async (id) => {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0];
  },

  findAll: async () => {
    const result = await db.query(
      "SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC",
    );
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
  },

  /**
   * Find user by reset token (for password reset)
   * Also checks if token has not expired
   */
  findByResetToken: async (token) => {
    const query = `
            SELECT * FROM users 
            WHERE reset_password_token = $1 
            AND reset_password_expire > NOW()
        `;
    const result = await db.query(query, [token]);
    return result.rows[0];
  },

  /**
   * Update user fields dynamically
   * Used for updating password, reset tokens, etc.
   */
  update: async (id, updateData) => {
    // Build dynamic SET clause
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach((key) => {
      fields.push(`${key} = $${paramCount}`);
      values.push(updateData[key]);
      paramCount++;
    });

    // Add updated_at timestamp
    fields.push(`updated_at = NOW()`);

    // Add id as last parameter
    values.push(id);

    const query = `
            UPDATE users 
            SET ${fields.join(", ")}
            WHERE id = $${paramCount}
            RETURNING id, username, email, role, restaurant_id, updated_at
        `;

    const result = await db.query(query, values);
    return result.rows[0];
  },

  /**
   * Delete user by ID
   */
  delete: async (id) => {
    const query = "DELETE FROM users WHERE id = $1 RETURNING id";
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  // Delete staff/user by ID
  deleteById: async (id) => {
    try {
      const query = `
      DELETE FROM users 
      WHERE id = $1 
      RETURNING id, email, username, role;
    `;

      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },

  // Soft delete (deactivate) - Alternative approach
  deactivate: async (id) => {
    try {
      const query = `
      UPDATE users 
      SET 
        is_active = false,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, email, username, role, is_active;
    `;

      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error("Error deactivating user:", error);
      throw error;
    }
  },

  updateStaff: async (id, updates, currentUserRole) => {
    try {
      // Validate role change (only certain roles can change to certain roles)
      if (updates.role) {
        // Staff can only be staff
        // Restaurant owner can be staff or restaurant_owner
        // Only superadmin can create/update superadmin

        if (updates.role === "superadmin" && currentUserRole !== "superadmin") {
          throw new Error("Only superadmin can set superadmin role");
        }
      }

      // Hash password if being updated
      if (updates.password) {
        const bcrypt = require("bcryptjs");
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(updates.password, salt);
      }

      return await this.updateById(id, updates);
    } catch (error) {
      console.error("Error updating staff:", error);
      throw error;
    }
  },
};

module.exports = User;

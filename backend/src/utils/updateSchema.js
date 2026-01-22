const { pool } = require('../config/db');

const updateSchema = async () => {
    try {
        await pool.query("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
        // Removing 'owner' from the allowed list
        await pool.query("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('superadmin', 'restaurant_owner', 'staff'))");

        // Optional: specific migration to rename existing 'owner' roles to 'restaurant_owner' if data exists
        await pool.query("UPDATE users SET role = 'restaurant_owner' WHERE role = 'owner'");

        console.log("Schema updated successfully: 'owner' role removed/merged to 'restaurant_owner'.");
        process.exit();
    } catch (err) {
        console.error("Error updating schema:", err);
        process.exit(1);
    }
};

updateSchema();

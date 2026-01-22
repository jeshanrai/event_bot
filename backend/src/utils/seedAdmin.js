const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

const seedAdmin = async () => {
    try {
        // Check if admin exists
        const checkQuery = "SELECT * FROM users WHERE role = 'superadmin'";
        const result = await pool.query(checkQuery);

        if (result.rows.length > 0) {
            console.log("SuperAdmin user already exists.");
            process.exit();
        }

        // Create admin
        const username = 'admin';
        const email = 'admin@admin.com';
        const password = 'admin123';
        const role = 'superadmin';

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const insertQuery = `
            INSERT INTO users (username, email, password_hash, role)
            VALUES ($1, $2, $3, $4)
            RETURNING id, username, email, role;
        `;

        const newAdmin = await pool.query(insertQuery, [username, email, password_hash, role]);

        console.log("SuperAdmin created successfully:");
        console.table(newAdmin.rows[0]);
        process.exit();

    } catch (err) {
        console.error("Error seeding admin:", err);
        process.exit(1);
    }
};

seedAdmin();

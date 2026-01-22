const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

async function updateSchemaAndInsertData() {
    const client = await pool.connect();
    try {
        console.log('Updating database schema...');

        // Add new columns to orders table if they don't exist
        await client.query(`
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50),
            ADD COLUMN IF NOT EXISTS special_instructions TEXT,
            ADD COLUMN IF NOT EXISTS payment_verified BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT,
            ADD COLUMN IF NOT EXISTS verified_by INTEGER REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
        `);

        // Update default status to 'pending' instead of 'created'
        await client.query(`
            ALTER TABLE orders 
            ALTER COLUMN status SET DEFAULT 'pending';
        `);

        console.log('✓ Schema updated successfully');

        // Insert test food items
        console.log('\nInserting test food items...');
        await client.query(`
            INSERT INTO foods (name, description, price, category, available) 
            SELECT * FROM (VALUES
                ('Chicken Momo', 'Steamed chicken dumplings', 150, 'Appetizer', true),
                ('Veg Momo', 'Steamed vegetable dumplings', 120, 'Appetizer', true),
                ('Chicken Chowmein', 'Stir-fried noodles with chicken', 180, 'Main Course', true),
                ('Fried Rice', 'Chicken fried rice', 160, 'Main Course', true),
                ('Coke', 'Coca Cola 500ml', 50, 'Beverage', true)
            ) AS v(name, description, price, category, available)
            WHERE NOT EXISTS (
                SELECT 1 FROM foods WHERE foods.name = v.name
            );
        `);
        console.log('✓ Food items inserted');

        // Get food IDs
        const foodsResult = await client.query('SELECT id, name, price FROM foods');
        const foods = {};
        foodsResult.rows.forEach(food => {
            foods[food.name] = { id: food.id, price: food.price };
        });

        console.log('\nInserting test orders...');

        // Order 1: Pending WhatsApp order
        const order1 = await client.query(`
            INSERT INTO orders (user_id, platform, status, service_type, payment_method, total_amount, customer_name, customer_phone, special_instructions, payment_verified)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
        `, ['whatsapp_9841234567', 'whatsapp', 'pending', 'delivery', 'esewa', 300, 'Ram Kumar', '9841234567', 'Extra spicy please', false]);

        await client.query(`
            INSERT INTO order_items (order_id, food_id, quantity, unit_price)
            VALUES ($1, $2, $3, $4)
        `, [order1.rows[0].id, foods['Chicken Momo'].id, 2, foods['Chicken Momo'].price]);
        console.log(`✓ Order #${order1.rows[0].id} created for Ram Kumar`);

        // Order 2: Pending Messenger order
        const order2 = await client.query(`
            INSERT INTO orders (user_id, platform, status, service_type, payment_method, total_amount, customer_name, customer_phone, special_instructions, payment_verified)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
        `, ['messenger_user123', 'messenger', 'pending', 'dine_in', 'cash', 300, 'Sita Sharma', '9851234567', 'No onions', false]);

        await client.query(`INSERT INTO order_items (order_id, food_id, quantity, unit_price) VALUES ($1, $2, $3, $4)`,
            [order2.rows[0].id, foods['Veg Momo'].id, 1, foods['Veg Momo'].price]);
        await client.query(`INSERT INTO order_items (order_id, food_id, quantity, unit_price) VALUES ($1, $2, $3, $4)`,
            [order2.rows[0].id, foods['Chicken Chowmein'].id, 1, foods['Chicken Chowmein'].price]);
        console.log(`✓ Order #${order2.rows[0].id} created for Sita Sharma`);

        // Order 3: Accepted Web order
        const order3 = await client.query(`
            INSERT INTO orders (user_id, platform, status, service_type, payment_method, total_amount, customer_name, customer_phone, payment_verified)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id
        `, ['web_guest456', 'web', 'accepted', 'delivery', 'khalti', 340, 'Hari Prasad', '9861234567', true]);

        await client.query(`INSERT INTO order_items (order_id, food_id, quantity, unit_price) VALUES ($1, $2, $3, $4)`,
            [order3.rows[0].id, foods['Chicken Chowmein'].id, 1, foods['Chicken Chowmein'].price]);
        await client.query(`INSERT INTO order_items (order_id, food_id, quantity, unit_price) VALUES ($1, $2, $3, $4)`,
            [order3.rows[0].id, foods['Fried Rice'].id, 1, foods['Fried Rice'].price]);
        console.log(`✓ Order #${order3.rows[0].id} created for Hari Prasad`);

        // Order 4: Preparing order
        const order4 = await client.query(`
            INSERT INTO orders (user_id, platform, status, service_type, payment_method, total_amount, customer_name, customer_phone, special_instructions, payment_verified)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
        `, ['whatsapp_9871234567', 'whatsapp', 'preparing', 'delivery', 'esewa', 220, 'Gita Devi', '9871234567', 'Less oil', true]);

        await client.query(`INSERT INTO order_items (order_id, food_id, quantity, unit_price) VALUES ($1, $2, $3, $4)`,
            [order4.rows[0].id, foods['Veg Momo'].id, 1, foods['Veg Momo'].price]);
        await client.query(`INSERT INTO order_items (order_id, food_id, quantity, unit_price) VALUES ($1, $2, $3, $4)`,
            [order4.rows[0].id, foods['Coke'].id, 2, foods['Coke'].price]);
        console.log(`✓ Order #${order4.rows[0].id} created for Gita Devi`);

        // Order 5: Ready order
        const order5 = await client.query(`
            INSERT INTO orders (user_id, platform, status, service_type, payment_method, total_amount, customer_name, customer_phone, payment_verified)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id
        `, ['web_guest789', 'web', 'ready', 'dine_in', 'cash', 200, 'Krishna Thapa', '9881234567', true]);

        await client.query(`INSERT INTO order_items (order_id, food_id, quantity, unit_price) VALUES ($1, $2, $3, $4)`,
            [order5.rows[0].id, foods['Chicken Momo'].id, 1, foods['Chicken Momo'].price]);
        await client.query(`INSERT INTO order_items (order_id, food_id, quantity, unit_price) VALUES ($1, $2, $3, $4)`,
            [order5.rows[0].id, foods['Coke'].id, 1, foods['Coke'].price]);
        console.log(`✓ Order #${order5.rows[0].id} created for Krishna Thapa`);

        console.log('\n✅ All test data inserted successfully!');
        console.log('\n📋 Summary:');
        console.log('  - 5 food items added');
        console.log('  - 5 test orders created with different statuses');
        console.log('  - Orders include: 2 pending, 1 accepted, 1 preparing, 1 ready');
        console.log('\n🔄 Refresh the staff panel (http://localhost:5173/staff) to see the orders!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

updateSchemaAndInsertData();

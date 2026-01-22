-- Sample Data for Restaurant Database
-- This script safely inserts sample orders and order items
-- Run this after creating the tables and ensuring foods table has data

-- Clear existing sample data (optional - comment out if you want to keep existing data)
-- DELETE FROM order_items;
-- DELETE FROM orders WHERE user_id LIKE 'user%';

-- Insert sample orders and capture their IDs
DO $$
DECLARE
    order_id_1 INTEGER;
    order_id_2 INTEGER;
    order_id_3 INTEGER;
    order_id_4 INTEGER;
    order_id_5 INTEGER;
    order_id_6 INTEGER;
    order_id_7 INTEGER;
    order_id_8 INTEGER;
    order_id_9 INTEGER;
    order_id_10 INTEGER;
    order_id_11 INTEGER;
    order_id_12 INTEGER;
    order_id_13 INTEGER;
    order_id_14 INTEGER;
    order_id_15 INTEGER;
BEGIN
    -- Order 1: Dine-in (Rajesh Kumar)
    INSERT INTO orders (user_id, platform, status, service_type, delivery_address, payment_method, total_amount, customer_name, customer_phone, special_instructions, payment_verified, created_at)
    VALUES ('user001', 'web', 'pending', 'dine_in', NULL, 'cash', 850.00, 'Rajesh Kumar', '+977-9841234567', 'Extra spicy please', true, NOW() - INTERVAL '5 minutes')
    RETURNING id INTO order_id_1;
    
    INSERT INTO order_items (order_id, food_id, quantity, unit_price) VALUES
    (order_id_1, 1, 2, 200.00),
    (order_id_1, 2, 1, 250.00),
    (order_id_1, 16, 2, 100.00);

    -- Order 2: Dine-in (Sita Sharma)
    INSERT INTO orders (user_id, platform, status, service_type, delivery_address, payment_method, total_amount, customer_name, customer_phone, special_instructions, payment_verified, created_at)
    VALUES ('user002', 'web', 'accepted', 'dine_in', NULL, 'esewa', 1200.00, 'Sita Sharma', '+977-9851234568', 'No onions', true, NOW() - INTERVAL '15 minutes')
    RETURNING id INTO order_id_2;
    
    INSERT INTO order_items (order_id, food_id, quantity, unit_price) VALUES
    (order_id_2, 7, 1, 350.00),
    (order_id_2, 10, 1, 400.00),
    (order_id_2, 19, 1, 150.00);

    -- Order 3: Dine-in (Hari Bahadur)
    INSERT INTO orders (user_id, platform, status, service_type, delivery_address, payment_method, total_amount, customer_name, customer_phone, special_instructions, payment_verified, created_at)
    VALUES ('user003', 'web', 'preparing', 'dine_in', NULL, 'cash', 650.00, 'Hari Bahadur', '+977-9861234569', NULL, true, NOW() - INTERVAL '25 minutes')
    RETURNING id INTO order_id_3;
    
    INSERT INTO order_items (order_id, food_id, quantity, unit_price) VALUES
    (order_id_3, 3, 2, 250.00),
    (order_id_3, 17, 1, 75.00);

    -- Order 4: Dine-in (Maya Gurung)
    INSERT INTO orders (user_id, platform, status, service_type, delivery_address, payment_method, total_amount, customer_name, customer_phone, special_instructions, payment_verified, created_at)
    VALUES ('user004', 'web', 'ready', 'dine_in', NULL, 'khalti', 950.00, 'Maya Gurung', '+977-9871234570', 'Less oil', true, NOW() - INTERVAL '35 minutes')
    RETURNING id INTO order_id_4;
    
    INSERT INTO order_items (order_id, food_id, quantity, unit_price) VALUES
    (order_id_4, 5, 1, 350.00),
    (order_id_4, 13, 1, 300.00),
    (order_id_4, 20, 1, 150.00);

    -- Order 5: Delivery (Bikram Thapa)
    INSERT INTO orders (user_id, platform, status, service_type, delivery_address, payment_method, total_amount, customer_name, customer_phone, special_instructions, payment_verified, created_at)
    VALUES ('user005', 'whatsapp', 'pending', 'delivery', 'Thamel, Kathmandu', 'esewa', 1450.00, 'Bikram Thapa', '+977-9881234571', 'Call before delivery', true, NOW() - INTERVAL '10 minutes')
    RETURNING id INTO order_id_5;
    
    INSERT INTO order_items (order_id, food_id, quantity, unit_price) VALUES
    (order_id_5, 2, 2, 250.00),
    (order_id_5, 8, 1, 400.00),
    (order_id_5, 15, 1, 450.00);

    -- Order 6: Delivery (Anita Rai)
    INSERT INTO orders (user_id, platform, status, service_type, delivery_address, payment_method, total_amount, customer_name, customer_phone, special_instructions, payment_verified, created_at)
    VALUES ('user006', 'whatsapp', 'accepted', 'delivery', 'Lazimpat, Ward 2', 'khalti', 780.00, 'Anita Rai', '+977-9891234572', 'Extra chutney', true, NOW() - INTERVAL '20 minutes')
    RETURNING id INTO order_id_6;
    
    INSERT INTO order_items (order_id, food_id, quantity, unit_price) VALUES
    (order_id_6, 9, 1, 350.00),
    (order_id_6, 16, 2, 100.00),
    (order_id_6, 18, 1, 80.00);

    -- Order 7: Delivery (Suresh Adhikari)
    INSERT INTO orders (user_id, platform, status, service_type, delivery_address, payment_method, total_amount, customer_name, customer_phone, special_instructions, payment_verified, created_at)
    VALUES ('user007', 'web', 'preparing', 'delivery', 'Baneshwor, Near Minbhawan', 'cash', 1100.00, 'Suresh Adhikari', '+977-9801234573', 'Vegetarian only', true, NOW() - INTERVAL '30 minutes')
    RETURNING id INTO order_id_7;
    
    INSERT INTO order_items (order_id, food_id, quantity, unit_price) VALUES
    (order_id_7, 1, 2, 200.00),
    (order_id_7, 7, 1, 350.00),
    (order_id_7, 12, 1, 250.00);

    -- Order 8: Delivery (Pramila Shrestha)
    INSERT INTO orders (user_id, platform, status, service_type, delivery_address, payment_method, total_amount, customer_name, customer_phone, special_instructions, payment_verified, created_at)
    VALUES ('user008', 'whatsapp', 'ready', 'delivery', 'Pulchowk, Lalitpur', 'esewa', 890.00, 'Pramila Shrestha', '+977-9811234574', NULL, true, NOW() - INTERVAL '40 minutes')
    RETURNING id INTO order_id_8;
    
    INSERT INTO order_items (order_id, food_id, quantity, unit_price) VALUES
    (order_id_8, 6, 2, 300.00),
    (order_id_8, 19, 1, 150.00);

    -- Order 9: Delivered (Ramesh Karki)
    INSERT INTO orders (user_id, platform, status, service_type, delivery_address, payment_method, total_amount, customer_name, customer_phone, special_instructions, payment_verified, created_at)
    VALUES ('user009', 'web', 'delivered', 'delivery', 'Baluwatar, House No. 45', 'khalti', 1350.00, 'Ramesh Karki', '+977-9821234575', 'Ring the bell twice', true, NOW() - INTERVAL '1 hour')
    RETURNING id INTO order_id_9;
    
    INSERT INTO order_items (order_id, food_id, quantity, unit_price) VALUES
    (order_id_9, 4, 2, 280.00),
    (order_id_9, 10, 1, 400.00),
    (order_id_9, 15, 1, 450.00);

    -- Order 10: Dine-in (Laxmi Tamang)
    INSERT INTO orders (user_id, platform, status, service_type, delivery_address, payment_method, total_amount, customer_name, customer_phone, special_instructions, payment_verified, created_at)
    VALUES ('user010', 'web', 'pending', 'dine_in', NULL, 'cash', 550.00, 'Laxmi Tamang', '+977-9831234576', NULL, true, NOW() - INTERVAL '2 minutes')
    RETURNING id INTO order_id_10;
    
    INSERT INTO order_items (order_id, food_id, quantity, unit_price) VALUES
    (order_id_10, 1, 2, 200.00),
    (order_id_10, 16, 1, 100.00);

    -- Order 11: Delivery (Dipak Magar)
    INSERT INTO orders (user_id, platform, status, service_type, delivery_address, payment_method, total_amount, customer_name, customer_phone, special_instructions, payment_verified, created_at)
    VALUES ('user011', 'whatsapp', 'pending', 'delivery', 'Koteshwor, Near Mandir', 'esewa', 920.00, 'Dipak Magar', '+977-9841234577', 'Extra plates needed', true, NOW() - INTERVAL '3 minutes')
    RETURNING id INTO order_id_11;
    
    INSERT INTO order_items (order_id, food_id, quantity, unit_price) VALUES
    (order_id_11, 11, 1, 320.00),
    (order_id_11, 13, 1, 300.00),
    (order_id_11, 20, 1, 150.00);

    -- Order 12: Dine-in (Sunita Basnet)
    INSERT INTO orders (user_id, platform, status, service_type, delivery_address, payment_method, total_amount, customer_name, customer_phone, special_instructions, payment_verified, created_at)
    VALUES ('user012', 'web', 'accepted', 'dine_in', NULL, 'khalti', 1150.00, 'Sunita Basnet', '+977-9851234578', 'Mild spice', true, NOW() - INTERVAL '12 minutes')
    RETURNING id INTO order_id_12;
    
    INSERT INTO order_items (order_id, food_id, quantity, unit_price) VALUES
    (order_id_12, 5, 1, 350.00),
    (order_id_12, 8, 1, 400.00),
    (order_id_12, 17, 2, 75.00);

    -- Order 13: Delivery (Krishna Limbu)
    INSERT INTO orders (user_id, platform, status, service_type, delivery_address, payment_method, total_amount, customer_name, customer_phone, special_instructions, payment_verified, created_at)
    VALUES ('user013', 'whatsapp', 'preparing', 'delivery', 'Chabahil, Near Chowk', 'cash', 760.00, 'Krishna Limbu', '+977-9861234579', NULL, true, NOW() - INTERVAL '22 minutes')
    RETURNING id INTO order_id_13;
    
    INSERT INTO order_items (order_id, food_id, quantity, unit_price) VALUES
    (order_id_13, 2, 2, 250.00),
    (order_id_13, 18, 1, 80.00);

    -- Order 14: Delivery (Gita Neupane)
    INSERT INTO orders (user_id, platform, status, service_type, delivery_address, payment_method, total_amount, customer_name, customer_phone, special_instructions, payment_verified, created_at)
    VALUES ('user014', 'web', 'ready', 'delivery', 'Patan Dhoka, Old Building', 'esewa', 1280.00, 'Gita Neupane', '+977-9871234580', 'No MSG please', true, NOW() - INTERVAL '32 minutes')
    RETURNING id INTO order_id_14;
    
    INSERT INTO order_items (order_id, food_id, quantity, unit_price) VALUES
    (order_id_14, 6, 2, 300.00),
    (order_id_14, 10, 1, 400.00),
    (order_id_14, 19, 1, 150.00);

    -- Order 15: Dine-in (Mohan Rana)
    INSERT INTO orders (user_id, platform, status, service_type, delivery_address, payment_method, total_amount, customer_name, customer_phone, special_instructions, payment_verified, created_at)
    VALUES ('user015', 'web', 'pending', 'dine_in', NULL, 'cash', 480.00, 'Mohan Rana', '+977-9881234581', NULL, true, NOW() - INTERVAL '1 minute')
    RETURNING id INTO order_id_15;
    
    INSERT INTO order_items (order_id, food_id, quantity, unit_price) VALUES
    (order_id_15, 3, 1, 250.00),
    (order_id_15, 16, 1, 100.00);

    RAISE NOTICE 'Sample data inserted successfully!';
END $$;

-- Verify the data
SELECT 'Orders inserted:' as info, COUNT(*) as count FROM orders WHERE user_id LIKE 'user%';
SELECT 'Order items for sample orders:' as info, COUNT(*) as count FROM order_items oi 
JOIN orders o ON oi.order_id = o.id WHERE o.user_id LIKE 'user%';

-- Show sample orders
SELECT o.id, o.customer_name, o.service_type, o.status, o.total_amount, 
       (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count
FROM orders o
WHERE o.user_id LIKE 'user%'
ORDER BY o.created_at DESC;

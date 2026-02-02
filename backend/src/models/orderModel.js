const db = require("../config/db");

const Order = {
  // Direct access to db.query for complex queries
  query: async (text, params) => {
    return await db.query(text, params);
  },

  create: async (orderRequest) => {
    // Transactional order creation
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      const { user_id, items, ...orderData } = orderRequest;
      const {
        service_type,
        payment_method,
        total_amount,
        platform,
        restaurant_id,
      } = orderData;

      // 1. Create Order
      // Note: user_id input is mapped to customer_platform_id
      const orderQuery = `
              INSERT INTO orders (customer_platform_id, restaurant_id, platform, status, service_type, payment_method, total_amount)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
              RETURNING *;
          `;
      // Default restaurant_id to 1 if not provided (for now)
      const targetRestaurantId = restaurant_id || 1;
      const orderValues = [
        user_id,
        targetRestaurantId,
        platform || "whatsapp",
        "created",
        service_type || "dine_in",
        payment_method,
        total_amount,
      ];
      const orderResult = await client.query(orderQuery, orderValues);
      const newOrder = orderResult.rows[0];

      // 2. Create Order Items
      const itemQuery = `
              INSERT INTO order_items (order_id, food_id, quantity, unit_price)
              VALUES ($1, $2, $3, $4)
          `;

      for (const item of items) {
        await client.query(itemQuery, [
          newOrder.id,
          item.food_id,
          item.quantity,
          item.unit_price,
        ]);
      }

      await client.query("COMMIT");
      return newOrder;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  },

  getStats: async () => {
    const today = new Date().toISOString().split("T")[0];

    const revenueQuery = `SELECT SUM(total_amount) as total FROM orders WHERE DATE(created_at) = DATE(NOW())`;
    const countQuery = `SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = DATE(NOW())`;
    const pendingQuery = `SELECT COUNT(*) as count FROM orders WHERE status IN ('created', 'confirmed', 'preparing')`;
    // AI handling is hardcoded for now or requires specific field logic

    const [revenueRes, countRes, pendingRes] = await Promise.all([
      db.query(revenueQuery),
      db.query(countQuery),
      db.query(pendingQuery),
    ]);

    return {
      revenueToday: revenueRes.rows[0].total || 0,
      todaysOrders: countRes.rows[0].count || 0,
      pendingOrders: pendingRes.rows[0].count || 0,
    };
  },

  updateStatus: async (orderId, status, userId) => {
    const query = `
            UPDATE orders 
            SET status = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING *;
        `;
    const result = await db.query(query, [status, orderId]);
    return result.rows[0];
  },

  findByDateRange: async (startDate, endDate, status = null) => {
    let query = `
            SELECT o.*, 
                   COALESCE(
                       json_agg(
                           json_build_object(
                               'id', oi.id,
                               'food_id', oi.food_id,
                               'quantity', oi.quantity,
                               'unit_price', oi.unit_price,
                               'food_name', f.name,
                               'image_url', f.image_url
                           )
                       ) FILTER (WHERE oi.id IS NOT NULL),
                       '[]'
                   ) as items,
                   u.username as verified_by_name
            FROM orders o 
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN foods f ON oi.food_id = f.id
            LEFT JOIN users u ON o.verified_by = u.id
            WHERE o.created_at >= $1 AND o.created_at <= $2
        `;

    const params = [startDate, endDate];

    if (status) {
      query += ` AND o.status = $3`;
      params.push(status);
    }

    query += ` GROUP BY o.id, u.username ORDER BY o.created_at DESC`;

    const result = await db.query(query, params);
    return result.rows;
  },

  verifyPayment: async (orderId, verified, userId, reason = null) => {
    const query = `
            UPDATE orders 
            SET payment_verified = $1, 
                verified_by = $2, 
                verified_at = NOW(),
                rejection_reason = $3,
                updated_at = NOW()
            WHERE id = $4
            RETURNING *;
        `;
    const result = await db.query(query, [verified, userId, reason, orderId]);
    return result.rows[0];
  },

  findPending: async () => {
    const query = `
            SELECT o.*, 
                   COALESCE(
                       json_agg(
                           json_build_object(
                               'id', oi.id,
                               'food_id', oi.food_id,
                               'quantity', oi.quantity,
                               'unit_price', oi.unit_price,
                               'food_name', f.name,
                               'image_url', f.image_url
                           )
                       ) FILTER (WHERE oi.id IS NOT NULL),
                       '[]'
                   ) as items
            FROM orders o 
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN foods f ON oi.food_id = f.id
            WHERE o.status IN ('created', 'confirmed', 'preparing')
            GROUP BY o.id
            ORDER BY o.created_at ASC;
        `;
    const result = await db.query(query);
    return result.rows;
  },
};

module.exports = Order;

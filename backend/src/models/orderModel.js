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

  getStats: async (restaurantId = null) => {
    const restaurantFilter = restaurantId ? "AND restaurant_id = $1" : "";
    const params = restaurantId ? [restaurantId] : [];

    // Query 1: Revenue metrics
    const revenueQuery = `
    SELECT 
      -- Today
      COALESCE(SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN total_amount END), 0) as revenue_today,
      COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as orders_today,
      
      -- Yesterday
      COALESCE(SUM(CASE WHEN DATE(created_at) = CURRENT_DATE - 1 THEN total_amount END), 0) as revenue_yesterday,
      
      -- This Week
      COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('week', CURRENT_DATE) THEN total_amount END), 0) as revenue_week,
      
      -- This Month
      COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN total_amount END), 0) as revenue_month
      
    FROM orders
    WHERE status NOT IN ('cancelled')
    ${restaurantFilter}
  `;

    // Query 2: Order status breakdown
    const statusQuery = `
    SELECT 
      status,
      COUNT(*) as count
    FROM orders
    WHERE DATE(created_at) = CURRENT_DATE
    ${restaurantFilter}
    GROUP BY status
  `;

    // Query 3: Current queue
    const queueQuery = `
    SELECT 
      COUNT(*) as queue_length,
      COALESCE(ROUND(AVG(preparation_time_minutes)), 0) as avg_wait_time
    FROM orders
    WHERE status IN ('confirmed', 'preparing')
    ${restaurantFilter}
  `;

    // Query 4: Kitchen performance
    const performanceQuery = `
    SELECT 
      COALESCE(ROUND(AVG(
        EXTRACT(EPOCH FROM (actual_ready_time - created_at))/60
      )::numeric, 1), 0) as avg_prep_minutes
    FROM orders
    WHERE status IN ('ready', 'completed')
      AND actual_ready_time IS NOT NULL
      AND DATE(created_at) = CURRENT_DATE
    ${restaurantFilter}
  `;

    // Query 5: Platform breakdown
    const platformQuery = `
    SELECT 
      platform,
      COUNT(*) as count
    FROM orders
    WHERE DATE(created_at) = CURRENT_DATE
    ${restaurantFilter}
    GROUP BY platform
  `;

    // Execute all queries
    const [revenueRes, statusRes, queueRes, performanceRes, platformRes] =
      await Promise.all([
        db.query(revenueQuery, params),
        db.query(statusQuery, params),
        db.query(queueQuery, params),
        db.query(performanceQuery, params),
        db.query(platformQuery, params),
      ]);

    // Format status breakdown
    const ordersByStatus = statusRes.rows.reduce(
      (acc, row) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      },
      {
        created: 0,
        confirmed: 0,
        preparing: 0,
        ready: 0,
        completed: 0,
        cancelled: 0,
      },
    );

    // Format platform breakdown
    const ordersByPlatform = platformRes.rows.reduce(
      (acc, row) => {
        acc[row.platform] = parseInt(row.count);
        return acc;
      },
      {
        whatsapp: 0,
        messenger: 0,
        web: 0,
      },
    );

    const revenue = revenueRes.rows[0];
    const queue = queueRes.rows[0];
    const performance = performanceRes.rows[0];

    return {
      // Revenue metrics
      revenue: {
        today: parseFloat(revenue.revenue_today) || 0,
        yesterday: parseFloat(revenue.revenue_yesterday) || 0,
        week: parseFloat(revenue.revenue_week) || 0,
        month: parseFloat(revenue.revenue_month) || 0,
        growth:
          revenue.revenue_yesterday > 0
            ? (
                ((revenue.revenue_today - revenue.revenue_yesterday) /
                  revenue.revenue_yesterday) *
                100
              ).toFixed(1)
            : 0,
      },

      // Order metrics
      orders: {
        today: parseInt(revenue.orders_today) || 0,
        byStatus: ordersByStatus,
        byPlatform: ordersByPlatform,
        avgValue:
          revenue.orders_today > 0
            ? (revenue.revenue_today / revenue.orders_today).toFixed(2)
            : 0,
      },

      // Kitchen metrics
      kitchen: {
        queueLength: parseInt(queue.queue_length) || 0,
        avgWaitTime: parseInt(queue.avg_wait_time) || 0,
        avgPrepTime: parseFloat(performance.avg_prep_minutes) || 0,
      },
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
                   LPAD((o.id % 10000)::text, 4, '0') as token,
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

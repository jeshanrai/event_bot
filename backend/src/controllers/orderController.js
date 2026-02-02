const Order = require("../models/orderModel");

const createOrder = async (req, res) => {
  try {
    const order = await Order.create({
      ...req.body,
      user_id: req.user ? req.user.id : "guest",
    });
    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating order" });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const stats = await Order.getStats();
    // Add hardcoded values for now for missing metrics
    res.json({
      ...stats,
      aiHandledPercentage: 85,
      totalCustomers: 120, // This should come from DB eventually
      avgOrderValue:
        stats.todaysOrders > 0
          ? Math.round(stats.revenueToday / stats.todaysOrders)
          : 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching stats" });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user ? req.user.id : null;

    const validStatuses = [
      "created",
      "confirmed",
      "preparing",
      "ready",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.updateStatus(id, status, userId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating order status" });
  }
};

const getOrderHistory = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    // Default to last 30 days if no dates provided
    const end = endDate || new Date().toISOString();
    const start =
      startDate ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const orders = await Order.findByDateRange(start, end, status);
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching order history" });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { verified, reason } = req.body;
    const userId = req.user ? req.user.id : null;

    const order = await Order.verifyPayment(id, verified, userId, reason);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error verifying payment" });
  }
};

/**
 * Get orders with pagination and filtering
 * @route   GET /api/orders
 * @access  Private (restaurant_owner, staff, superadmin)
 */
const getOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate,
      restaurant_id,
      platform,
      service_type,
      payment_verified,
      sort = "created_at",
      order = "DESC",
    } = req.query;

    // Parse pagination parameters
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Validate pagination parameters
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        message:
          "Invalid pagination parameters. Page must be >= 1 and limit must be between 1 and 100.",
      });
    }

    // Validate sort field
    const validSortFields = ["created_at", "total_amount", "status", "id"];
    const sortField = validSortFields.includes(sort) ? sort : "created_at";

    // Validate order direction
    const orderDirection = order.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // Build query
    let whereClause = [];
    let params = [];
    let paramCount = 1;

    // Filter by status (can be multiple, comma-separated)
    if (status) {
      const statusArray = status.split(",").map((s) => s.trim());
      const statusPlaceholders = statusArray
        .map((_, i) => `$${paramCount + i}`)
        .join(", ");
      whereClause.push(`o.status IN (${statusPlaceholders})`);
      params.push(...statusArray);
      paramCount += statusArray.length;
    }

    // Filter by date range
    if (startDate) {
      whereClause.push(`o.created_at >= $${paramCount}`);
      params.push(startDate);
      paramCount++;
    }
    if (endDate) {
      whereClause.push(`o.created_at <= $${paramCount}`);
      params.push(endDate);
      paramCount++;
    }

    // Filter by restaurant
    if (restaurant_id) {
      whereClause.push(`o.restaurant_id = $${paramCount}`);
      params.push(restaurant_id);
      paramCount++;
    }

    // Filter by platform
    if (platform) {
      whereClause.push(`o.platform = $${paramCount}`);
      params.push(platform);
      paramCount++;
    }

    // Filter by service type
    if (service_type) {
      whereClause.push(`o.service_type = $${paramCount}`);
      params.push(service_type);
      paramCount++;
    }

    // Filter by payment verification status
    if (payment_verified !== undefined) {
      whereClause.push(`o.payment_verified = $${paramCount}`);
      params.push(payment_verified === "true");
      paramCount++;
    }

    const whereSQL =
      whereClause.length > 0 ? `WHERE ${whereClause.join(" AND ")}` : "";

    // Count total matching records
    const countQuery = `
            SELECT COUNT(*) as total
            FROM orders o
            ${whereSQL}
        `;
    const countResult = await Order.query(countQuery, params);
    const totalOrders = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(totalOrders / limitNum);

    // Get paginated orders
    const ordersQuery = `
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
                   u.username as verified_by_name,
                   r.name as restaurant_name
            FROM orders o 
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN foods f ON oi.food_id = f.id
            LEFT JOIN users u ON o.verified_by = u.id
            LEFT JOIN restaurants r ON o.restaurant_id = r.id
            ${whereSQL}
            GROUP BY o.id, u.username, r.name
            ORDER BY o.${sortField} ${orderDirection}
            LIMIT $${paramCount} OFFSET $${paramCount + 1}
        `;

    params.push(limitNum, offset);
    const ordersResult = await Order.query(ordersQuery, params);

    res.json({
      success: true,
      data: ordersResult.rows,
      pagination: {
        currentPage: pageNum,
        totalPages: totalPages,
        totalOrders: totalOrders,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      filters: {
        status: status || null,
        startDate: startDate || null,
        endDate: endDate || null,
        restaurant_id: restaurant_id || null,
        platform: platform || null,
        service_type: service_type || null,
        payment_verified: payment_verified || null,
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Error fetching orders" });
  }
};

module.exports = {
  createOrder,
  getDashboardStats,
  updateOrderStatus,
  getOrderHistory,
  verifyPayment,
  getOrders,
};

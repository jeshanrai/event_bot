const db = require('../config/db');

// @desc    Get dashboard KPI data
// @route   GET /api/superadmin/dashboard
// @access  Private/Superadmin
const getDashboardKPIs = async (req, res) => {
    try {
        // Total users by role
        const usersResult = await db.query(
            'SELECT role, COUNT(*) as count FROM users GROUP BY role'
        );

        // Total orders and statistics
        const ordersResult = await db.query(`
            SELECT 
                COUNT(*) as total_orders,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_orders,
                SUM(total_amount) as total_revenue,
                AVG(total_amount) as avg_order_value
            FROM orders
            WHERE created_at >= NOW() - INTERVAL '30 days'
        `);

        // Orders by platform today
        const platformResult = await db.query(`
            SELECT 
                platform,
                COUNT(*) as count
            FROM orders
            WHERE DATE(created_at) = CURRENT_DATE
            GROUP BY platform
        `);

        // Orders by status
        const statusResult = await db.query(`
            SELECT 
                status,
                COUNT(*) as count
            FROM orders
            GROUP BY status
        `);

        // Daily order trend (last 7 days)
        const trendResult = await db.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as orders,
                SUM(total_amount) as revenue
            FROM orders
            WHERE created_at >= NOW() - INTERVAL '7 days'
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        const roleMap = {};
        usersResult.rows.forEach(row => {
            roleMap[row.role] = parseInt(row.count);
        });

        const platformMap = {};
        platformResult.rows.forEach(row => {
            platformMap[row.platform] = parseInt(row.count);
        });

        const statusMap = {};
        statusResult.rows.forEach(row => {
            statusMap[row.status] = parseInt(row.count);
        });

        res.json({
            kpis: {
                totalUsers: usersResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
                restaurantOwners: roleMap.restaurant_owner || 0,
                staffMembers: roleMap.staff || 0,
                totalOrders: parseInt(ordersResult.rows[0]?.total_orders || 0),
                completedOrders: parseInt(ordersResult.rows[0]?.completed_orders || 0),
                rejectedOrders: parseInt(ordersResult.rows[0]?.rejected_orders || 0),
                totalRevenue: parseFloat(ordersResult.rows[0]?.total_revenue || 0),
                avgOrderValue: parseFloat(ordersResult.rows[0]?.avg_order_value || 0),
                todayOrders: platformResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0)
            },
            platformBreakdown: platformMap,
            statusBreakdown: statusMap,
            dailyTrend: trendResult.rows.map(row => ({
                date: row.date,
                orders: parseInt(row.orders),
                revenue: parseFloat(row.revenue)
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching dashboard KPIs', error: error.message });
    }
};

// @desc    Get all users with filtering
// @route   GET /api/superadmin/users
// @access  Private/Superadmin
const getAllUsers = async (req, res) => {
    try {
        const { role, search, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM users WHERE 1=1';
        const values = [];

        if (role) {
            query += ' AND role = $' + (values.length + 1);
            values.push(role);
        }

        if (search) {
            query += ' AND (username ILIKE $' + (values.length + 1) + ' OR email ILIKE $' + (values.length + 2) + ')';
            values.push(`%${search}%`, `%${search}%`);
        }

        // Get total count
        const countResult = await db.query(
            query.replace('SELECT *', 'SELECT COUNT(*) as count'),
            values
        );

        // Get paginated results
        query += ' ORDER BY created_at DESC LIMIT $' + (values.length + 1) + ' OFFSET $' + (values.length + 2);
        values.push(limit, offset);

        const result = await db.query(query, values);

        res.json({
            users: result.rows,
            total: parseInt(countResult.rows[0].count),
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

// @desc    Get all orders with filtering and pagination
// @route   GET /api/superadmin/orders
// @access  Private/Superadmin
const getAllOrders = async (req, res) => {
    try {
        const { status, platform, search, page = 1, limit = 15 } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM orders WHERE 1=1';
        const values = [];

        if (status) {
            query += ' AND status = $' + (values.length + 1);
            values.push(status);
        }

        if (platform) {
            query += ' AND platform = $' + (values.length + 1);
            values.push(platform);
        }

        if (search) {
            query += ' AND (customer_name ILIKE $' + (values.length + 1) + ' OR customer_phone ILIKE $' + (values.length + 2) + ' OR customer_id ILIKE $' + (values.length + 3) + ')';
            values.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const countResult = await db.query(
            query.replace('SELECT *', 'SELECT COUNT(*) as count'),
            values
        );

        query += ' ORDER BY created_at DESC LIMIT $' + (values.length + 1) + ' OFFSET $' + (values.length + 2);
        values.push(limit, offset);

        const result = await db.query(query, values);

        res.json({
            orders: result.rows,
            total: parseInt(countResult.rows[0].count),
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
};

// @desc    Get order details with items
// @route   GET /api/superadmin/orders/:orderId
// @access  Private/Superadmin
const getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;

        const orderResult = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const itemsResult = await db.query(
            'SELECT oi.*, f.name, f.category FROM order_items oi LEFT JOIN foods f ON oi.food_id = f.id WHERE oi.order_id = $1',
            [orderId]
        );

        res.json({
            order: orderResult.rows[0],
            items: itemsResult.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching order details', error: error.message });
    }
};

// @desc    Update order status
// @route   PUT /api/superadmin/orders/:orderId
// @access  Private/Superadmin
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, rejectionReason } = req.body;

        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }

        let query = 'UPDATE orders SET status = $1, updated_at = NOW()';
        const values = [status, orderId];
        let paramIndex = 2;

        if (rejectionReason) {
            query += `, rejection_reason = $${++paramIndex}`;
            values.splice(paramIndex - 1, 0, rejectionReason);
        }

        query += ` WHERE id = $${++paramIndex}`;
        values.push(orderId);

        const result = await db.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({ message: 'Order status updated', order: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating order', error: error.message });
    }
};

// @desc    Get AI usage analytics
// @route   GET /api/superadmin/ai-usage
// @access  Private/Superadmin
const getAIUsage = async (req, res) => {
    try {
        const days = req.query.days || 7;

        // Disable caching for this endpoint
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');

        // First, get total count from all records
        const debugTotalQuery = `
            SELECT 
                COUNT(*) as record_count,
                SUM(llm_call_count) as total_all_calls
            FROM ai_usage_stats;
        `;

        // Get stats grouped by platform and date
        const statsQuery = `
            SELECT 
                platform,
                DATE(created_at) as date,
                SUM(llm_call_count) as total_calls
            FROM ai_usage_stats
            WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '${days - 1} days'
            GROUP BY platform, DATE(created_at)
            ORDER BY DATE(created_at) DESC, platform;
        `;

        // Get platform breakdown
        const platformQuery = `
            SELECT 
                platform,
                SUM(llm_call_count) as total_calls,
                COUNT(DISTINCT DATE(created_at)) as days_active,
                MAX(updated_at) as last_used
            FROM ai_usage_stats
            WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '${days - 1} days'
            GROUP BY platform
            ORDER BY total_calls DESC;
        `;

        // Get total calls within date range
        const totalQuery = `
            SELECT 
                SUM(llm_call_count) as total_calls,
                COUNT(*) as record_count
            FROM ai_usage_stats
            WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '${days - 1} days';
        `;

        const [debugResult, statsResult, platformResult, totalResult] = await Promise.all([
            db.query(debugTotalQuery),
            db.query(statsQuery),
            db.query(platformQuery),
            db.query(totalQuery)
        ]);

        // Format daily data for charts
        const dailyData = {};
        statsResult.rows.forEach(row => {
            const date = new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!dailyData[date]) {
                dailyData[date] = { date: row.date, platforms: {} };
            }
            dailyData[date].platforms[row.platform] = parseInt(row.total_calls) || 0;
        });

        const responseData = {
            totalCalls: parseInt(totalResult.rows[0]?.total_calls) || 0,
            days,
            platformUsage: platformResult.rows.map(p => ({
                platform: p.platform,
                total_calls: parseInt(p.total_calls) || 0,
                days_active: parseInt(p.days_active) || 0,
                last_used: p.last_used
            })),
            dailyBreakdown: Object.values(dailyData).reverse()
        };

        res.status(200).json({
            success: true,
            data: responseData
        });
    } catch (error) {
        console.error('[getAIUsage] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching AI usage statistics',
            error: error.message
        });
    }
};

// @desc    Get reservations data
// @route   GET /api/superadmin/reservations
// @access  Private/Superadmin
const getReservations = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM reservations WHERE 1=1';
        const values = [];

        if (status) {
            query += ' AND status = $' + (values.length + 1);
            values.push(status);
        }

        const countResult = await db.query(
            query.replace('SELECT *', 'SELECT COUNT(*) as count'),
            values
        );

        query += ' ORDER BY reservation_date DESC, reservation_time DESC LIMIT $' + (values.length + 1) + ' OFFSET $' + (values.length + 2);
        values.push(limit, offset);

        const result = await db.query(query, values);

        res.json({
            reservations: result.rows,
            total: parseInt(countResult.rows[0].count),
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching reservations', error: error.message });
    }
};

// @desc    Get revenue analytics
// @route   GET /api/superadmin/revenue
// @access  Private/Superadmin
const getRevenueAnalytics = async (req, res) => {
    try {
        // Monthly revenue
        const monthlyRevenue = await db.query(`
            SELECT 
                DATE_TRUNC('month', created_at)::DATE as month,
                SUM(total_amount) as revenue,
                COUNT(*) as orders
            FROM orders
            WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '12 months'
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY month DESC
        `);

        // Revenue by payment method
        const paymentMethodRevenue = await db.query(`
            SELECT 
                payment_method,
                SUM(total_amount) as revenue,
                COUNT(*) as orders
            FROM orders
            WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '30 days'
            GROUP BY payment_method
        `);

        // Revenue by service type
        const serviceTypeRevenue = await db.query(`
            SELECT 
                service_type,
                SUM(total_amount) as revenue,
                COUNT(*) as orders
            FROM orders
            WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '30 days'
            GROUP BY service_type
        `);

        res.json({
            monthlyRevenue: monthlyRevenue.rows.map(row => ({
                month: row.month,
                revenue: parseFloat(row.revenue),
                orders: parseInt(row.orders)
            })),
            paymentMethodRevenue: paymentMethodRevenue.rows.map(row => ({
                method: row.payment_method,
                revenue: parseFloat(row.revenue),
                orders: parseInt(row.orders)
            })),
            serviceTypeRevenue: serviceTypeRevenue.rows.map(row => ({
                type: row.service_type,
                revenue: parseFloat(row.revenue),
                orders: parseInt(row.orders)
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching revenue analytics', error: error.message });
    }
};

// @desc    Get user statistics
// @route   GET /api/superadmin/user-stats
// @access  Private/Superadmin
const getUserStats = async (req, res) => {
    try {
        // Users by role
        const usersByRole = await db.query(`
            SELECT role, COUNT(*) as count FROM users GROUP BY role
        `);

        // New users this month
        const newUsersMonth = await db.query(`
            SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL '30 days'
        `);

        // Active users (placed order in last 7 days)
        const activeUsers = await db.query(`
            SELECT COUNT(DISTINCT customer_id) as count FROM orders WHERE created_at >= NOW() - INTERVAL '7 days'
        `);

        // User registration trend (last 30 days)
        const userTrend = await db.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as new_users
            FROM users
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        res.json({
            usersByRole: usersByRole.rows,
            newUsersMonth: parseInt(newUsersMonth.rows[0]?.count || 0),
            activeUsers: parseInt(activeUsers.rows[0]?.count || 0),
            userTrend: userTrend.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching user statistics', error: error.message });
    }
};

module.exports = {
    getDashboardKPIs,
    getAllUsers,
    getAllOrders,
    getOrderDetails,
    updateOrderStatus,
    getAIUsage,
    getReservations,
    getRevenueAnalytics,
    getUserStats
};

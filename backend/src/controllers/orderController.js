const Order = require('../models/orderModel');

const createOrder = async (req, res) => {
    try {
        const order = await Order.create({ ...req.body, user_id: req.user ? req.user.id : 'guest' });
        res.status(201).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating order' });
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
            avgOrderValue: stats.todaysOrders > 0 ? Math.round(stats.revenueToday / stats.todaysOrders) : 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching stats' });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user ? req.user.id : null;

        const validStatuses = ['pending', 'accepted', 'preparing', 'ready', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const order = await Order.updateStatus(id, status, userId);
        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating order status' });
    }
};

const getOrderHistory = async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;

        // Default to last 30 days if no dates provided
        const end = endDate || new Date().toISOString();
        const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const orders = await Order.findByDateRange(start, end, status);
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching order history' });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { verified, reason } = req.body;
        const userId = req.user ? req.user.id : null;

        const order = await Order.verifyPayment(id, verified, userId, reason);
        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error verifying payment' });
    }
};

const getPendingOrders = async (req, res) => {
    try {
        const orders = await Order.findPending();
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching pending orders' });
    }
};


module.exports = { createOrder, getDashboardStats, updateOrderStatus, getOrderHistory, verifyPayment, getPendingOrders };


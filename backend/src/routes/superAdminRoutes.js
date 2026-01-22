const express = require('express');
const router = express.Router();
const {
    getDashboardKPIs,
    getAllUsers,
    getAllOrders,
    getOrderDetails,
    updateOrderStatus,
    getAIUsage,
    getReservations,
    getRevenueAnalytics,
    getUserStats
} = require('../controllers/superAdminController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All routes require superadmin authorization
router.use(protect, authorize('superadmin'));

// Dashboard & Analytics
router.get('/dashboard', getDashboardKPIs);
router.get('/user-stats', getUserStats);
router.get('/ai-usage', getAIUsage);
router.get('/revenue', getRevenueAnalytics);

// Users Management
router.get('/users', getAllUsers);

// Orders Management
router.get('/orders', getAllOrders);
router.get('/orders/:orderId', getOrderDetails);
router.put('/orders/:orderId', updateOrderStatus);

// Reservations
router.get('/reservations', getReservations);

module.exports = router;

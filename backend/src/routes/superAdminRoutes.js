const express = require('express');
const router = express.Router();
const {
    getDashboardKPIs,
    getAllUsers,
    getAllOrders,
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

// Reservations
router.get('/reservations', getReservations);

module.exports = router;

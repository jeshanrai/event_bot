const express = require('express');
const router = express.Router();
const { createOrder, getDashboardStats, updateOrderStatus, getOrderHistory, verifyPayment, getPendingOrders } = require('../controllers/orderController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.post('/', createOrder); // Public for now to allow web widget usage, or protect if needed

router.get('/stats', protect, authorize('restaurant_owner', 'superadmin'), getDashboardStats);
router.get('/history', protect, authorize('restaurant_owner', 'staff', 'superadmin'), getOrderHistory);
router.get('/pending', protect, authorize('restaurant_owner', 'staff', 'superadmin'), getPendingOrders);
router.patch('/:id/status', protect, authorize('restaurant_owner', 'staff', 'superadmin'), updateOrderStatus);
router.patch('/:id/verify-payment', protect, authorize('restaurant_owner', 'staff', 'superadmin'), verifyPayment);

module.exports = router;

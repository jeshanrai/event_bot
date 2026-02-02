const express = require("express");
const router = express.Router();
const {
  createOrder,
  getDashboardStats,
  updateOrderStatus,
  getOrderHistory,
  verifyPayment,
  getOrders,
} = require("../controllers/orderController");
const { protect, authorize } = require("../middlewares/authMiddleware");

// Public route for creating orders (for web widget)
router.post("/", createOrder);

// Protected routes - require authentication
router.get(
  "/stats",
  protect,
  authorize("restaurant_owner", "superadmin"),
  getDashboardStats,
);
router.get(
  "/history",
  protect,
  authorize("restaurant_owner", "staff", "superadmin"),
  getOrderHistory,
);

// New paginated and filterable orders endpoint (replaces /pending)
router.get(
  "/",
  protect,
  authorize("restaurant_owner", "staff", "superadmin"),
  getOrders,
);

router.patch(
  "/:id/status",
  protect,
  authorize("restaurant_owner", "staff", "superadmin"),
  updateOrderStatus,
);
router.patch(
  "/:id/verify-payment",
  protect,
  authorize("restaurant_owner", "staff", "superadmin"),
  verifyPayment,
);

module.exports = router;

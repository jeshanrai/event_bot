const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  registerStaff,
  forgotPassword,
  resetPassword,
  changePassword,
} = require("../controllers/authController");
const { protect, authorize } = require("../middlewares/authMiddleware");

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:resetToken", resetPassword);

// Protected routes
router.post(
  "/register-staff",
  protect,
  authorize("restaurant_owner"),
  registerStaff,
);
router.put("/change-password", protect, changePassword);

module.exports = router;

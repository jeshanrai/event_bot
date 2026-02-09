const express = require("express");
const router = express.Router();
const {
  getSettings,
  updateSettings,
  getStaff,
} = require("../controllers/restaurantController");
const {
  deactivateStaff,
  reactivateStaff,
  deleteStaff,
  updateStaff,
} = require("../controllers/userController");
const { protect, authorize } = require("../middlewares/authMiddleware");

// All routes here are protected and require 'restaurant_owner' role
router.use(protect);
router.use(authorize("restaurant_owner"));

router.get("/settings", getSettings);
router.put("/settings", updateSettings);
router.get("/staff", getStaff);

router.put(
  "/staff/:id",
  protect,
  authorize("restaurant_owner", "superadmin"),
  updateStaff,
);

router.delete(
  "/staff/:id",
  protect,
  authorize("restaurant_owner", "superadmin"),
  deleteStaff,
);

router.patch(
  "/staff/:id/deactivate",
  protect,
  authorize("restaurant_owner", "superadmin"),
  deactivateStaff,
);

router.patch(
  "/staff/:id/reactivate",
  protect,
  authorize("restaurant_owner", "superadmin"),
  reactivateStaff,
);

module.exports = router;

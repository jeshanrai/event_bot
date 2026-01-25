const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, getStaff } = require('../controllers/restaurantController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All routes here are protected and require 'restaurant_owner' role
router.use(protect);
router.use(authorize('restaurant_owner'));

router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.get('/staff', getStaff);

module.exports = router;

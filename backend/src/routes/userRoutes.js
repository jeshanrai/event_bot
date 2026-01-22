const express = require('express');
const router = express.Router();
const { getUserProfile, getUsers } = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/profile', protect, getUserProfile);
router.get('/', protect, authorize('superadmin'), getUsers);

module.exports = router;

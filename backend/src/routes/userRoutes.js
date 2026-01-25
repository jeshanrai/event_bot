const express = require('express');
const router = express.Router();
const { getUserProfile } = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/profile', protect, getUserProfile);


module.exports = router;

const express = require('express');
const router = express.Router();
const { registerUser, loginUser, registerStaff } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);

const { protect, authorize } = require('../middlewares/authMiddleware');
router.post('/register-staff', protect, authorize('restaurant_owner'), registerStaff);

module.exports = router;

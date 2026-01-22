const express = require('express');
const router = express.Router();
const {
    connectFacebookPage,
    getFacebookStatus,
    disconnectFacebookPage
} = require('../controllers/facebookController');
const { protect } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(protect);

// @route   POST /api/facebook/connect
// @desc    Connect a Facebook Page
// @access  Private
router.post('/connect', connectFacebookPage);

// @route   GET /api/facebook/status
// @desc    Get Facebook Page connection status
// @access  Private
router.get('/status', getFacebookStatus);

// @route   POST /api/facebook/disconnect
// @desc    Disconnect Facebook Page
// @access  Private
router.post('/disconnect', disconnectFacebookPage);

module.exports = router;

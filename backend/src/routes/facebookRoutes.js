const express = require('express');
const router = express.Router();
const {
    connectFacebookPage,
    getFacebookStatus,
    listFacebookPages,
    disconnectFacebookPage,
    disconnectFacebookPageById
} = require('../controllers/facebookController');
const { protect } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(protect);

// @route   POST /api/facebook/connect
// @desc    Connect a Facebook Page
// @access  Private
router.post('/connect', connectFacebookPage);

// @route   GET /api/facebook/status
// @desc    Get Facebook Page connection status (legacy/primary)
// @access  Private
router.get('/status', getFacebookStatus);

// @route   GET /api/facebook/pages
// @desc    List all connected Facebook pages
// @access  Private
router.get('/pages', listFacebookPages);

// @route   POST /api/facebook/disconnect
// @desc    Disconnect Facebook Page (legacy/all)
// @access  Private
router.post('/disconnect', disconnectFacebookPage);

// @route   DELETE /api/facebook/pages/:id
// @desc    Disconnect specific Facebook page
// @access  Private
router.delete('/pages/:id', disconnectFacebookPageById);

module.exports = router;

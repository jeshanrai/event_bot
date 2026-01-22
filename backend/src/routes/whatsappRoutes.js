const express = require('express');
const router = express.Router();
const {
    connectWhatsApp,
    getConnectionStatus,
    disconnectWhatsApp,
    verifyConnection
} = require('../controllers/whatsappController');
const { protect } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(protect);

// @route   POST /api/whatsapp/connect
// @desc    Exchange Facebook code for WhatsApp access token
// @access  Private
router.post('/connect', connectWhatsApp);

// @route   GET /api/whatsapp/status
// @desc    Get WhatsApp connection status
// @access  Private
router.get('/status', getConnectionStatus);

// @route   POST /api/whatsapp/disconnect
// @desc    Disconnect WhatsApp Business Account
// @access  Private
router.post('/disconnect', disconnectWhatsApp);

// @route   POST /api/whatsapp/verify
// @desc    Verify WhatsApp connection and token validity
// @access  Private
router.post('/verify', verifyConnection);

module.exports = router;

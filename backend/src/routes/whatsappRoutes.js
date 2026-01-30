const express = require('express');
const router = express.Router();
const {
    connectWhatsApp,
    getConnectionStatus,
    listWhatsAppAccounts,
    disconnectWhatsApp,
    disconnectWhatsAppAccount,
    verifyConnection
} = require('../controllers/whatsappController');
const { protect } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(protect);

// @route   POST /api/whatsapp/connect
// @desc    Exchange access token for long-lived token
// @access  Private
router.post('/connect', connectWhatsApp);

// @route   GET /api/whatsapp/status
// @desc    Get WhatsApp connection status (legacy/primary)
// @access  Private
router.get('/status', getConnectionStatus);

// @route   GET /api/whatsapp/accounts
// @desc    List all connected WhatsApp accounts
// @access  Private
router.get('/accounts', listWhatsAppAccounts);

// @route   POST /api/whatsapp/disconnect
// @desc    Disconnect WhatsApp Business Account (legacy/all)
// @access  Private
router.post('/disconnect', disconnectWhatsApp);

// @route   DELETE /api/whatsapp/accounts/:id
// @desc    Disconnect specific WhatsApp account
// @access  Private
router.delete('/accounts/:id', disconnectWhatsAppAccount);

// @route   POST /api/whatsapp/verify
// @desc    Verify WhatsApp connection and token validity
// @access  Private
router.post('/verify', verifyConnection);

module.exports = router;

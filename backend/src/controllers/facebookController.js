const FacebookCredentials = require('../models/facebookModel');

// Connect Facebook Page
const connectFacebookPage = async (req, res) => {
    try {
        const { page_id, page_name, page_access_token } = req.body;
        const userId = req.user.id;

        if (!page_id || !page_access_token) {
            return res.status(400).json({
                success: false,
                message: 'Page ID and Access Token are required'
            });
        }

        const credentials = await FacebookCredentials.upsert(userId, {
            page_id,
            page_name,
            page_access_token
        });

        res.json({
            success: true,
            message: 'Facebook Page connected successfully',
            data: {
                page_name: credentials.page_name,
                connected_at: credentials.connected_at
            }
        });
    } catch (error) {
        console.error('Facebook connection error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to connect Facebook Page',
            error: error.message
        });
    }
};

// Get connection status
const getFacebookStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const credentials = await FacebookCredentials.findActive(userId);

        if (!credentials) {
            return res.json({
                success: true,
                connected: false,
                message: 'Facebook Page not connected'
            });
        }

        res.json({
            success: true,
            connected: true,
            data: {
                page_id: credentials.page_id,
                page_name: credentials.page_name,
                connected_at: credentials.connected_at
            }
        });
    } catch (error) {
        console.error('Get status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get connection status',
            error: error.message
        });
    }
};

// Disconnect Facebook Page
const disconnectFacebookPage = async (req, res) => {
    try {
        const userId = req.user.id;
        const credentials = await FacebookCredentials.deactivate(userId);

        if (!credentials) {
            return res.status(404).json({
                success: false,
                message: 'No Facebook connection found'
            });
        }

        res.json({
            success: true,
            message: 'Facebook Page disconnected successfully'
        });
    } catch (error) {
        console.error('Disconnect error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to disconnect Facebook Page',
            error: error.message
        });
    }
};

module.exports = {
    connectFacebookPage,
    getFacebookStatus,
    disconnectFacebookPage
};

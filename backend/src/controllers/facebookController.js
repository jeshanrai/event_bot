const FacebookCredentials = require('../models/facebookModel');
const axios = require('axios'); // Add axios import

// Connect Facebook Page
const connectFacebookPage = async (req, res) => {
    try {
        const { page_id, page_name, page_access_token } = req.body;
        const userId = req.user.id;
        const restaurantId = req.user.restaurant_id;

        if (!page_id || !page_access_token) {
            return res.status(400).json({
                success: false,
                message: 'Page ID and Access Token are required'
            });
        }

        // 1. Save to Database
        const credentials = await FacebookCredentials.upsert(userId, restaurantId, {
            page_id,
            page_name,
            page_access_token
        });

        // 2. Subscribe App to Page Webhooks
        console.log(`Subscribing app to page ${page_id}...`);
        try {
            await axios.post(
                `https://graph.facebook.com/v18.0/${page_id}/subscribed_apps`,
                {
                    subscribed_fields: [
                        'messages',
                        'messaging_postbacks',
                        'messaging_optins',
                        'message_deliveries',
                        'message_reads'
                    ]
                },
                {
                    params: { access_token: page_access_token }
                }
            );
            console.log('✅ App subscribed to page webhooks successfully');
        } catch (subError) {
            console.error('⚠️ Failed to subscribe app to page webhooks:', subError.response?.data || subError.message);
            // We don't fail the whole request, but we warn the user
        }

        // 3. Generate webhook URL
        const webhookUrl = `${process.env.BACKEND_URL || 'https://api.chotkari.com'}/webhook/facebook/${page_id}`;
        await FacebookCredentials.updateWebhookUrl(credentials.id, webhookUrl);

        res.json({
            success: true,
            message: 'Facebook Page connected and subscribed successfully',
            data: {
                id: credentials.id,
                page_name: credentials.page_name,
                page_id: credentials.page_id,
                webhook_url: webhookUrl,
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

// Get connection status (backward compatibility - returns first active)
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
                id: credentials.id,
                page_id: credentials.page_id,
                page_name: credentials.page_name,
                webhook_url: credentials.webhook_url,
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

// List all Facebook pages for the restaurant
const listFacebookPages = async (req, res) => {
    try {
        const restaurantId = req.user.restaurant_id;

        const pages = await FacebookCredentials.findByRestaurantId(restaurantId);

        const pagesWithStatus = pages.map(page => ({
            id: page.id,
            page_id: page.page_id,
            page_name: page.page_name,
            status: page.status,
            is_active: page.is_active,
            webhook_url: page.webhook_url,
            connected_at: page.connected_at
        }));

        res.json({
            success: true,
            data: pagesWithStatus
        });

    } catch (error) {
        console.error('List pages error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to list Facebook pages',
            error: error.message
        });
    }
};

// Disconnect Facebook Page (backward compatibility - disconnects all)
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

// Disconnect specific Facebook page by ID
const disconnectFacebookPageById = async (req, res) => {
    try {
        const { id } = req.params;
        const restaurantId = req.user.restaurant_id;

        // Verify page belongs to this restaurant
        const page = await FacebookCredentials.findById(id);
        if (!page || page.restaurant_id !== restaurantId) {
            return res.status(404).json({
                success: false,
                message: 'Facebook page not found'
            });
        }

        await FacebookCredentials.deactivateById(id);

        res.json({
            success: true,
            message: 'Facebook page disconnected successfully'
        });

    } catch (error) {
        console.error('Disconnect page error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to disconnect Facebook page',
            error: error.message
        });
    }
};

module.exports = {
    connectFacebookPage,
    getFacebookStatus,
    listFacebookPages,
    disconnectFacebookPage,
    disconnectFacebookPageById
};


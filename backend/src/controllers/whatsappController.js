const axios = require('axios');
const WhatsAppCredentials = require('../models/whatsappModel');

// Exchange authorization code for access token
const connectWhatsApp = async (req, res) => {
    try {
        const { code, access_token: shortLivedToken } = req.body;
        const userId = req.user.id; // From auth middleware

        if (!code && !shortLivedToken) {
            return res.status(400).json({
                success: false,
                message: 'Authorization code or Access Token is required'
            });
        }

        let access_token;
        let token_expires_in = null;

        if (code) {
            // Exchange code for access token with Facebook Graph API
            // redirect_uri must match exactly what's in Facebook App OAuth settings
            const redirectUri = process.env.FACEBOOK_REDIRECT_URI ||
                process.env.FRONTEND_URL || 'https://restro-bot.chotkari.com/dashboard';

            const tokenResponse = await axios.get('https://graph.facebook.com/v24.0/oauth/access_token', {
                params: {
                    client_id: process.env.FACEBOOK_APP_ID,
                    client_secret: process.env.FACEBOOK_APP_SECRET,
                    code: code,
                    redirect_uri: redirectUri
                }
            });
            access_token = tokenResponse.data.access_token;
            token_expires_in = tokenResponse.data.expires_in;
        } else if (shortLivedToken) {
            // Exchange short-lived token for long-lived token
            const exchangeResponse = await axios.get('https://graph.facebook.com/v24.0/oauth/access_token', {
                params: {
                    grant_type: 'fb_exchange_token',
                    client_id: process.env.FACEBOOK_APP_ID,
                    client_secret: process.env.FACEBOOK_APP_SECRET,
                    fb_exchange_token: shortLivedToken
                }
            });
            access_token = exchangeResponse.data.access_token;
            token_expires_in = exchangeResponse.data.expires_in;
        }

        let wabaId = req.body.waba_id;
        const providedPhoneId = req.body.phone_number_id;

        // If WABA ID is not provided, try to fetch it
        if (!wabaId) {
            try {
                // Check businesses the user belongs to
                console.log('Searching for WABA in businesses...');
                const businessesResponse = await axios.get('https://graph.facebook.com/v24.0/me/businesses', {
                    params: {
                        fields: 'owned_whatsapp_business_accounts,client_whatsapp_business_accounts',
                        access_token: access_token
                    }
                });

                const businesses = businessesResponse.data.data;
                if (businesses && businesses.length > 0) {
                    for (const business of businesses) {
                        // Check owned accounts
                        if (business.owned_whatsapp_business_accounts?.data?.length > 0) {
                            wabaId = business.owned_whatsapp_business_accounts.data[0].id;
                            console.log('Found WABA in owned accounts:', wabaId);
                            break;
                        }
                        // Check client accounts
                        if (business.client_whatsapp_business_accounts?.data?.length > 0) {
                            wabaId = business.client_whatsapp_business_accounts.data[0].id;
                            console.log('Found WABA in client accounts:', wabaId);
                            break;
                        }
                    }
                }
            } catch (err) {
                console.log('Error searching for WABA:', err.response?.data || err.message);
            }
        }

        if (!wabaId && !providedPhoneId) {
            return res.status(400).json({
                success: false,
                message: 'No WhatsApp Business Account found. Please ensure you completed the signup steps.'
            });
        }

        // Get phone number details
        // If we have a specific phone ID, use that. Otherwise list all numbers from WABA.
        let phoneData = {};

        if (providedPhoneId) {
            const phoneResponse = await axios.get(
                `https://graph.facebook.com/v24.0/${providedPhoneId}`,
                {
                    params: {
                        fields: 'id,verified_name,display_phone_number,quality_rating',
                        access_token
                    }
                }
            );
            phoneData = phoneResponse.data;
            if (!wabaId) {
                // Try to infer WABA from phone number if we didn't have it? 
                // (Not easily possible, but we can proceed with just phone ID if WABA isn't strictly needed for sending messages, 
                // though it is needed for templates. For now, we assume we might lack it if the user didn't send it.)
            }
        } else if (wabaId) {
            const phoneResponse = await axios.get(
                `https://graph.facebook.com/v24.0/${wabaId}/phone_numbers`,
                {
                    params: { access_token }
                }
            );
            phoneData = phoneResponse.data.data?.[0] || {};
        }

        if (!phoneData.id) {
            return res.status(400).json({
                success: false,
                message: 'No WhatsApp Phone Number found.'
            });
        }

        // Calculate token expiration from API response or default to 60 days
        const expiresAt = new Date();
        if (token_expires_in) {
            // expires_in is in seconds, convert to milliseconds
            expiresAt.setTime(expiresAt.getTime() + (token_expires_in * 1000));
        } else {
            // Fallback to 60 days if expires_in not provided
            expiresAt.setDate(expiresAt.getDate() + 60);
        }

        // Store credentials in database
        const credentials = await WhatsAppCredentials.upsert(userId, {
            access_token,
            phone_number_id: phoneData.id,
            whatsapp_business_account_id: wabaId || 'unknown_waba',
            expires_at: expiresAt,
            phone_number: phoneData.verified_name,
            display_phone_number: phoneData.display_phone_number,
            quality_rating: phoneData.quality_rating
        });

        res.json({
            success: true,
            message: 'WhatsApp connected successfully',
            data: {
                phone_number: credentials.display_phone_number,
                quality_rating: credentials.quality_rating,
                connected_at: credentials.connected_at
            }
        });

    } catch (error) {
        console.error('WhatsApp connection error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to connect WhatsApp',
            error: error.response?.data?.error?.message || error.message
        });
    }
};

// Get connection status
const getConnectionStatus = async (req, res) => {
    try {
        const userId = req.user.id;

        const credentials = await WhatsAppCredentials.findActive(userId);

        if (!credentials) {
            return res.json({
                success: true,
                connected: false,
                message: 'WhatsApp not connected'
            });
        }

        // Check if token is expired
        const isExpired = credentials.expires_at && new Date(credentials.expires_at) < new Date();

        res.json({
            success: true,
            connected: !isExpired,
            data: {
                phone_number: credentials.display_phone_number,
                quality_rating: credentials.quality_rating,
                connected_at: credentials.connected_at,
                last_verified: credentials.last_verified_at,
                expires_at: credentials.expires_at,
                is_expired: isExpired
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

// Disconnect WhatsApp
const disconnectWhatsApp = async (req, res) => {
    try {
        const userId = req.user.id;

        const credentials = await WhatsAppCredentials.deactivate(userId);

        if (!credentials) {
            return res.status(404).json({
                success: false,
                message: 'No WhatsApp connection found'
            });
        }

        res.json({
            success: true,
            message: 'WhatsApp disconnected successfully'
        });

    } catch (error) {
        console.error('Disconnect error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to disconnect WhatsApp',
            error: error.message
        });
    }
};

// Verify and refresh token if needed
const verifyConnection = async (req, res) => {
    try {
        const userId = req.user.id;

        const credentials = await WhatsAppCredentials.findActive(userId);

        if (!credentials) {
            return res.status(404).json({
                success: false,
                message: 'No active WhatsApp connection'
            });
        }

        // Verify token with Facebook API
        const verifyResponse = await axios.get('https://graph.facebook.com/v24.0/me', {
            params: {
                access_token: credentials.access_token
            }
        });

        if (verifyResponse.data.id) {
            // Update last verified timestamp
            await WhatsAppCredentials.updateVerified(userId);

            return res.json({
                success: true,
                message: 'Connection verified successfully',
                valid: true
            });
        }

        res.json({
            success: false,
            message: 'Token is invalid',
            valid: false
        });

    } catch (error) {
        console.error('Verify error:', error.response?.data || error.message);

        // If token is invalid, deactivate it
        if (error.response?.status === 401 || error.response?.status === 400) {
            await WhatsAppCredentials.deactivate(req.user.id);
        }

        res.status(500).json({
            success: false,
            message: 'Token verification failed',
            valid: false,
            error: error.response?.data?.error?.message || error.message
        });
    }
};

module.exports = {
    connectWhatsApp,
    getConnectionStatus,
    disconnectWhatsApp,
    verifyConnection
};

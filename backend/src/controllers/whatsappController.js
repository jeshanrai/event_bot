const axios = require('axios');
const WhatsAppCredentials = require('../models/whatsappModel');

// Exchange short-lived access token for long-lived token (Embedded Signup flow)
const connectWhatsApp = async (req, res) => {
    try {
        const { access_token: shortLivedToken } = req.body;
        const userId = req.user.id; // From auth middleware
        const restaurantId = req.user.restaurant_id; // Restaurant ID from logged-in user

        if (!shortLivedToken) {
            return res.status(400).json({
                success: false,
                message: 'Access Token is required'
            });
        }

        let access_token;
        let token_expires_in = null;

        // Exchange short-lived token for long-lived token
        console.log('Exchanging short-lived token for long-lived token...');
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
        console.log('Successfully exchanged for long-lived token');

        let wabaId = req.body.waba_id;
        let providedPhoneId = req.body.phone_number_id;

        console.log('Received from frontend - WABA ID:', wabaId, 'Phone ID:', providedPhoneId);

        // AUTO-DISCOVERY: If WABA ID not provided by frontend (race condition),
        // use debug_token API to extract it from the token's granular_scopes.
        // NOTE: debug_token target_ids return the WABA ID for ALL whatsapp scopes,
        // so we can only discover the WABA ID here. The Phone Number ID must be
        // fetched separately via GET /{waba_id}/phone_numbers.
        if (!wabaId) {
            console.log('WABA ID not provided by frontend - attempting auto-discovery via debug_token...');
            try {
                const appId = process.env.FACEBOOK_APP_ID;
                const appSecret = process.env.FACEBOOK_APP_SECRET;
                const appToken = `${appId}|${appSecret}`;

                const debugResponse = await axios.get('https://graph.facebook.com/v24.0/debug_token', {
                    params: {
                        input_token: access_token,
                        access_token: appToken
                    }
                });

                const debugData = debugResponse.data?.data;
                console.log('debug_token response scopes:', JSON.stringify(debugData?.granular_scopes));

                if (debugData?.granular_scopes) {
                    for (const scope of debugData.granular_scopes) {
                        if (scope.scope === 'whatsapp_business_management' && scope.target_ids?.length > 0) {
                            wabaId = scope.target_ids[0];
                            console.log('✅ Auto-discovered WABA ID:', wabaId);
                            break;
                        }
                    }
                }
            } catch (debugErr) {
                console.warn('debug_token auto-discovery failed:', debugErr.response?.data || debugErr.message);
            }
        }

        // Calculate token expiration from API response or default to 60 days
        const expiresAt = new Date();
        if (token_expires_in) {
            expiresAt.setTime(expiresAt.getTime() + (token_expires_in * 1000));
        } else {
            expiresAt.setDate(expiresAt.getDate() + 60);
        }

        // If WABA/Phone STILL not available after auto-discovery, save with PENDING status
        if (!wabaId && !providedPhoneId) {
            console.log('WABA/Phone not available even after auto-discovery - saving token with PENDING status');

            const credentials = await WhatsAppCredentials.upsert(userId, restaurantId, {
                access_token,
                phone_number_id: null,
                whatsapp_business_account_id: null,
                expires_at: expiresAt,
                phone_number: null,
                display_phone_number: null,
                quality_rating: null,
                status: 'pending_signup'
            });

            return res.json({
                success: true,
                message: 'Token saved. Please complete WhatsApp Business signup to finish setup.',
                data: {
                    status: 'pending_signup',
                    connected_at: credentials.connected_at
                }
            });
        }

        // Get phone number details if phone ID is provided
        let phoneData = {};

        if (providedPhoneId) {
            try {
                console.log('Fetching phone number details for:', providedPhoneId);
                const phoneResponse = await axios.get(
                    `https://graph.facebook.com/v24.0/${providedPhoneId}`,
                    {
                        params: {
                            fields: 'id,display_phone_number,quality_rating',
                            access_token
                        }
                    }
                );
                phoneData = phoneResponse.data;
                console.log('Phone data retrieved:', phoneData);
            } catch (phoneErr) {
                console.log('Error fetching phone details:', phoneErr.response?.data || phoneErr.message);
                // Continue with provided phone ID even if details fetch fails
                phoneData = { id: providedPhoneId };
            }
        } else if (wabaId) {
            // If only WABA ID provided, try to get phone numbers from WABA
            try {
                console.log('Fetching phone numbers from WABA:', wabaId);
                const phoneResponse = await axios.get(
                    `https://graph.facebook.com/v24.0/${wabaId}/phone_numbers`,
                    {
                        params: {
                            fields: 'id,display_phone_number,quality_rating',
                            access_token
                        }
                    }
                );
                phoneData = phoneResponse.data.data?.[0] || {};
                console.log('Phone data from WABA:', phoneData);
            } catch (wabaErr) {
                console.log('Error fetching phones from WABA:', wabaErr.response?.data || wabaErr.message);
                // Save with WABA only, phone pending
                phoneData = {};
            }
        }

        // If still no phone data, save with what we have
        if (!phoneData.id && wabaId) {
            console.log('No phone number found, saving with WABA only');

            const credentials = await WhatsAppCredentials.upsert(userId, restaurantId, {
                access_token,
                phone_number_id: null,
                whatsapp_business_account_id: wabaId,
                expires_at: expiresAt,
                phone_number: null,
                display_phone_number: null,
                quality_rating: null,
                status: 'pending_phone'
            });

            return res.json({
                success: true,
                message: 'WhatsApp Business Account connected. Phone number setup pending.',
                data: {
                    status: 'pending_phone',
                    waba_id: wabaId,
                    connected_at: credentials.connected_at
                }
            });
        }

        // Store credentials in database - full connection with phone number
        const credentials = await WhatsAppCredentials.upsert(userId, restaurantId, {
            access_token,
            phone_number_id: phoneData.id,
            whatsapp_business_account_id: wabaId || null,
            expires_at: expiresAt,
            phone_number: phoneData.display_phone_number || null,
            display_phone_number: phoneData.display_phone_number || null,
            quality_rating: phoneData.quality_rating || null,
            status: 'active'
        });

        // Generate webhook URL
        const webhookUrl = `${process.env.BACKEND_URL || 'https://api.chotkari.com'}/webhook/whatsapp/${phoneData.id}`;
        await WhatsAppCredentials.updateWebhookUrl(credentials.id, webhookUrl);

        res.json({
            success: true,
            message: 'WhatsApp connected successfully',
            data: {
                id: credentials.id,
                phone_number: credentials.display_phone_number,
                quality_rating: credentials.quality_rating,
                webhook_url: webhookUrl,
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

// Get connection status (backward compatibility - returns first active)
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
                id: credentials.id,
                phone_number: credentials.display_phone_number,
                quality_rating: credentials.quality_rating,
                webhook_url: credentials.webhook_url,
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

// List all WhatsApp accounts for the restaurant
const listWhatsAppAccounts = async (req, res) => {
    try {
        const restaurantId = req.user.restaurant_id;

        const accounts = await WhatsAppCredentials.findByRestaurantId(restaurantId);

        // Check expiration for each account
        const accountsWithStatus = accounts.map(acc => {
            const isExpired = acc.expires_at && new Date(acc.expires_at) < new Date();
            return {
                id: acc.id,
                phone_number: acc.display_phone_number,
                phone_number_id: acc.phone_number_id,
                quality_rating: acc.quality_rating,
                status: isExpired ? 'expired' : acc.status,
                is_active: acc.is_active && !isExpired,
                webhook_url: acc.webhook_url,
                connected_at: acc.connected_at,
                expires_at: acc.expires_at
            };
        });

        res.json({
            success: true,
            data: accountsWithStatus
        });

    } catch (error) {
        console.error('List accounts error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to list WhatsApp accounts',
            error: error.message
        });
    }
};

// Disconnect WhatsApp (backward compatibility - disconnects all)
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

// Disconnect specific WhatsApp account by ID
const disconnectWhatsAppAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const restaurantId = req.user.restaurant_id;

        // Verify account belongs to this restaurant
        const account = await WhatsAppCredentials.findById(id);
        if (!account || account.restaurant_id !== restaurantId) {
            return res.status(404).json({
                success: false,
                message: 'WhatsApp account not found'
            });
        }

        await WhatsAppCredentials.deactivateById(id);

        res.json({
            success: true,
            message: 'WhatsApp account disconnected successfully'
        });

    } catch (error) {
        console.error('Disconnect account error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to disconnect WhatsApp account',
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
    listWhatsAppAccounts,
    disconnectWhatsApp,
    disconnectWhatsAppAccount,
    verifyConnection
};


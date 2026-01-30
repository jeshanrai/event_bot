const WhatsAppCredentials = require('../models/whatsappModel');
const FacebookCredentials = require('../models/facebookModel');

/**
 * Identify the restaurant based on proper identifiers in the webhook payload
 */
const WebhookRouter = {
    /**
     * Find restaurant credentials for WhatsApp webhook
     * @param {string} phoneNumberId - The phone number ID from the webhook
     * @returns {Promise<Object>} The credentials with restaurant_id
     */
    routeWhatsApp: async (phoneNumberId) => {
        try {
            if (!phoneNumberId) return null;

            const credentials = await WhatsAppCredentials.findByPhoneNumberId(phoneNumberId);

            if (credentials) {
                console.log(`📡 Webhook routed to restaurant: ${credentials.restaurant_name} (ID: ${credentials.restaurant_id})`);
                return credentials;
            } else {
                console.warn(`⚠️ No credentials found for Phone Number ID: ${phoneNumberId}`);
                return null;
            }
        } catch (error) {
            console.error('Webhook routing error:', error);
            return null;
        }
    },

    /**
     * Find restaurant credentials for Facebook webhook
     * @param {string} pageId - The page ID from the webhook
     * @returns {Promise<Object>} The credentials with restaurant_id
     */
    routeFacebook: async (pageId) => {
        try {
            if (!pageId) return null;

            const credentials = await FacebookCredentials.findByPageId(pageId);

            if (credentials) {
                console.log(`📡 Webhook routed to restaurant: ${credentials.restaurant_name} (ID: ${credentials.restaurant_id})`);
                return credentials;
            } else {
                console.warn(`⚠️ No credentials found for Page ID: ${pageId}`);
                return null;
            }
        } catch (error) {
            console.error('Webhook routing error:', error);
            return null;
        }
    }
};

module.exports = WebhookRouter;

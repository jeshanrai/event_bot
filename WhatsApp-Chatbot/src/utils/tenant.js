import db from "../db.js";

/**
 * Tenant Resolver Utility
 * Helps identify which restaurant a message belongs to based on platform metadata.
 */
const TenantResolver = {
  /**
   * Resolve Restaurant ID from WhatsApp Phone Number ID
   * @param {string} phoneNumberId - The metadata.phone_number_id from webhook
   * @returns {Promise<Object>} - Restaurant details { id, name, webhook_url }
   */
  resolveWhatsAppTenant: async (phoneNumberId) => {
    if (!phoneNumberId) return null;

    try {
      // 1. Try to find strict match in credentials
      const res = await db.query(
        `SELECT r.id, r.name, wc.webhook_url
         FROM whatsapp_credentials wc
         JOIN restaurants r ON wc.restaurant_id = r.id
         WHERE wc.phone_number_id = $1 AND wc.is_active = true`,
        [phoneNumberId],
      );

      if (res.rows.length > 0) {
        return res.rows[0];
      }

      console.warn(
        `⚠️ TenantResolver: No active WhatsApp credential found for ${phoneNumberId}`,
      );
      return null;
    } catch (error) {
      console.error("❌ TenantResolver WhatsApp Error:", error);
      return null;
    }
  },

  /**
   * Resolve Restaurant ID from Facebook Page ID
   * @param {string} pageId - The recipient.id from webhook
   * @returns {Promise<Object>} - Restaurant details { id, name, webhook_url }
   */
  resolveMessengerTenant: async (pageId) => {
    if (!pageId) return null;

    try {
      // 1. Try to find strict match
      const res = await db.query(
        `SELECT r.id, r.name, fc.webhook_url
         FROM facebook_credentials fc
         JOIN restaurants r ON fc.restaurant_id = r.id
         WHERE fc.page_id = $1 AND fc.is_active = true`,
        [pageId],
      );

      if (res.rows.length > 0) {
        return res.rows[0];
      }

      console.warn(
        `⚠️ TenantResolver: No active Facebook credential found for Page ID ${pageId}`,
      );
      return null;
    } catch (error) {
      console.error("❌ TenantResolver Messenger Error:", error);
      return null;
    }
  },

  /**
   * Get Page Access Token for a specific Page ID
   * @param {string} pageId
   * @returns {Promise<string|null>}
   */
  getMessengerToken: async (pageId) => {
    if (!pageId) return null;
    try {
      const res = await db.query(
        "SELECT page_access_token FROM facebook_credentials WHERE page_id = $1 AND is_active = true",
        [pageId],
      );
      return res.rows[0]?.page_access_token || null;
    } catch (error) {
      console.error("❌ Error fetching Messenger token:", error);
      return null;
    }
  },

  /**
   * Get Page Access Token for a specific Restaurant ID
   * @param {number} restaurantId
   * @returns {Promise<string|null>}
   */
  getMessengerTokenByRestaurantId: async (restaurantId) => {
    if (!restaurantId) return null;
    try {
      const res = await db.query(
        "SELECT page_access_token FROM facebook_credentials WHERE restaurant_id = $1 AND is_active = true",
        [restaurantId],
      );
      return res.rows[0]?.page_access_token || null;
    } catch (error) {
      console.error(
        "❌ Error fetching Messenger token by restaurant ID:",
        error,
      );
      return null;
    }
  },

  /**
   * Get WhatsApp Access Token for a specific Phone Number ID
   * @param {string} phoneNumberId
   * @returns {Promise<string|null>}
   */
  getWhatsAppToken: async (phoneNumberId) => {
    if (!phoneNumberId) return null;
    try {
      const res = await db.query(
        "SELECT access_token FROM whatsapp_credentials WHERE phone_number_id = $1 AND is_active = true",
        [phoneNumberId],
      );
      return res.rows[0]?.access_token || null;
    } catch (error) {
      console.error("❌ Error fetching WhatsApp token:", error);
      return null;
    }
  },

  /**
   * ⭐ NEW: Get WhatsApp credentials (phoneNumberId + accessToken) by lookup key
   * Lookup key can be: phone_number_id OR restaurant_id
   * @param {string|number} lookupKey - Phone Number ID or Restaurant ID
   * @returns {Promise<Object|null>} - { phoneNumberId, accessToken } or null
   */
  getWhatsAppCredentials: async (lookupKey) => {
    if (!lookupKey) return null;

    try {
      console.log(
        `🔍 TenantResolver: Looking up WhatsApp credentials for: ${lookupKey}`,
      );

      // Try to find by phone_number_id first, then by restaurant_id
      const res = await db.query(
        `SELECT phone_number_id, access_token 
                 FROM whatsapp_credentials 
                 WHERE (phone_number_id = $1 OR restaurant_id = $1) 
                   AND is_active = true 
                 LIMIT 1`,
        [lookupKey],
      );

      if (res.rows.length > 0) {
        const { phone_number_id, access_token } = res.rows[0];
        console.log(
          `✅ TenantResolver: Found credentials - Phone Number ID: ${phone_number_id}`,
        );
        return {
          phoneNumberId: phone_number_id,
          accessToken: access_token,
        };
      }

      console.warn(
        `⚠️ TenantResolver: No active WhatsApp credentials found for: ${lookupKey}`,
      );
      return null;
    } catch (error) {
      console.error(
        "❌ TenantResolver: Error fetching WhatsApp credentials:",
        error,
      );
      return null;
    }
  },
};

export default TenantResolver;

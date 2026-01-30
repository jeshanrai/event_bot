import { handleIncomingMessage } from '../orchestrator/index.js';
import { sendWhatsAppMessage } from '../whatsapp/sendmessage.js';
import TenantResolver from '../utils/tenant.js';

export default async function whatsappWebhook(req, res) {
  console.log('\n🟢 [WHATSAPP WEBHOOK] POST /whatsapp-webhook');
  // console.log('📦 Body:', JSON.stringify(req.body, null, 2)); // Too verbose for prod

  const object = req.body.object;

  if (object !== 'whatsapp_business_account') {
    console.log('⚠️ Not a WhatsApp event, ignoring');
    return res.sendStatus(200);
  }

  const entry = req.body.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;
  const messages = value?.messages;

  if (Array.isArray(messages)) {
    // RESOLVE TENANT ONCE PER BATCH (Usually same phone number ID for the batch)
    const phoneNumberId = value?.metadata?.phone_number_id;
    let restaurantId = null;
    let restaurantName = 'Unknown';

    if (phoneNumberId) {
      const tenant = await TenantResolver.resolveWhatsAppTenant(phoneNumberId);
      if (tenant) {
        restaurantId = tenant.id;
        restaurantName = tenant.name;
        console.log(`🏢 Tenant Resolved: ${restaurantName} (ID: ${restaurantId})`);
      } else {
        console.warn(`⚠️ No tenant found for Phone Number ID: ${phoneNumberId}. Ignoring message.`);
        return res.sendStatus(200);
      }
    }

    for (const message of messages) {
      const userId = message.from;
      const userName = value?.contacts?.[0]?.profile?.name || 'Unknown';
      const messageType = message.type || 'text';

      console.log(`\n━━━ WHATSAPP MESSAGE ━━━`);
      console.log(`📱 From: ${userName} (${userId})`);
      console.log(`🏢 To Business: ${phoneNumberId} [${restaurantName}]`);
      console.log(`📝 Type: ${messageType}`);

      // Build message object for orchestrator
      const msgObject = {
        userId,
        platform: 'whatsapp',
        type: messageType,
        businessId: phoneNumberId, // Raw Phone ID
        restaurantId: restaurantId, // Resolved Restaurant ID
        restaurantName: restaurantName
      };

      // Handle different message types
      if (messageType === 'text') {
        msgObject.text = message.text?.body || '';
        console.log(`💬 Message: ${msgObject.text}`);
      } else if (messageType === 'interactive') {
        // Handle button replies and list replies
        msgObject.interactive = message.interactive;
        if (message.interactive?.type === 'button_reply') {
          msgObject.text = message.interactive.button_reply.title;
          console.log(`🔘 Button: ${message.interactive.button_reply.title} (${message.interactive.button_reply.id})`);
        } else if (message.interactive?.type === 'list_reply') {
          msgObject.text = message.interactive.list_reply.title;
          console.log(`📋 List Selection: ${message.interactive.list_reply.title} (${message.interactive.list_reply.id})`);
        } else if (message.interactive?.type === 'order_details') {
          // Handle Catalog Cart (Order Details)
          const orderDetails = message.interactive.order_details;
          console.log(`🛒 Catalog Cart Received: ${orderDetails.items.length} items`);
          msgObject.catalogOrder = orderDetails; // Pass full order details to orchestrator
          msgObject.text = "Sent a cart"; // Fallback text for log/history
        }
      } else if (messageType === 'location') {
        // Handle location shared by user
        msgObject.location = message.location;
        const loc = message.location;
        msgObject.text = loc.address || loc.name ||
          `📍 Location: ${loc.latitude}, ${loc.longitude}`;
        console.log(`📍 Location: ${msgObject.text}`);
      }

      // Skip if no processable content
      if (!msgObject.text && !msgObject.interactive && !msgObject.catalogOrder) {
        console.log(`⏭️ Skipping unsupported message type`);
        continue;
      }

      try {
        await handleIncomingMessage(msgObject);
        console.log(`✅ WhatsApp message processed for ${userId}\n`);
      } catch (error) {
        console.error(`❌ Error processing WhatsApp message:`, error);
        // Send friendly error message (Optional: verify if we should send error to user)
        // await sendWhatsAppMessage(userId, "Sorry, I encountered an error. Please try again.");
      }
    }
  }

  return res.sendStatus(200);
}


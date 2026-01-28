import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import whatsappWebhook from './webhooks/whatsapp.js';
import messengerWebhook from './webhooks/messenger.js';
import { handleIncomingMessage } from './orchestrator/index.js';
import db from './db.js';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { sendMessage } from './services/response.js';
import { updateContext } from './orchestrator/context.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();

// Serve static files for Messenger Webview
app.use(express.static(path.join(__dirname, '..', 'public')));

app.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event; // Defines 'event' variable

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`❌ Stripe Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata.orderId;

    console.log(`💰 Payment received for Order #${orderId}`);

    try {
      // 1. Update order status in database
      const orderResult = await db.query(
        "UPDATE orders SET status = 'confirmed', payment_method = 'online' WHERE id = $1 RETURNING customer_platform_id, platform",
        [orderId]
      );
      console.log(`✅ Order #${orderId} marked as confirmed/online`);

      // 2. Notify the user
      if (orderResult.rows.length > 0) {
        const { customer_platform_id: userId, platform } = orderResult.rows[0];

        if (userId && platform) {
          await sendMessage(
            userId,
            platform,
            `✅ Payment Received!\n\nYour order #${orderId} has been confirmed. We'll verify it shortly and start preparing your food! 👨‍🍳\n\nThank you for choosing Momo House! 🥟`
          );

          // 3. Clear/Reset User Context
          // This ensures they don't get stuck in the 'awaiting_payment' stage
          await updateContext(userId, {
            stage: 'order_complete',
            lastAction: 'payment_confirmed_webhook',
            cart: [],
            pendingOrder: null
          });
          console.log(`🔔 User ${userId} notified and context reset.`);
        }
      }

    } catch (error) {
      console.error(`❌ Error updating order #${orderId}:`, error);
    }
  }

  res.send();
});

app.use(express.json());

// Handle JSON parse errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('❌ JSON Parse Error:', err.message);
    return res.status(400).send({ status: 400, message: err.message }); // Bad request
  }
  next();
});

const port = process.env.PORT || 3000;

// Platform-specific verification tokens
const verifyToken = process.env.VERIFY_TOKEN; // Legacy/shared token
const whatsappVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN || process.env.VERIFY_TOKEN;
const messengerVerifyToken = process.env.MESSENGER_VERIFY_TOKEN || process.env.VERIFY_TOKEN;

/* ======================
   DATABASE HEALTH CHECK
====================== */
async function checkDatabase() {
  try {
    const result = await db.query('SELECT NOW()');
    console.log('✅ Database connected:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('⚠️  Server will continue but database features may not work');
    return false;
  }
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});



/* ======================
   DATABASE VIEWER ENDPOINTS
   View all data in the database
====================== */

// View all foods
app.get('/db/foods', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM foods ORDER BY category, id');
    res.json({
      success: true,
      count: result.rows.length,
      foods: result.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// View all orders
app.get('/db/orders', async (req, res) => {
  try {
    const orders = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json({
      success: true,
      count: orders.rows.length,
      orders: orders.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// View order details with items
app.get('/db/orders/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    const items = await db.query(`
      SELECT oi.*, f.name, f.price, f.category 
      FROM order_items oi 
      JOIN foods f ON oi.food_id = f.id 
      WHERE oi.order_id = $1
    `, [orderId]);

    if (order.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({
      success: true,
      order: order.rows[0],
      items: items.rows,
      total: items.rows.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// View all order items
app.get('/db/order-items', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT oi.*, f.name as food_name, f.price, o.customer_id, o.status 
      FROM order_items oi 
      JOIN foods f ON oi.food_id = f.id 
      JOIN orders o ON oi.order_id = o.id 
      ORDER BY oi.created_at DESC
    `);
    res.json({
      success: true,
      count: result.rows.length,
      items: result.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Database summary dashboard
app.get('/db', async (req, res) => {
  try {
    const foods = await db.query('SELECT COUNT(*) as count FROM foods');
    const orders = await db.query('SELECT COUNT(*) as count FROM orders');
    const orderItems = await db.query('SELECT COUNT(*) as count FROM order_items');
    const recentOrders = await db.query(`
      SELECT o.*, 
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count,
        (SELECT SUM(f.price * oi.quantity) FROM order_items oi JOIN foods f ON oi.food_id = f.id WHERE oi.order_id = o.id) as total
      FROM orders o 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    const categoryStats = await db.query(`
      SELECT category, COUNT(*) as count, AVG(price) as avg_price 
      FROM foods 
      GROUP BY category 
      ORDER BY category
    `);

    res.json({
      success: true,
      summary: {
        totalFoods: parseInt(foods.rows[0].count),
        totalOrders: parseInt(orders.rows[0].count),
        totalOrderItems: parseInt(orderItems.rows[0].count)
      },
      categoryStats: categoryStats.rows,
      recentOrders: recentOrders.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ======================
   WHATSAPP WEBHOOK ENDPOINTS
   Dedicated endpoints for WhatsApp Business API
====================== */

// WhatsApp Webhook Verification
app.get('/whatsapp-webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('🟢 [WhatsApp Webhook Verification]');
  console.log(`Mode: ${mode}, Token: ${token ? '***' : 'missing'}`);

  if (mode === 'subscribe' && token === whatsappVerifyToken) {
    console.log('✅ WHATSAPP WEBHOOK VERIFIED');
    return res.status(200).send(challenge);
  }
  console.log('❌ WhatsApp webhook verification failed');
  res.sendStatus(403);
});

// WhatsApp Webhook Receiver
app.post('/whatsapp-webhook', async (req, res) => {
  return whatsappWebhook(req, res);
});

/* ======================
   MESSENGER WEBHOOK ENDPOINTS
   Dedicated endpoints for Facebook Messenger
====================== */

// Messenger Webhook Verification
app.get('/messenger-webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('🟦 [Messenger Webhook Verification]');
  console.log(`Mode: ${mode}, Token: ${token ? '***' : 'missing'}`);

  if (mode === 'subscribe' && token === messengerVerifyToken) {
    console.log('✅ MESSENGER WEBHOOK VERIFIED');
    return res.status(200).send(challenge);
  }
  console.log('❌ Messenger webhook verification failed');
  res.sendStatus(403);
});

// Messenger Webhook Receiver
app.post('/messenger-webhook', async (req, res) => {
  console.log('\n🟦 [MESSENGER WEBHOOK] POST /messenger-webhook');
  return messengerWebhook(req, res);
});



/* ======================
   LEGACY COMBINED WEBHOOK (backward compatibility)
   Routes to appropriate handler based on body.object
====================== */
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('🔔 [Legacy Webhook Verification]');

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ LEGACY WEBHOOK VERIFIED');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

app.post('/webhook', async (req, res) => {
  console.log('\n🔔 [LEGACY WEBHOOK] POST /webhook');
  console.log('📦 Body:', JSON.stringify(req.body, null, 2));

  const object = req.body.object;

  // Route to WhatsApp handler
  if (object === 'whatsapp_business_account') {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const messages = value?.messages;

    if (Array.isArray(messages)) {
      for (const message of messages) {
        const userId = message.from;
        const userName = value?.contacts?.[0]?.profile?.name || 'Unknown';
        const messageType = message.type || 'text';

        console.log(`\n━━━ INCOMING MESSAGE ━━━`);
        console.log(`📱 From: ${userName} (${userId})`);
        console.log(`📝 Type: ${messageType}`);

        const msgObject = {
          userId,
          platform: 'whatsapp',
          type: messageType
        };

        if (messageType === 'text') {
          msgObject.text = message.text?.body || '';
          console.log(`💬 Message: ${msgObject.text}`);
        } else if (messageType === 'interactive') {
          msgObject.interactive = message.interactive;
          if (message.interactive?.type === 'button_reply') {
            msgObject.text = message.interactive.button_reply.title;
            console.log(`🔘 Button: ${message.interactive.button_reply.title} (${message.interactive.button_reply.id})`);
          } else if (message.interactive?.type === 'list_reply') {
            msgObject.text = message.interactive.list_reply.title;
            console.log(`📋 List Selection: ${message.interactive.list_reply.title} (${message.interactive.list_reply.id})`);
          }
        }

        if (!msgObject.text && !msgObject.interactive) {
          console.log(`⏭️ Skipping unsupported message type`);
          continue;
        }

        try {
          await handleIncomingMessage(msgObject);
          console.log(`✅ Message processed for ${userId}\n`);
        } catch (error) {
          console.error(`❌ Error processing message:`, error);
        }
      }
    }

    return res.sendStatus(200);
  }

  // Route to Messenger handler
  if (object === 'page') {
    return messengerWebhook(req, res);
  }

  res.sendStatus(200);
});

/* ======================
   SERVER START
====================== */
const server = app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  await checkDatabase();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await db.end();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Keep the server alive and handle errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
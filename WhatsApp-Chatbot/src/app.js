import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import whatsappWebhook from "./webhooks/whatsapp.js";
import messengerWebhook from "./webhooks/messenger.js";
import { handleIncomingMessage } from "./orchestrator/index.js";
import db from "./db.js";
import dotenv from "dotenv";
import Stripe from "stripe";
import { sendMessage, sendButtonMessage } from "./services/response.js";
import { updateContext, getContext } from "./orchestrator/context.js";
import * as restaurantTools from "./tools/restaurant.tools.js";
import { processOrderStatusChange } from "./services/orderNotifications.js";
import TenantResolver from "./utils/tenant.js";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();

// Allow Messenger Webview embedding
app.use((req, res, next) => {
  res.removeHeader("X-Frame-Options");
  res.setHeader(
    "Content-Security-Policy",
    "frame-ancestors https://www.facebook.com https://messenger.com",
  );
  next();
});

// Serve static files

// STRIPE WEBHOOK (Must be before express.json() middleware)
// Uses express.raw() to get the raw body buffer for signature verification
app.post(
  "/stripe-webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      // req.body is now a raw Buffer thanks to express.raw()
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.error(`❌ Stripe Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderId = session.metadata.orderId;

      console.log(`💰 Payment received for Order #${orderId}`);

      try {
        // 1. Update order status in database and get restaurant_id for multi-tenant token lookup
        const orderResult = await db.query(
          "UPDATE orders SET status = 'confirmed', payment_method = 'online' WHERE id = $1 RETURNING customer_platform_id, platform, restaurant_id",
          [orderId],
        );
        console.log(`✅ Order #${orderId} marked as confirmed/online`);

        // 2. Notify the user
        if (orderResult.rows.length > 0) {
          const {
            customer_platform_id: userId,
            platform,
            restaurant_id: restaurantId,
          } = orderResult.rows[0];

          // Format order number as 4 digits
          const orderNumber = String(orderId).padStart(4, "0");

          if (userId && platform) {
            // Fetch order items for the receipt
            const itemsResult = await db.query(
              `
            SELECT oi.quantity, f.name, f.price 
            FROM order_items oi 
            JOIN foods f ON oi.food_id = f.id 
            WHERE oi.order_id = $1
          `,
              [orderId],
            );

            const orderItemsText = itemsResult.rows
              .map(
                (item) =>
                  `• ${item.name} x${item.quantity} - AUD ${(item.price * item.quantity).toFixed(2)}`,
              )
              .join("\n");

            const orderTotal = itemsResult.rows.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0,
            );

            console.log(
              `📤 Sending payment confirmation to ${userId} on ${platform} (Restaurant: ${restaurantId || "default"})`,
            );

            // Fetch restaurant name dynamically
            const restResult = await db.query(
              "SELECT name FROM restaurants WHERE id = $1",
              [restaurantId || 1],
            );
            const restaurantName = restResult.rows[0]?.name || "our restaurant";

            await sendMessage(
              userId,
              platform,
              `✅ Payment Received!\n\n📋 Order Number: #${orderNumber}\n\n🍽️ Your Order:\n${orderItemsText}\n\n💰 Total: AUD ${orderTotal.toFixed(2)}\n\nYour order has been confirmed. We'll start preparing your food right away! 👨‍🍳\n\nThank you for choosing ${restaurantName}! 🥟`,
              { businessId: restaurantId },
            );

            // 3. Clear/Reset User Context but PRESERVE age_verified
            // This ensures they don't get stuck in the 'awaiting_payment' stage
            const existingContext = await getContext(userId);
            await updateContext(userId, {
              ...existingContext,
              stage: "order_complete",
              lastAction: "payment_confirmed_webhook",
              cart: [],
              pendingOrder: null,
            });
            console.log(
              `🔔 User ${userId} notified and context reset (age_verified preserved).`,
            );
          }
        }
      } catch (error) {
        console.error(`❌ Error updating order #${orderId}:`, error);
      }
    }

    res.send();
  },
);

// Stripe Payment Success Page
app.get("/payment/success", async (req, res) => {
  const sessionId = req.query.session_id;

  try {
    if (!sessionId) {
      return res.status(400).send("Session ID missing");
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const orderId = session.metadata.orderId;
    const orderNumber = String(orderId).padStart(4, "0");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Successful</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; text-align: center; padding: 40px 20px; background-color: #f0f2f5; }
          .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
          .icon { font-size: 64px; margin-bottom: 20px; }
          h1 { color: #1a1a1a; margin-bottom: 10px; }
          p { color: #4a4a4a; font-size: 18px; line-height: 1.5; }
          .order-number { font-weight: bold; color: #2e7d32; font-size: 24px; margin: 20px 0; }
          .close-btn { background-color: #0084ff; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 20px; width: 100%; transition: background 0.2s; }
          .close-btn:hover { background-color: #006bce; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">✅</div>
          <h1>Payment Successful!</h1>
          <p>Thank you for your order.</p>
          <div class="order-number">Order #${orderNumber}</div>
          <p>Your order has been confirmed.</p>
          <p style="font-size: 14px; color: #888;">You can now close this window and return to the chat.</p>
          <button class="close-btn" onclick="closeWindow()">Close Window</button>
        </div>
        <script>
          (function(d, s, id){
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) {return;}
            js = d.createElement(s); js.id = id;
            js.src = "//connect.facebook.net/en_US/messenger.Extensions.js";
            fjs.parentNode.insertBefore(js, fjs);
          }(document, 'script', 'Messenger'));

          function closeWindow() {
             try {
                // Try Messenger Extensions first
                MessengerExtensions.requestCloseBrowser(function success() {
                    console.log("Webview closing");
                }, function error(err) {
                    // Fallback to window.close
                    console.error(err);
                    window.close();
                });
             } catch (e) {
                // Fallback if SDK not loaded
                window.close();
             }
          }
        </script>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error("Error verifying session:", error);
    res.status(500).send("Error verifying payment");
  }
});

app.use(express.static(path.join(__dirname, "..", "public")));

// JSON body parser for all routes AFTER Stripe webhook
// Stripe webhook uses express.raw() so it won't be affected
app.use(express.json());

// API: Get restaurant info
app.get("/api/restaurant/:id", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.id) || 1;
    const result = await db.query(
      "SELECT id, name, address, contact_number FROM restaurants WHERE id = $1",
      [restaurantId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Restaurant not found" });
    }

    res.json({ success: true, restaurant: result.rows[0] });
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    res.status(500).json({ success: false, error: "Failed to fetch restaurant" });
  }
});

// API: Get menu items or categories
app.get("/api/menu", async (req, res) => {
  try {
    const { category, all, restaurantId } = req.query;
    const targetRestaurantId = parseInt(restaurantId) || 1; // Default to 1 if missing

    let items = [];

    if (all === "true") {
      // Fetch ALL items for client-side filtering
      items = await restaurantTools.getFoodByName("", targetRestaurantId);

      // Fallback: If no items found for target restaurant, try default restaurant (ID 1)
      if (items.length === 0 && targetRestaurantId !== 1) {
        console.log(
          `⚠️ No items found for Restaurant ${targetRestaurantId}, falling back to Default (1)`,
        );
        items = await restaurantTools.getFoodByName("", 1);
      }
    } else if (category) {
      items = await restaurantTools.getMenu(category, targetRestaurantId);

      // Fallback
      if (items.length === 0 && targetRestaurantId !== 1) {
        items = await restaurantTools.getMenu(category, 1);
      }
    } else {
      // Return categories
      items = await restaurantTools.getMenu(null, targetRestaurantId);

      // Fallback
      if (items.length === 0 && targetRestaurantId !== 1) {
        items = await restaurantTools.getMenu(null, 1);
      }
    }

    // Fetch restaurant details
    const restaurantRes = await db.query(
      "SELECT id, name, address, contact_number, currency FROM restaurants WHERE id = $1",
      [targetRestaurantId]
    );
    const restaurant = restaurantRes.rows[0] || null;

    res.json({ success: true, items, restaurant });
  } catch (error) {
    console.error("Error fetching menu:", error);
    res.status(500).json({ success: false, error: "Failed to fetch menu" });
  }
});

// API: Get User Cart from Session
app.get("/api/cart/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await db.query(
      "SELECT cart FROM sessions WHERE user_id = $1",
      [userId],
    );

    if (result.rows.length > 0) {
      res.json({ success: true, cart: result.rows[0].cart || [] });
    } else {
      res.json({ success: true, cart: [] });
    }
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ success: false, error: "Failed to fetch cart" });
  }
});

// API: Update User Cart in Session
app.post("/api/cart/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { items } = req.body; // Expecting array of { foodId, quantity, name, price }

    if (!Array.isArray(items)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid cart format" });
    }

    // Check if session exists
    const sessionCheck = await db.query(
      "SELECT user_id FROM sessions WHERE user_id = $1",
      [userId],
    );

    if (sessionCheck.rows.length === 0) {
      // Create session if not exists
      await db.query(
        "INSERT INTO sessions (user_id, context, cart) VALUES ($1, $2, $3)",
        [userId, "{}", JSON.stringify(items)],
      );
    } else {
      // Update existing session
      await db.query(
        "UPDATE sessions SET cart = $1, updated_at = NOW() WHERE user_id = $2",
        [JSON.stringify(items), userId],
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ success: false, error: "Failed to update cart" });
  }
});

// WEBVIEW ORDER ENDPOINT (Multi-Platform)
app.post("/api/messenger/order", async (req, res) => {
  const { userId, items } = req.body;

  console.log(`📥 Received Webview Order for ${userId}:`, items);

  if (!userId || !items || items.length === 0) {
    return res.status(400).json({ success: false, message: "Invalid data" });
  }

  try {
    // 1. Get or Init Context
    let context = await getContext(userId);
    if (!context) {
      context = { userId, platform: "messenger", cart: [] };
    }

    // 2. Detect platform from context or user ID format
    // WhatsApp user IDs are typically 12-15 digits
    // Messenger PSIDs are typically 16+ digits
    let platform = context.platform || "messenger";
    if (!context.platform) {
      // Auto-detect based on user ID length (heuristic)
      if (userId.length >= 12 && userId.length <= 15) {
        platform = "whatsapp";
        console.log(
          `🔍 Auto-detected platform: WhatsApp (based on user ID format)`,
        );
      } else {
        platform = "messenger";
        console.log(
          `🔍 Auto-detected platform: Messenger (based on user ID format)`,
        );
      }
      context.platform = platform;
    }

    let cart = context.cart || [];
    const addedItems = [];

    // 3. Process Items (similar to router.add_multiple_items)
    if (req.body.mode === "replace") {
      cart = []; // Reset cart if replacing
    }

    for (const item of items) {
      // Search DB for price/name validation
      const matchingStart = await restaurantTools.getFoodByName(item.name);
      if (matchingStart.length > 0) {
        const food = matchingStart[0];

        // Update Cart
        const existingItem = cart.find((c) => c.foodId === food.id);
        if (existingItem) {
          existingItem.quantity += item.quantity;
        } else {
          cart.push({
            foodId: food.id,
            name: food.name,
            price: parseFloat(food.price),
            quantity: item.quantity,
          });
        }
        addedItems.push({ name: food.name, quantity: item.quantity });
      }
    }

    // 4. Update Context
    await updateContext(userId, {
      ...context,
      cart,
      stage: "quick_cart_action",
      lastAction: "webview_order",
    });

    // 5. Send Confirmation (Platform-aware)
    const total = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const addedItemCount = addedItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    const addedText = addedItems
      .map((i) => {
        // Find item to get price
        const originalItem = cart.find((c) => c.name === i.name);
        const price = originalItem ? originalItem.price : 0;
        return `• ${i.name} x${i.quantity} - AUD ${price * i.quantity}`;
      })
      .join("\n");

    await sendButtonMessage(
      userId,
      platform, // Use detected platform
      "✅ Items Added from Menu!",
      `${addedText}\n\n🛒 Cart Total: ${itemCount} items | AUD ${total}`,
      "Select to continue:",
      [
        {
          type: "reply",
          reply: { id: "view_all_categories", title: "Add More ➕" },
        },
        {
          type: "reply",
          reply: { id: "proceed_checkout", title: "Checkout 🛒" },
        },
      ],
      { businessId: context.businessId },
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error processing webview order:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// WEBVIEW CHECKOUT WITH PAYMENT METHOD
app.post("/api/webview/checkout", async (req, res) => {
  const { userId, items, paymentMethod, restaurantId } = req.body;

  console.log(
    `📥 Webview Checkout - User: ${userId}, Payment: ${paymentMethod}, Restaurant: ${restaurantId || "default"}`,
  );

  if (!userId || !items || items.length === 0) {
    return res.status(400).json({ success: false, message: "Invalid data" });
  }

  if (!paymentMethod || !["cash", "stripe"].includes(paymentMethod)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid payment method" });
  }

  // Parse restaurantId - use from request body or fallback to context
  const targetRestaurantId = parseInt(restaurantId) || null;

  try {
    // 1. Get or Init Context
    let context = await getContext(userId);
    if (!context) {
      context = { userId, platform: "messenger", cart: [] };
    }

    // Update context with restaurantId if provided
    if (targetRestaurantId && context.restaurantId !== targetRestaurantId) {
      context.restaurantId = targetRestaurantId;
    }

    // Detect platform
    let platform = context.platform || "messenger";
    if (!context.platform) {
      if (userId.length >= 12 && userId.length <= 15) {
        platform = "whatsapp";
      } else {
        platform = "messenger";
      }
      context.platform = platform;
    }

    // 2. Validate and prepare cart items - USE restaurantId for lookup
    const cart = [];
    const effectiveRestaurantId = context.restaurantId || targetRestaurantId;

    for (const item of items) {
      // Pass restaurantId to ensure we get the correct restaurant's foods
      const matchingItems = await restaurantTools.getFoodByName(
        item.name,
        effectiveRestaurantId,
      );
      if (matchingItems.length > 0) {
        const food = matchingItems[0];
        cart.push({
          foodId: food.id,
          name: food.name,
          price: parseFloat(food.price),
          quantity: item.quantity,
        });
      }
    }

    if (cart.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No valid items in cart" });
    }

    // 3. Create order in database - associate with correct restaurant
    const finalOrder = await restaurantTools.finalizeOrderFromCart(
      userId,
      cart,
      {
        service_type: "dine_in",
        payment_method: paymentMethod === "cash" ? "cash" : null,
        platform: platform,
        restaurant_id: effectiveRestaurantId,
      },
    );

    const orderId = finalOrder.id;
    console.log(
      `✅ Order #${orderId} created for ${userId} (Restaurant: ${effectiveRestaurantId || "default"})`,
    );

    // 4. Handle payment method
    if (paymentMethod === "stripe") {
      // Generate Stripe payment link
      const paymentUrl = await restaurantTools.generatePaymentLink(orderId);

      console.log(`💳 Stripe payment link generated for Order #${orderId}`);

      // Update context
      await updateContext(userId, {
        ...context,
        cart: [],
        stage: "awaiting_payment",
        lastAction: "webview_stripe_checkout",
        pendingOrder: { orderId, items: cart, total: finalOrder.total_amount },
      });

      return res.json({
        success: true,
        orderId: orderId,
        paymentUrl: paymentUrl,
      });
    } else {
      // Cash payment - confirm order immediately
      await restaurantTools.selectPayment(orderId, "CASH");

      // Format order number as 4 digits
      const orderNumber = String(orderId).padStart(4, "0");

      console.log(`💵 Cash payment confirmed for Order #${orderNumber}`);

      // Build order details string
      const orderItemsText = cart
        .map(
          (item) =>
            `• ${item.name} x${item.quantity} - AUD ${(item.price * item.quantity).toFixed(2)}`,
        )
        .join("\n");
      const orderTotal = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      // Send confirmation message to user with order details
      // Pass businessId from context to use correct page token for multi-tenant
      await sendMessage(
        userId,
        platform,
        `✅ Order Confirmed!\n\n📋 Order Number: #${orderNumber}\n\n🍽️ Your Order:\n${orderItemsText}\n\n💰 Total: AUD ${orderTotal.toFixed(2)}\n\nPlease pay cash at the counter.\nShow this number to staff.\n\nThank you for your order! 🙏`,
        { businessId: context.businessId },
      );

      // Update context but PRESERVE age_verified
      await updateContext(userId, {
        ...context,
        cart: [],
        stage: "order_complete",
        lastAction: "webview_cash_checkout",
        pendingOrder: null,
      });

      // Reset session (preserves age_verified column)
      await restaurantTools.deleteSessionAfterOrder(userId);

      return res.json({
        success: true,
        orderId: orderId,
        message: "Order confirmed with cash payment",
      });
    }
  } catch (error) {
    console.error("Error in webview checkout:", error);
    res
      .status(500)
      .json({ success: false, message: "Checkout failed: " + error.message });
  }
});

// Handle JSON parse errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("❌ JSON Parse Error:", err.message);
    return res.status(400).send({ status: 400, message: err.message }); // Bad request
  }
  next();
});

const port = process.env.PORT || 3000;

// Platform-specific verification tokens
const verifyToken = process.env.VERIFY_TOKEN; // Legacy/shared token
const whatsappVerifyToken =
  process.env.WHATSAPP_VERIFY_TOKEN || process.env.VERIFY_TOKEN;
const messengerVerifyToken =
  process.env.MESSENGER_VERIFY_TOKEN || process.env.VERIFY_TOKEN;

/* ======================
   DATABASE HEALTH CHECK
====================== */
async function checkDatabase() {
  try {
    const result = await db.query("SELECT NOW()");
    console.log("✅ Database connected:", result.rows[0].now);
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.log("⚠️  Server will continue but database features may not work");
    return false;
  }
}

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

/* ======================
   DATABASE VIEWER ENDPOINTS
   View all data in the database
====================== */

// View all foods
app.get("/db/foods", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM foods ORDER BY category, id");
    res.json({
      success: true,
      count: result.rows.length,
      foods: result.rows,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// View all orders
app.get("/db/orders", async (req, res) => {
  try {
    const orders = await db.query(
      "SELECT * FROM orders ORDER BY created_at DESC",
    );
    res.json({
      success: true,
      count: orders.rows.length,
      orders: orders.rows,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// View order details with items
app.get("/db/orders/:id", async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await db.query("SELECT * FROM orders WHERE id = $1", [
      orderId,
    ]);
    const items = await db.query(
      `
      SELECT oi.*, f.name, f.price, f.category 
      FROM order_items oi 
      JOIN foods f ON oi.food_id = f.id 
      WHERE oi.order_id = $1
    `,
      [orderId],
    );

    if (order.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    res.json({
      success: true,
      order: order.rows[0],
      items: items.rows,
      total: items.rows.reduce(
        (sum, item) => sum + parseFloat(item.price) * item.quantity,
        0,
      ),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// View all order items
app.get("/db/order-items", async (req, res) => {
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
      items: result.rows,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Database summary dashboard
app.get("/db", async (req, res) => {
  try {
    const foods = await db.query("SELECT COUNT(*) as count FROM foods");
    const orders = await db.query("SELECT COUNT(*) as count FROM orders");
    const orderItems = await db.query(
      "SELECT COUNT(*) as count FROM order_items",
    );
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
        totalOrderItems: parseInt(orderItems.rows[0].count),
      },
      categoryStats: categoryStats.rows,
      recentOrders: recentOrders.rows,
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
app.get("/whatsapp-webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("🟢 [WhatsApp Webhook Verification]");
  console.log(`Mode: ${mode}, Token: ${token ? "***" : "missing"}`);

  if (mode === "subscribe" && token === whatsappVerifyToken) {
    console.log("✅ WHATSAPP WEBHOOK VERIFIED");
    return res.status(200).send(challenge);
  }
  console.log("❌ WhatsApp webhook verification failed");
  res.sendStatus(403);
});

// WhatsApp Webhook Receiver
app.post("/whatsapp-webhook", async (req, res) => {
  return whatsappWebhook(req, res);
});

/* ======================
   MESSENGER WEBHOOK ENDPOINTS
   Dedicated endpoints for Facebook Messenger
====================== */

// Messenger Webhook Verification
app.get("/messenger-webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("🟦 [Messenger Webhook Verification]");
  console.log(`Mode: ${mode}, Token: ${token ? "***" : "missing"}`);

  if (mode === "subscribe" && token === messengerVerifyToken) {
    console.log("✅ MESSENGER WEBHOOK VERIFIED");
    return res.status(200).send(challenge);
  }
  console.log("❌ Messenger webhook verification failed");
  res.sendStatus(403);
});

// Messenger Webhook Receiver
app.post("/messenger-webhook", async (req, res) => {
  console.log("\n🟦 [MESSENGER WEBHOOK] POST /messenger-webhook");
  return messengerWebhook(req, res);
});

/* ======================
   LEGACY COMBINED WEBHOOK (backward compatibility)
   Routes to appropriate handler based on body.object
====================== */
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("🔔 [Legacy Webhook Verification]");

  if (mode === "subscribe" && token === verifyToken) {
    console.log("✅ LEGACY WEBHOOK VERIFIED");
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  console.log("\n🔔 [LEGACY WEBHOOK] POST /webhook");
  console.log("📦 Body:", JSON.stringify(req.body, null, 2));

  const object = req.body.object;

  // Route to WhatsApp handler
  if (object === "whatsapp_business_account") {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const messages = value?.messages;

    // Resolve Tenant for Multi-tenant support
    const phoneNumberId = value?.metadata?.phone_number_id;
    let restaurantId = null;
    let restaurantName = "Unknown";

    if (phoneNumberId) {
      const tenant = await TenantResolver.resolveWhatsAppTenant(phoneNumberId);
      if (tenant) {
        restaurantId = tenant.id;
        restaurantName = tenant.name;
        console.log(
          `🏢 [LEGACY] Tenant Resolved: ${restaurantName} (ID: ${restaurantId})`,
        );
      } else {
        console.warn(
          `⚠️ [LEGACY] No tenant found for Phone Number ID: ${phoneNumberId}.`,
        );
      }
    }

    if (Array.isArray(messages)) {
      for (const message of messages) {
        const userId = message.from;
        const userName = value?.contacts?.[0]?.profile?.name || "Unknown";
        const messageType = message.type || "text";

        console.log(`\n━━━ INCOMING MESSAGE ━━━`);
        console.log(`📱 From: ${userName} (${userId})`);
        console.log(`📝 Type: ${messageType}`);

        const msgObject = {
          userId,
          platform: "whatsapp",
          type: messageType,
          businessId: phoneNumberId,
          restaurantId: restaurantId,
          restaurantName: restaurantName,
        };

        if (messageType === "text") {
          msgObject.text = message.text?.body || "";
          console.log(`💬 Message: ${msgObject.text}`);
        } else if (messageType === "interactive") {
          msgObject.interactive = message.interactive;
          if (message.interactive?.type === "button_reply") {
            msgObject.text = message.interactive.button_reply.title;
            console.log(
              `🔘 Button: ${message.interactive.button_reply.title} (${message.interactive.button_reply.id})`,
            );
          } else if (message.interactive?.type === "list_reply") {
            msgObject.text = message.interactive.list_reply.title;
            console.log(
              `📋 List Selection: ${message.interactive.list_reply.title} (${message.interactive.list_reply.id})`,
            );
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
  if (object === "page") {
    return messengerWebhook(req, res);
  }

  res.sendStatus(200);
});

app.get("/admin/orders", async (req, res) => {
  try {
    const { status, restaurant_id, limit = 50 } = req.query;

    let query = `
      SELECT 
        o.id,
        o.customer_platform_id,
        o.platform,
        o.restaurant_id,
        r.name as restaurant_name,
        o.status,
        o.queue_position,
        o.preparation_time_minutes,
        o.estimated_ready_time,
        o.actual_ready_time,
        o.total_amount,
        o.payment_method,
        o.service_type,
        o.notified_ready,
        o.created_at,
        o.status_updated_at,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN restaurants r ON o.restaurant_id = r.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND o.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (restaurant_id) {
      query += ` AND o.restaurant_id = $${paramIndex}`;
      params.push(restaurant_id);
      paramIndex++;
    }

    query += ` GROUP BY o.id, r.name ORDER BY o.created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await db.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      orders: result.rows,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================================================
// ADMIN: Get Single Order Details
// ================================================
app.get("/admin/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Get order with items
    const orderResult = await db.query(
      `
      SELECT 
        o.*,
        r.name as restaurant_name
      FROM orders o
      LEFT JOIN restaurants r ON o.restaurant_id = r.id
      WHERE o.id = $1
    `,
      [id],
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    // Get order items
    const itemsResult = await db.query(
      `
      SELECT 
        oi.*,
        f.name as food_name,
        f.price as food_price,
        f.category
      FROM order_items oi
      JOIN foods f ON oi.food_id = f.id
      WHERE oi.order_id = $1
    `,
      [id],
    );

    // Get status history
    const historyResult = await db.query(
      `
      SELECT * FROM order_status_history
      WHERE order_id = $1
      ORDER BY created_at DESC
    `,
      [id],
    );

    res.json({
      success: true,
      order: orderResult.rows[0],
      items: itemsResult.rows,
      history: historyResult.rows,
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================================================
// ADMIN: Update Order Status
// ================================================
app.post("/admin/orders/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, changed_by = "admin", notes } = req.body;

    // Validate status
    const validStatuses = [
      "created",
      "confirmed",
      "preparing",
      "ready",
      "completed",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // Process status change (this will also send notifications)
    const result = await processOrderStatusChange(
      id,
      status,
      changed_by,
      notes,
    );

    if (result.success) {
      res.json({
        success: true,
        message: `Order ${id} status updated to ${status}`,
        orderId: result.orderId,
        newStatus: result.newStatus,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================================================
// ADMIN: Get Kitchen Queue (Active Orders)
// ================================================
app.get("/admin/kitchen-queue", async (req, res) => {
  try {
    const { restaurant_id } = req.query;

    let query = `
      SELECT 
        o.id,
        o.status,
        o.queue_position,
        o.preparation_time_minutes,
        o.estimated_ready_time,
        o.created_at,
        COUNT(oi.id) as item_count,
        STRING_AGG(f.name || ' x' || oi.quantity, ', ') as items_summary
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN foods f ON oi.food_id = f.id
      WHERE o.status IN ('confirmed', 'preparing')
    `;

    const params = [];
    if (restaurant_id) {
      query += ` AND o.restaurant_id = $1`;
      params.push(restaurant_id);
    }

    query += ` GROUP BY o.id ORDER BY o.queue_position, o.created_at`;

    const result = await db.query(query, params);

    res.json({
      success: true,
      queue_length: result.rows.length,
      orders: result.rows,
    });
  } catch (error) {
    console.error("Error fetching kitchen queue:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================================================
// ADMIN: Bulk Update Multiple Orders
// ================================================
app.post("/admin/orders/bulk-update", async (req, res) => {
  try {
    const { order_ids, status, changed_by = "admin" } = req.body;

    if (!Array.isArray(order_ids) || order_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: "order_ids must be a non-empty array",
      });
    }

    const results = [];
    for (const orderId of order_ids) {
      const result = await processOrderStatusChange(
        orderId,
        status,
        changed_by,
      );
      results.push(result);
    }

    const successCount = results.filter((r) => r.success).length;

    res.json({
      success: true,
      message: `Updated ${successCount} out of ${order_ids.length} orders`,
      results,
    });
  } catch (error) {
    console.error("Error bulk updating orders:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ================================================
// ADMIN: Dashboard Statistics
// ================================================
app.get("/admin/dashboard", async (req, res) => {
  try {
    const { restaurant_id } = req.query;

    let restaurantFilter = "";
    const params = [];

    if (restaurant_id) {
      restaurantFilter = "WHERE restaurant_id = $1";
      params.push(restaurant_id);
    }

    // Get order statistics
    const statsQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'created') as created_orders,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_orders,
        COUNT(*) FILTER (WHERE status = 'preparing') as preparing_orders,
        COUNT(*) FILTER (WHERE status = 'ready') as ready_orders,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today_orders,
        SUM(total_amount) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today_revenue,
        AVG(preparation_time_minutes) FILTER (WHERE status IN ('ready', 'completed')) as avg_prep_time
      FROM orders
      ${restaurantFilter}
    `;

    const statsResult = await db.query(statsQuery, params);

    res.json({
      success: true,
      statistics: statsResult.rows[0],
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/notify-order-status", async (req, res) => {
  try {
    const { orderId, newStatus, changedBy } = req.body;

    console.log(`📞 Notification request: Order ${orderId} → ${newStatus}`);

    const result = await processOrderStatusChange(
      orderId,
      newStatus,
      changedBy || "admin",
    );

    res.json(result);
  } catch (error) {
    console.error("❌ Notification error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ======================
   SERVER START
====================== */
const server = app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  await checkDatabase();
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await db.end();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

// Keep the server alive and handle errors
server.on("error", (error) => {
  console.error("Server error:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

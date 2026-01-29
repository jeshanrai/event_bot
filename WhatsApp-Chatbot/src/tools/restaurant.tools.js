/**
 * RESTAURANT TOOLS LAYER
 * 
 * This layer:
 * ❌ NEVER formats messages
 * ❌ NEVER calls OpenAI/LLM
 * ✅ ONLY returns raw data from database
 */

import db from '../db.js';
import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Get menu categories or items by category
 * @param {string|null} category - Optional category to filter by
 * @returns {Promise<Array>} - Array of categories or food items
 */
async function getMenu(category = null) {
  if (!category) {
    // Return all distinct categories
    const res = await db.query(
      'SELECT DISTINCT category FROM foods WHERE available = true ORDER BY category'
    );
    return res.rows;
  }

  // Return food items for specific category
  const res = await db.query(
    'SELECT id, name, price, description, image_url FROM foods WHERE category = $1 AND available = true ORDER BY name',
    [category]
  );
  return res.rows;
}

/**
 * Get a specific food item by ID
 * @param {number} foodId - The food item ID
 * @returns {Promise<Object|null>} - Food item or null
 */
async function getFoodById(foodId) {
  const res = await db.query(
    'SELECT id, name, price, description, category, image_url FROM foods WHERE id = $1 AND available = true',
    [foodId]
  );
  return res.rows[0] || null;
}

/**
 * Get a food item by name (case-insensitive partial match)
 * @param {string} name - Food name to search
 * @returns {Promise<Array>} - Matching food items
 */
async function getFoodByName(name) {
  const res = await db.query(
    'SELECT id, name, price, description, category, image_url FROM foods WHERE LOWER(name) LIKE LOWER($1) AND available = true',
    [`%${name}%`]
  );
  return res.rows;
}

/**
 * Get recommended food items based on tag/keyword
 * @param {string} tag - Tag or keyword (e.g., "spicy", "soup", "veg")
 * @returns {Promise<Array>} - Matching food items
 */
async function getRecommendedFoods(tag) {
  if (!tag || tag === 'random') {
    // Random selection
    const res = await db.query(
      `SELECT id, name, price, description, category, image_url 
       FROM foods 
       WHERE available = true 
       ORDER BY RANDOM() 
       LIMIT 1`
    );
    return res.rows;
  }

  const searchTerm = `%${tag}%`;
  const res = await db.query(
    `SELECT id, name, price, description, category, image_url 
     FROM foods 
     WHERE available = true 
     AND (
       LOWER(name) LIKE LOWER($1) OR 
       LOWER(description) LIKE LOWER($1) OR 
       LOWER(category) LIKE LOWER($1)
     )
     ORDER BY name
     LIMIT 5`,
    [searchTerm]
  );
  return res.rows;
}

/**
 * Create a new order for a WhatsApp user
 * @param {string} userWaId - WhatsApp user ID
 * @returns {Promise<Object>} - Created order with id
 */
async function createOrder(userWaId) {
  const res = await db.query(
    'INSERT INTO orders (customer_platform_id, restaurant_id, status, created_at) VALUES ($1, 1, $2, NOW()) RETURNING id, status, created_at',
    [userWaId, 'created']
  );
  return res.rows[0];
}

/**
 * Get current active order for a user (not completed/cancelled)
 * @param {string} userWaId - WhatsApp user ID
 * @returns {Promise<Object|null>} - Active order or null
 */
async function getActiveOrder(userWaId) {
  const res = await db.query(
    `SELECT id, status, payment_method, created_at 
     FROM orders 
     WHERE customer_platform_id = $1 AND status NOT IN ('completed', 'cancelled') 
     ORDER BY created_at DESC 
     LIMIT 1`,
    [userWaId]
  );
  return res.rows[0] || null;
}

/**
 * Add an item to an order
 * @param {number} orderId - Order ID
 * @param {number} foodId - Food item ID
 * @param {number} quantity - Quantity to add
 * @returns {Promise<Object>} - Created order item
 */
async function addItem(orderId, foodId, quantity = 1) {
  // Check if item already exists in order
  const existing = await db.query(
    'SELECT id, quantity FROM order_items WHERE order_id = $1 AND food_id = $2',
    [orderId, foodId]
  );

  if (existing.rows.length > 0) {
    // Update quantity
    const newQty = existing.rows[0].quantity + quantity;
    const res = await db.query(
      'UPDATE order_items SET quantity = $1 WHERE id = $2 RETURNING id, order_id, food_id, quantity',
      [newQty, existing.rows[0].id]
    );
    return res.rows[0];
  }

  // Insert new item
  // First get the price of the food
  const food = await db.query('SELECT price FROM foods WHERE id = $1', [foodId]);
  const unitPrice = food.rows[0]?.price || 0;

  const res = await db.query(
    'INSERT INTO order_items (order_id, food_id, quantity, unit_price) VALUES ($1, $2, $3, $4) RETURNING id, order_id, food_id, quantity, unit_price',
    [orderId, foodId, quantity, unitPrice]
  );
  return res.rows[0];
}

/**
 * Remove an item from an order
 * @param {number} orderId - Order ID
 * @param {number} foodId - Food item ID
 * @returns {Promise<boolean>} - Success status
 */
async function removeItem(orderId, foodId) {
  const res = await db.query(
    'DELETE FROM order_items WHERE order_id = $1 AND food_id = $2 RETURNING id',
    [orderId, foodId]
  );
  return res.rowCount > 0;
}

/**
 * Get all items in an order with food details
 * @param {number} orderId - Order ID
 * @returns {Promise<Array>} - Order items with food details
 */
async function getOrderItems(orderId) {
  const res = await db.query(
    `SELECT oi.id, oi.quantity, f.id as food_id, f.name, f.price, f.category,
            (oi.quantity * f.price) as subtotal
     FROM order_items oi
     JOIN foods f ON oi.food_id = f.id
     WHERE oi.order_id = $1
     ORDER BY f.name`,
    [orderId]
  );
  return res.rows;
}

/**
 * Update order total amount in orders table
 * @param {number} orderId - Order ID
 * @returns {Promise<Object>} - Updated order
 */
async function updateOrderTotal(orderId) {
  // Calculate total from items
  const resTotal = await db.query(
    `SELECT COALESCE(SUM(quantity * unit_price), 0) as total
     FROM order_items
     WHERE order_id = $1`,
    [orderId]
  );
  const total = resTotal.rows[0].total || 0;

  // Update orders table
  const res = await db.query(
    'UPDATE orders SET total_amount = $1 WHERE id = $2 RETURNING id, total_amount',
    [total, orderId]
  );
  return res.rows[0];
}

/**
 * Get order total
 * @param {number} orderId - Order ID
 * @returns {Promise<number>} - Total amount
 */
async function getOrderTotal(orderId) {
  const res = await db.query(
    `SELECT total_amount FROM orders WHERE id = $1`,
    [orderId]
  );
  // Fallback to calculation if null (for legacy/migrated data)
  if (res.rows[0]?.total_amount == null) {
    return await updateOrderTotal(orderId).then(o => parseFloat(o.total_amount));
  }
  return parseFloat(res.rows[0].total_amount) || 0;
}

/**
 * Update order status
 * @param {number} orderId - Order ID
 * @param {string} status - New status
 * @returns {Promise<Object>} - Updated order
 */
async function updateOrderStatus(orderId, status) {
  const res = await db.query(
    'UPDATE orders SET status = $1 WHERE id = $2 RETURNING id, status, payment_method',
    [status, orderId]
  );
  return res.rows[0];
}

/**
 * Select payment method and confirm order
 * @param {number} orderId - Order ID
 * @param {string} method - Payment method ('ONLINE', 'CASH', 'CASH_COUNTER')
 * @returns {Promise<Object>} - Updated order
 */
async function selectPayment(orderId, method) {
  // Map payment method values to database acceptable values
  const paymentMethodMap = {
    'ONLINE': 'esewa', // Default to esewa for online
    'CASH': 'cash',
    'CASH_COUNTER': 'cash'
  };

  const dbMethod = paymentMethodMap[method] || method;

  const res = await db.query(
    'UPDATE orders SET payment_method = $1, status = $2 WHERE id = $3 RETURNING id, status, payment_method',
    [dbMethod, 'confirmed', orderId]
  );
  return res.rows[0];
}

/**
 * Cancel an order
 * @param {number} orderId - Order ID
 * @returns {Promise<Object>} - Cancelled order
 */
async function cancelOrder(orderId) {
  const res = await db.query(
    'UPDATE orders SET status = $1 WHERE id = $2 RETURNING id, status',
    ['cancelled', orderId]
  );
  return res.rows[0];
}

/**
 * Get order history for a user
 * @param {string} userWaId - WhatsApp user ID
 * @param {number} limit - Max number of orders
 * @returns {Promise<Array>} - Order history
 */
async function getOrderHistory(userWaId, limit = 5) {
  const res = await db.query(
    `SELECT o.id, o.status, o.payment_method, o.created_at,
            COUNT(oi.id) as item_count,
            COALESCE(SUM(oi.quantity * oi.unit_price), 0) as total
     FROM orders o
     LEFT JOIN order_items oi ON o.id = oi.order_id
     WHERE o.customer_platform_id = $1
     GROUP BY o.id
     ORDER BY o.created_at DESC
     LIMIT $2`,
    [userWaId, limit]
  );
  return res.rows;
}


/**
 * Get category image (first item's image from category)
 * @param {string} category - Category name
 * @returns {Promise<string|null>} - Image URL or null
 */
async function getCategoryImage(category) {
  const res = await db.query(
    'SELECT image_url FROM foods WHERE category = $1 AND available = true AND image_url IS NOT NULL LIMIT 1',
    [category]
  );
  return res.rows[0]?.image_url || null;
}

/**
 * Finalize order from session cart
 * Transfers cart items from sessions table to orders + order_items tables
 * @param {string} userId - WhatsApp user ID
 * @param {Array} cart - Cart items from session
 * @param {Object} orderDetails - Additional order details (service_type, delivery_address, etc.)
 * @returns {Promise<Object>} - Created order with id, status, and total
 */
async function finalizeOrderFromCart(userId, cart, orderDetails = {}) {
  if (!cart || cart.length === 0) {
    throw new Error('Cart is empty. Cannot create order.');
  }

  try {
    // Map payment method values to database acceptable values
    const paymentMethodMap = {
      'ONLINE': 'esewa', // Default to esewa for online
      'CASH': 'cash',
      'CASH_COUNTER': 'cash'
    };

    const dbPaymentMethod = orderDetails.payment_method
      ? (paymentMethodMap[orderDetails.payment_method] || orderDetails.payment_method)
      : null;

    // Start transaction
    await db.query('BEGIN');

    // 1. Create order
    const orderRes = await db.query(
      `INSERT INTO orders (customer_platform_id, restaurant_id, status, service_type, payment_method, platform, created_at) 
       VALUES ($1, 1, $2, $3, $4, $5, NOW()) 
       RETURNING id, status, created_at`,
      [
        userId,
        'created',
        orderDetails.service_type || 'dine_in', // Explicitly defaulting to dine_in as requested
        dbPaymentMethod,
        orderDetails.platform || 'whatsapp'
      ]
    );

    const orderId = orderRes.rows[0].id;

    // 2. Add each cart item to order_items
    let totalAmount = 0;
    for (const cartItem of cart) {
      // Get current food price from database
      const foodRes = await db.query(
        'SELECT price FROM foods WHERE id = $1',
        [cartItem.foodId]
      );

      if (foodRes.rows.length === 0) {
        await db.query('ROLLBACK');
        throw new Error(`Food item ${cartItem.foodId} not found`);
      }

      const unitPrice = parseFloat(foodRes.rows[0].price);
      const quantity = cartItem.quantity || 1;
      const itemTotal = unitPrice * quantity;

      // Insert order item
      await db.query(
        `INSERT INTO order_items (order_id, food_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, cartItem.foodId, quantity, unitPrice]
      );

      totalAmount += itemTotal;
    }

    // 3. Update order total
    await db.query(
      'UPDATE orders SET total_amount = $1 WHERE id = $2',
      [totalAmount, orderId]
    );

    // Commit transaction
    await db.query('COMMIT');

    return {
      id: orderId,
      status: 'created',
      total_amount: totalAmount,
      created_at: orderRes.rows[0].created_at,
      itemCount: cart.length
    };
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  }
}

/**
 * Clear cart from session after order is finalized
 * @param {string} userId - WhatsApp user ID
 * @returns {Promise<void>}
 */
async function clearSessionCart(userId) {
  await db.query(
    `UPDATE sessions SET cart = '[]' WHERE user_id = $1`,
    [userId]
  );
}

/**
 * Delete entire session after order is completed
 * Called after order is successfully placed with payment
 * @param {string} userId - WhatsApp user ID
 * @returns {Promise<void>}
 */
async function deleteSessionAfterOrder(userId) {
  try {
    await db.query(
      `DELETE FROM sessions WHERE user_id = $1`,
      [userId]
    );
    console.log(`✅ Session deleted for user ${userId} after order completion`);
  } catch (error) {
    console.error(`Warning: Could not delete session for user ${userId}:`, error);
    // Don't fail the order if session deletion fails
  }
}

/**
 * Generate a Stripe Payment Link for an order
 * @param {number} orderId - Order ID
 * @returns {Promise<string>} - Payment URL
 */
async function generatePaymentLink(orderId) {
  // 1. Get order details and items
  const orderRes = await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);
  const order = orderRes.rows[0];

  if (!order) throw new Error('Order not found');

  const itemsRes = await db.query(
    `SELECT f.name, f.price, oi.quantity 
     FROM order_items oi 
     JOIN foods f ON oi.food_id = f.id 
     WHERE oi.order_id = $1`,
    [orderId]
  );

  const lineItems = itemsRes.rows.map(item => ({
    price_data: {
      currency: 'aud',
      product_data: {
        name: item.name,
      },
      unit_amount: Math.round(parseFloat(item.price) * 100),
    },
    quantity: item.quantity,
  }));

  // Create session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: 'https://restro-bot.chotkari.com/payment/success?session_id={CHECKOUT_SESSION_ID}', // Placeholder URL
    cancel_url: 'https://restro-bot.chotkari.com/payment/cancel',
    metadata: {
      orderId: orderId.toString()
    }
  });

  return session.url;
}

/**
 * Update order payment status (from webhook)
 * @param {number} orderId - Order ID
 * @param {string} status - New status (e.g. 'paid', 'confirmed')
 * @returns {Promise<void>}
 */
async function updateOrderPaymentStatus(orderId, status) {
  await db.query(
    "UPDATE orders SET status = $1, payment_method = 'online' WHERE id = $2",
    [status, orderId]
  );
}

/**
 * Get restaurant details by WhatsApp Phone Number ID (Tenant Resolution)
 * @param {string} phoneNumberId - The metadata.phone_number_id from webhook
 * @returns {Promise<Object|null>} - Restaurant object or null
 */
async function getRestaurantByPhoneNumberId(phoneNumberId) {
  // If no specific credentials found, fallback to default restaurant (id=1) for backward compatibility/dev
  // In production, you might want to enforce strict matching.

  // 1. Try to find strict match
  const res = await db.query(
    `SELECT r.* 
     FROM restaurants r
     JOIN users u ON r.id = u.restaurant_id
     JOIN whatsapp_credentials wc ON u.id = wc.user_id
     WHERE wc.phone_number_id = $1`,
    [phoneNumberId]
  );

  if (res.rows.length > 0) return res.rows[0];

  // 2. Fallback (Optional: remove this if you want strict multi-tenancy)
  // For now, return default restaurant to keep existing bot working
  console.log(`⚠️ No tenant found for phone_number_id ${phoneNumberId}, using default.`);
  const defaultRes = await db.query('SELECT * FROM restaurants WHERE id = 1');
  return defaultRes.rows[0] || null;
}

/**
 * Get food item by Catalog Item ID (Retailer ID)
 * @param {string} catalogItemId - The retailer ID from WhatsApp Catalog
 * @returns {Promise<Object|null>} - Food item or null
 */
async function getFoodByCatalogId(catalogItemId) {
  const res = await db.query(
    'SELECT id, name, price, description, category, image_url FROM foods WHERE catalog_item_id = $1 AND available = true',
    [catalogItemId]
  );
  return res.rows[0] || null;
}

export {
  getMenu,
  getFoodById,
  getFoodByName,
  getRecommendedFoods,
  createOrder,
  getActiveOrder,
  addItem,
  removeItem,
  getOrderItems,
  getOrderTotal,
  updateOrderTotal,
  updateOrderStatus,
  selectPayment,
  cancelOrder,
  getOrderHistory,
  getCategoryImage,
  finalizeOrderFromCart,
  clearSessionCart,
  deleteSessionAfterOrder,
  generatePaymentLink,
  updateOrderPaymentStatus,
  getRestaurantByPhoneNumberId,
  getFoodByCatalogId
};
